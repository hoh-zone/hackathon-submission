module deposit_bonus::range;
use std::u256;
use deposit_bonus::err_consts;
use sui::address;
#[test_only] use  sui::test_utils as tu;

public struct Range has copy,drop{
    start : u256,
    end  : u256
}

fun to_hex(value : u256) :vector<u8>{
    let addr = address::from_u256(value);
    hex::encode(address::to_bytes(addr))
}
use sui::hex;
public fun encode(range :&Range) : vector<u8>{
    let mut msg = b"{start:";
    msg.append( to_hex(range.start));
    msg.append(b",\nend:");
    msg.append(to_hex(range.end));
    msg.append(b"}\n");
    msg
}

public fun encode_ranges( ranges : &vector<Range>) : vector<u8>{
    let mut ret = b"[";
    let mut i = 0;
    let len = ranges.length();
    while(i < len){
        let range = ranges.borrow(i);
        ret.append( encode(range));
        i = i + 1;
    };
    ret.append(b"]");
    ret
}

public(package) fun create_range(start : u256,end : u256) :Range {
    Range{
        start,
        end
    }
}

public(package) fun get_address_ranges(addr : address, length : u256) : vector<Range>{
    let point : u256 = addr.to_u256();
    get_ranges(point, length)
}


public(package) fun get_ranges(point : u256, length : u256) : vector<Range>{
    
    let mut result : vector<Range> = vector[];
    let max = u256::max_value!();
    if( max -  point < length ){
        vector::push_back(&mut result,Range{
            start : point,
            end : max
        });
        vector::push_back(&mut result ,Range{
            start : 0,
            end :   length -( max - point)
        });
    }
    else{
        vector::push_back(&mut result,Range{
            start : point,
            end : point + length
        });
    };
    result
}

fun get_overlap_len(left : &Range, right : &Range) : u256{
    let start = std::macros::num_max!(left.start,right.start);
    let end = std::macros::num_min!(left.end,right.end);
    if(start > end ){
        0
    }
    else
    {
        end - start
    } 
}
public(package) fun get_overlap_length(left : &vector<Range>,
                                   right : &vector<Range>) : u256{
    assert!(vector::length(left) >0 && vector::length(right) > 0,err_consts::empty_range!());
    let mut l : u64 = 0;
    let mut r : u64 = 0;
    let mut overlap_len : u256 = 0;
    while(l < left.length()){
        while(r < right.length()){
            
            overlap_len = overlap_len + get_overlap_len( vector::borrow(left,l), vector::borrow(right,r));
            r = r + 1;
        };
        l = l + 1;
    };
    return overlap_len

}


#[test]
fun test_range()
{
    assert!(get_overlap_len(&create_range(34, 100),
                            &create_range(50, 80)) == 30);
    assert!(get_overlap_len(&create_range(34, 100),
                            &create_range(50, 120)) == 50);
    assert!(get_overlap_len(&create_range(34, 100),
                            &create_range(50, 50)) == 0);
    let max = std::u256::max_value!();
    tu::assert_eq(get_overlap_len(&create_range(max - 30, max),
                                &create_range(50, 80)),0);
    tu::assert_eq(get_overlap_len(&create_range(max - 30, max),
                            &create_range(max - 20, max)),
                20);
    tu::assert_eq(get_overlap_len(&create_range(max - 30, max),
                            &create_range(max - 60, max)) ,
                30);
    
}

#[test_only]
fun assert_length(ranges : &vector<Range> , length : u256){
    let mut l = 0;
    let mut len = 0;
    while(l < ranges.length()){
        let range = vector::borrow(ranges,l);
        assert!(range.end >= range.start);
        len = (range.end - range.start) + len;
        l = l + 1;
   
    };
    tu::assert_eq(len,length);
}

#[test]
fun test_get_ranges(){
    let max = u256::max_value!();
    
    assert_length(&get_ranges(max - 30, 30),30);
    assert_length(&get_ranges(max - 31, 30),30);
    assert_length(&get_ranges(max - 20, 30),30);
    assert_length(&get_ranges(0, 30),30);
   
}


#[test]
fun test_ranges_ovelap(){
    let max = u256::max_value!();
    let ret = get_ranges(max - 29, 30);
    let rng = vector::borrow(&ret, 0);
    assert!(rng.end == max && rng.start == max - 29);
    let rng = vector::borrow(&ret, 1);
    assert!(rng.start == 0 && rng.end == 1);

}