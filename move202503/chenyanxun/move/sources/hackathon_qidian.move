module hackathon_qidian::hackathon_qidian;
// === Imports ===
use std::string::String;
use sui::sui::SUI;
use sui::coin::{Self, Coin};
use sui::object::{uid_to_inner, uid_to_address, id_from_address};

// === Errors ===
const ENoAccess : u64 = 1;
const ENOTFOUND : u64 = 2;
const ENOTENOUGTH : u64 = 3;
// === Constants ===

// === Structs ===
public struct Admin has key {
    id: UID
}
public struct State has key, store {
    id: UID,
    books: vector<address>
}
public struct Book has key {
    id: UID,
    owner: address,
    title: String,
    avatar: String,
    description: String,
    chapters: vector<address>
}
public struct Chapter has key {
    id: UID,
    owner: address,
    book: ID,
    title: String,
    content:String,
    amount: u64,
    allowlist_id: ID
}
public struct AllowList has key {
    id: UID,
    chapter_id: ID,
    amount: u64,
    owner: address,
    allowlist: vector<address>
}

// === Init ===
fun init(ctx: &mut TxContext) {
    // books
    let state = State {
        id: object::new(ctx),
        books: vector::empty<address>()
    };
    transfer::share_object(state);
    // 管理员权限
    let admin = Admin {
        id: object::new(ctx)
    };
    transfer::transfer(admin, ctx.sender());
}

// === Entry Fun ===
public entry fun create_book (state: &mut State, title: String, avatar: String, description: String, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let object_address = object::uid_to_address(&id);
    let owner = ctx.sender();
    let new_book = Book {
        id,
        title,
        owner,
        avatar,
        description,
        chapters: vector::empty<address>()
    };
    vector::push_back(&mut state.books, object_address);
    transfer::transfer(new_book, ctx.sender());
}
public entry fun delete_book(state: &mut State, book: &Book, ctx: &mut TxContext) {
    assert!(book.owner == ctx.sender(), ENoAccess);
    let book_address = uid_to_address(&book.id);
    let (found, index) = find_index(&state.books, book_address);
    assert!(found, ENOTFOUND);
    vector::remove(&mut state.books, index);
}
public fun create_allowlist(chapter_address: address, amount: u64, owner: address, ctx: &mut TxContext): AllowList {
    let chapter_id = id_from_address(chapter_address);
    let allowlist = AllowList {
        id: object::new(ctx),
        chapter_id: chapter_id,
        amount: amount,
        owner: owner,
        allowlist: vector::empty<address>()
    };
    allowlist
}
public entry fun create_chapter(book: &mut Book, title: String,content: String, amount: u64, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let object_address = object::uid_to_address(&id);
    let owner = ctx.sender();
    // 每创建一个chapter,就要创建一个allowlist
    let allowlist = create_allowlist(object_address, amount, owner, ctx);
    let new_chapter = Chapter {
        id,
        owner,
        book: uid_to_inner(&book.id),
        title,
        content,
        amount,
        allowlist_id: uid_to_inner(&allowlist.id)
    };
    vector::push_back(&mut book.chapters, object_address);
    transfer::transfer(new_chapter, ctx.sender());
    transfer::share_object(allowlist);
}
public entry fun delete_chapter(book: &mut Book, chapter: &Chapter, ctx: &mut TxContext) {
    assert!(chapter.owner == ctx.sender(), ENoAccess);
    let chapter_address = uid_to_address(&chapter.id);
    let (found, index) = find_index(&book.chapters, chapter_address);
    assert!(found, ENOTFOUND);
    vector::remove(&mut book.chapters, index);
}
// find index
fun find_index(vector_obj: &vector<address>,find_address: address): (bool, u64) {
    let mut i=0;
    let len = vector::length(vector_obj);
    while (i < len) {
        if(*vector::borrow(vector_obj, i) == find_address) {
            return (true, i)
        };
        i = i + 1;
    };
    (false, 0)
}

public entry fun add_allowlist(allowlist: &mut AllowList,coin: Coin<SUI>, ctx: &mut TxContext) {
    let mut coin = coin;
    // 转钱，收手续费，设置amount的10%
    let coin_value = coin.value();
    assert!(coin_value >= allowlist.amount, ENOTENOUGTH);
    // 拆分
    let gas_coin = coin::split(&mut coin, allowlist.amount/10, ctx);
    transfer::public_transfer(gas_coin, @gas_address);
    transfer::public_transfer(coin, allowlist.owner);
    vector::push_back(&mut allowlist.allowlist, ctx.sender());
}

entry fun seal_approve(_id: vector<u8>, _ctx: &TxContext) {

}
entry fun seal_approve_other(_id: vector<u8>, allowlist: &AllowList, ctx: &TxContext) {
    assert!(approve_internal(ctx.sender(), allowlist), ENoAccess);
}
public fun approve_internal(account: address, allowlist: &AllowList):bool {
    allowlist.allowlist.contains(&account)
}