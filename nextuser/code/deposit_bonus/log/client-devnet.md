# publish package

配置多个用户
```bash
export ADMIN=0x42a27bbee48b8c97b05540e823e118fe6629bd5d83caf19ef8e9051bf3addf9e
export OPERATOR=0x8f6bd80bca6fb0ac57c0754870b80f2f47d3c4f4e815719b4cda8102cd1bc5b0
export USER_1=0x5e23b1067c479185a2d6f3e358e4c82086032a171916f85dc9783226d7d504de
export USER_2=0x16781b5507cafe0150fe3265357cccd96ff0e9e22e8ef9373edd5e3b4a808884
export USER_3=0xa23b00a9eb52d57b04e80b493385488b3b86b317e875f78e0252dfd1793496bb
export USER_4=0xafe36044ef56d22494bfe6231e78dd128f097693f2d974761ee4d649e61f5fa2

#devnet 特有
export VALIDATOR=0x94beb782ccfa172ea8752123e73768757a1f58cfca53928e9ba918a2c44a695b
```

```bash
./pub-devnet.sh
```

```bash
cat pub-dev.sh 
sui client switch --address $ADMIN
sui client publish |tee ./log/publish-devnet.log
``

##  缺省环境变量设置
```bash
export CLOCK=0x6
export RND=0x8
export SYSTEM_STATE=0x5
#devnet 特有
export VALIDATOR=0x94beb782ccfa172ea8752123e73768757a1f58cfca53928e9ba918a2c44a695b

```


### 发布后设置环境变量,对照 log/publish-devnet.log 设置环境变量,


```bash
export STORAGE=0x45951d2df97d4157fc078e692f3b768f55f20bc9cf922ba755435c00a882e206
export ADMIN_CAP=0x4e1465a4b512eb7ffea9fbfec6cbffbf36775f9a27829dbb648da6c3d9e90ad6
export OPERATOR_CAP=0xc817ed4dce069bf0f1655fc2c153c7d414bab419a6c19848c6363047fd78eb2f
export HISTORY=0xb766bf842ed30fc0a692702e60e28614fa27b23afeb56f82e70f780a081db2ef
export PKG=0x847fa8f44626965ea60da104cb516e23f07295368638349732c32e40121ab9c3

```




## admin :assign operator
```bash

sui client switch --address $ADMIN
sui client ptb --move-call $PKG::deposit_bonus::assign_operator \
 @$ADMIN_CAP @$OPERATOR_CAP @$OPERATOR 
```


## user1 deposit
```bash
sui client switch --address $USER_1
sui client faucet 

sui client ptb --split-coins gas [4000000000] --assign new_coin \
 --move-call $PKG::deposit_bonus::deposit \
@$CLOCK @$STORAGE @$SYSTEM_STATE @$VALIDATOR new_coin \
--gas-budget 1000000000
```

## user2 deposit
```bash
sui client switch --address $USER_2
sui client faucet 

sui client ptb --split-coins gas [4000000000] --assign new_coin \
 --move-call $PKG::deposit_bonus::deposit \
@$CLOCK @$STORAGE @$SYSTEM_STATE @$VALIDATOR new_coin \
--gas-budget 1000000000
```

## user3 deposit
```bash
sui client switch --address $USER_3
sui client faucet 
sui client ptb --split-coins gas [6000000000] --assign new_coin \
  --move-call $PKG::deposit_bonus::deposit \
@$CLOCK @$STORAGE @$SYSTEM_STATE @$VALIDATOR new_coin \
--gas-budget 1000000000
```

## user4 deposit
```bash
sui client switch --address $USER_4
sui client faucet 
sui client ptb --split-coins gas [2000000000] --assign new_coin \
 --move-call $PKG::deposit_bonus::deposit \
@$CLOCK @$STORAGE @$SYSTEM_STATE @$VALIDATOR new_coin \
--gas-budget 1000000000
```

#  operator donate
```bash
sui client switch --address $OPERATOR
sui client faucet
sui client faucet
sui client faucet
sui client ptb --split-coins gas [400000000] --assign new_coin \
 --move-call $PKG::deposit_bonus::donate_bonus @$STORAGE new_coin

```

# operator  withdraw and bonus allocate

```bash
sui client switch --address $OPERATOR

sui client ptb --move-call \
$PKG::deposit_bonus::withdraw_and_allocate_bonus @$OPERATOR_CAP \
@$CLOCK @$STORAGE @$SYSTEM_STATE @$RND @$VALIDATOR @$HISTORY
```

# user1 get user info

```bash
sui client switch --address $USER_1
sui client ptb --move-call \
$PKG::deposit_bonus::entry_query_user_info @$STORAGE 
```

```bash
sui client switch --address $USER_2
sui client ptb --move-call \
$PKG::deposit_bonus::entry_query_user_info @$STORAGE 
```

```bash
sui client switch --address $USER_3
sui client ptb --move-call \
$PKG::deposit_bonus::entry_query_user_info @$STORAGE 
```


# user1 get bonus list
```bash
sui client switch --address $USER_1
 sui client object $STORAGE

sui client ptb --move-call \
$PKG::deposit_bonus::get_recent_records @$HISTORY
```

