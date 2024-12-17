module qualification::cfa;

use std::string::String;
use sui::package;
use sui::display;
use sui::event;

public struct CFACertificate has key,store{
    id: UID,
    qualifier_name:String,      // 资格获得者
    qualifier_image_url:String, // 资格获得者照片
    issuer:address,             // 授权结构的地址
    description:String,         // 描述
}

// 授权能力
public struct GrantCap has key{
    id:UID,
}

public struct GrantEvent has copy,drop{
    qualifier_address: address
}

public struct CFA has drop {
}

fun init(otw: CFA,ctx:&mut TxContext){
    let keys = vector[
        b"logo".to_string(),
        b"qualifier_name".to_string(),
        b"qualifier_image_url".to_string(),
        b"description".to_string(),
        b"project_url".to_string(),
        b"issuer".to_string(),
        b"image_url".to_string(),
    ];
    let values = vector[
        b"{https://www.cfainstitute.org/themes/custom/cfa_base/logo.svg}".to_string(),
        b"{qualifier_name}".to_string(),
        b"{qualifier_image_url}".to_string(),
        b"{description}".to_string(),
        b"https://www.cfainstitute.org/".to_string(),
        b"{issuer}".to_string(),
        b"https://seeklogo.com/images/C/cfa-institute-logo-8013C61264-seeklogo.com.png".to_string(),
    ];

    let publisher = package::claim(otw, ctx);
    let mut display = display::new_with_fields<CFACertificate>(
        &publisher, keys, values, ctx
    );

    display.update_version();
    transfer::public_transfer(publisher,ctx.sender());
    transfer::public_transfer(display,ctx.sender());

    let grant_cap = GrantCap { id: object::new(ctx) };
    transfer::transfer(grant_cap, ctx.sender());
}



entry fun mint(_:&GrantCap,name:String,image_url:String,description:String,recipient:address, ctx: &mut TxContext) {
    let cfa = CFACertificate {
        id: object::new(ctx),
        qualifier_name:name,
        qualifier_image_url:image_url, // 资格获得者照片
        issuer:ctx.sender(),             // 授权结构的地址
        description:description,
    };
    transfer::public_transfer(cfa, recipient);
    event::emit(GrantEvent {
        qualifier_address:recipient,
    });
}
