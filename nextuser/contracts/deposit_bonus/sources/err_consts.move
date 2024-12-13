module deposit_bonus::err_consts;

public macro fun share_not_enough() : u64{
    0
}
public macro fun account_not_exists() : u64{
    1
}

public macro fun balance_not_enough() : u64{
    2
}
public macro fun empty_range(): u64 {
    3
}

public macro fun percent_out_of_range() : u64 {
    4
}


public macro fun withdraw_fail() : u64 {
    5
}

public macro fun balance_less_than_staked() : u64{
    6
}

public macro fun fee_percent_out_of_range() : u64{
    7
}

public macro fun withdraw_share_not_enough() : u64{
    8
}