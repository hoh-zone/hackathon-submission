/// add a tranversable list,  and typescript sdk can access dynamic field of user data
module deposit_bonus::user_list;
use sui::table::{Self,Table};

public struct UserList<phantom T : store> has store{
    values : Table<address,T>,
    keys : Table<u32,address>,
    count : u32,
}

public fun size<T:store>(ul :& UserList<T> ) : u32{
     ul.count
}

public fun add<T:store>( list : &mut UserList<T>, addr: address,value : T){
    
    list.values.add(addr,value);
    list.keys.add( list.count, addr);
    list.count = list.count + 1;
}

public fun at<T:store>(list:&UserList<T>,index :u32) : &T{
    assert!(index < list.count);
    let addr = list.keys.borrow(index);
    list.values.borrow(*addr)
}

public fun at_mut<T:store>(list:&mut UserList<T>,index :u32) : &mut T{
    assert!(index < list.count);
    let addr = list.keys.borrow(index);
    list.values.borrow_mut(*addr)
}

public fun borrow<T : store>(list : & UserList<T>, addr: address) : &T{
    list.values.borrow(addr)
}

public fun borrow_mut<T : store>(list : &mut UserList<T>, addr: address) : &mut T{
    list.values.borrow_mut(addr)
}

public fun new<T : store>(ctx : &mut TxContext) : UserList<T>{
    UserList<T>{
        values: table::new<address,T>(ctx),
        keys : table::new<u32,address>(ctx),
        count : 0,
    }
}

public fun contains<T : store>(ul : & UserList<T> ,key  : address) : bool {
    ul.values.contains(key)
}