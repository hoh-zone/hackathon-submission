module deposit_bonus::utils;
use std::debug::print;

public fun log<T>(prompt : vector<u8>,  obj: &T ){
    print(&prompt.to_string());
    print(obj);
}