module dparcel::dparcel;

use std::string::{Self, String};
use sui::random;
use sui::random::Random;
use sui::table::{Self, Table};

public struct KUAIDI has drop {}

// 错误码
const EKeyDoesNotExist: u64 = 0;

public struct WalrusStorageInfo has key {
    id: UID,
    storage_info: Table<address, Table<String, String>>,  // 用户地址 |-> <取件码 -> 文件名>
    pickup_code: Table<String, String>,                   // 取件码 |-> Walrus blobID
    code_to_uploader: Table<String, address>,             // 取件码 |-> 上传者地址
    user_pickup_codes: Table<address, vector<String>>,    // 用户地址 |-> 取件码列表
    pickup_code_file_name: Table<String, String>, // 取件码 |-> 文件名
}

// 文件信息
public struct FileInfo has copy {
    file_name: String,
    pickup_code: String,
}

// 查询的文件信息
public struct QueryFileInfo has copy {
    walrus_blob_id: String,
    file_name: String,
}

fun init(otw: KUAIDI, ctx: &mut TxContext) {
    // 发布者声明，一次性见证
    let publisher = sui::package::claim(otw, ctx);
    let walrus_storage_info = WalrusStorageInfo {
        id: object::new(ctx),
        storage_info: table::new(ctx),
        pickup_code: table::new(ctx),
        code_to_uploader: table::new(ctx),
        user_pickup_codes: table::new(ctx),
        pickup_code_file_name: table::new(ctx),
    };
    // 将发布者的转给发布者
    transfer::public_transfer(publisher, ctx.sender());
    // 将主存储设置为共享对象
    transfer::share_object(walrus_storage_info);
}

// 上传文件
entry fun upload_file(
    walrus_storage_info: &mut WalrusStorageInfo,
    file_name: String,
    walrus_blob_id: String,
    random: &Random,
    ctx: &mut TxContext,
) {
    let pickup_code = generate_pickup_code(random, ctx);  // 生成取件码
    table::add(&mut walrus_storage_info.pickup_code, pickup_code, walrus_blob_id);
    table::add(&mut walrus_storage_info.code_to_uploader, pickup_code, ctx.sender());
    table::add(&mut walrus_storage_info.pickup_code_file_name, pickup_code, file_name);

    // 更新 storage_info
    if (table::contains(&walrus_storage_info.storage_info, ctx.sender())) {
        let pickup_code_list = table::borrow_mut(&mut walrus_storage_info.storage_info, ctx.sender());
        table::add(pickup_code_list, pickup_code, file_name);

        // 更新 user_pickup_codes
        let user_codes = table::borrow_mut(&mut walrus_storage_info.user_pickup_codes, ctx.sender());
        vector::push_back(user_codes, pickup_code);
    } else {
        let mut pickup_code_list = table::new<String, String>(ctx);
        table::add(&mut pickup_code_list, pickup_code, file_name);
        table::add(&mut walrus_storage_info.storage_info, ctx.sender(), pickup_code_list);

        let mut user_codes = vector::empty<String>();
        vector::push_back(&mut user_codes, pickup_code);
        table::add(&mut walrus_storage_info.user_pickup_codes, ctx.sender(), user_codes);
    }
}

// 下载文件
public entry fun download_file(
    walrus_storage_info: &mut WalrusStorageInfo,
    pickup_code: String
) {
    // 检查取件码是否存在
    if (!table::contains(&walrus_storage_info.pickup_code, pickup_code)) {
        pickup_code_not_exist();
    };
    table::remove(&mut walrus_storage_info.pickup_code, pickup_code);
    let uploader_address = table::remove(&mut walrus_storage_info.code_to_uploader, pickup_code);

    // 从 storage_info 中删除
    let pickup_code_list = table::borrow_mut(&mut walrus_storage_info.storage_info, uploader_address);
    if (!table::contains(pickup_code_list, pickup_code)) {
        pickup_code_not_exist();
    };
    table::remove(pickup_code_list, pickup_code);

    // 从 user_pickup_codes 中删除
    let user_codes = table::borrow_mut(&mut walrus_storage_info.user_pickup_codes, uploader_address);
    let (found, index) = vector::index_of(user_codes, &pickup_code);
    if (found) {
        vector::remove(user_codes, index);
    };
}

entry fun seal_approve(walrus_storage_info: &WalrusStorageInfo, pickup_code: String) {
    // 检查取件码是否存在
    if (!table::contains(&walrus_storage_info.pickup_code, pickup_code)) {
        pickup_code_not_exist();
    };
}

/// private function

fun generate_pickup_code(random: &Random, ctx: &mut TxContext): String {
    let mut generator = random::new_generator(random, ctx);
    let random_bytes = random::generate_bytes(&mut generator, 8);
    bytes_to_hex(&random_bytes)
}

fun bytes_to_hex(bytes: &vector<u8>): String {
    let hex_chars = b"0123456789abcdef";
    let mut result = vector::empty<u8>();
    let len = vector::length(bytes);
    let mut i = 0;
    while (i < len) {
        let byte = bytes[i];
        vector::push_back(&mut result, hex_chars[(byte >> 4 as u64)]);
        vector::push_back(&mut result, hex_chars[(byte & 0x0F as u64)]);
        i = i + 1;
    };
    string::utf8(result)
}

/// view function

public fun get_pickup_code_list(
    walrus_storage_info: &WalrusStorageInfo,
    user_address: address,
): vector<FileInfo> {
    // 如果用户没有上传过文件，返回空列表
    if (!table::contains(&walrus_storage_info.user_pickup_codes, user_address)) {
        return vector::empty<FileInfo>()
    };

    let user_codes = table::borrow(&walrus_storage_info.user_pickup_codes, user_address);
    let file_info_table = table::borrow(&walrus_storage_info.storage_info, user_address);

    let mut files = vector::empty<FileInfo>();
    let len = vector::length(user_codes);
    let mut i = 0;
    while (i < len) {
        let pickup_code = vector::borrow(user_codes, i);
        let file_name = table::borrow(file_info_table, *pickup_code);
        let file_info = FileInfo {
            file_name: *file_name,
            pickup_code: *pickup_code,
        };
        vector::push_back(&mut files, file_info);
        i = i + 1;
    };
    files
}

public fun  get_blob_id_from_pickup_code(
    walrus_storage_info: &WalrusStorageInfo,
    pickup_code: String
): QueryFileInfo {
    if (!table::contains(&walrus_storage_info.pickup_code, pickup_code)) {
        pickup_code_not_exist();
    };
    let walrus_id = table::borrow(&walrus_storage_info.pickup_code, pickup_code);
    let file_name = table::borrow(&walrus_storage_info.pickup_code_file_name, pickup_code);
    let query_file_info = QueryFileInfo {
        walrus_blob_id: *walrus_id,
        file_name: *file_name,
    };
    query_file_info
}

/// error handing
fun pickup_code_not_exist() {
    abort(EKeyDoesNotExist)
}


