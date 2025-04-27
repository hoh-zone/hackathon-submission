module hackathon_qidian::hackathon_qidian;
// === Imports ===
use std::string::String;
use sui::event::emit;
// === Errors ===
// === Constants ===

// === Structs ===
// public struct HACKATHON_QIDIAN has drop {}
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
    title: String,
    content:String
}
// === Event Struct ===
public struct Event_CreateBook has copy, drop {
    title: String,
    owner: address
}
// === Init ===
fun init(ctx: &mut TxContext) {
    let state = State {
        id: object::new(ctx),
        books: vector::empty<address>()
    };
    transfer::share_object(state)
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
    emit(Event_CreateBook{
        title,
        owner: ctx.sender()
    })
}
public entry fun create_chapter(book: &mut Book, title: String, content: String, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let object_address = object::uid_to_address(&id);
    let owner = ctx.sender();
    let new_chapter = Chapter {
        id,
        owner,
        title,
        content
    };
    vector::push_back(&mut book.chapters, object_address);
    transfer::transfer(new_chapter, ctx.sender())
}
