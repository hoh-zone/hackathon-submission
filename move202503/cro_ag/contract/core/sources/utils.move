module core::utils {
    use std::ascii;
    use std::type_name;
    
    public fun type_to_bytes<T0>() : vector<u8> {
        let typeName = type_name::get<T0>();
        *ascii::as_bytes(type_name::borrow_string(&typeName))
    }
}
