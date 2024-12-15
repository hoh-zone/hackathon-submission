## publish

```bash
 sui client publish  --skip-dependency-verification
 
 ```
│  ┌──                                                                                                        │
│  │ ObjectID: 0xb2aba4a9d52bc1f6b4cf51053dc282c58661a4e504631e133e55ef618232061a                             │
│  │ Sender: 0xafe36044ef56d22494bfe6231e78dd128f097693f2d974761ee4d649e61f5fa2                               │
│  │ Owner: Account Address ( 0xafe36044ef56d22494bfe6231e78dd128f097693f2d974761ee4d649e61f5fa2 )            │
│  │ ObjectType: 0x20ebc0e38995f52ebfc26acab3eb8395ec9c4ad78157eb35a4710cfb20c115c8::bonus::AdminCap          │
│  │ Version: 20                                                                                              │
│  │ Digest: CKoS3e2TEFjm3fdRUC99XhSQCMqK12FZEm5C4TKXH682                                                     │
│  └──    
```
public  fun create_bonus_period(_ : &AdminCap,
                                clock : &Clock,
                                ctx : &mut TxContext) :BonusPeriod 


public fun add_user_bonus(_ : &AdminCap,
                    period : &mut BonusPeriod, 
                    bonus : UserBonus)
```


 ┌──                                                                                                   │
│  │ ObjectID: 0x67592e2825b318fa3254d50502744dccb790f1cb97861da5f799423410f44338                        │
│  │ Sender: 0xafe36044ef56d22494bfe6231e78dd128f097693f2d974761ee4d649e61f5fa2                          │
│  │ Owner: Account Address ( 0xafe36044ef56d22494bfe6231e78dd128f097693f2d974761ee4d649e61f5fa2 )       │
│  │ ObjectType: 0x20ebc0e38995f52ebfc26acab3eb8395ec9c4ad78157eb35a4710cfb20c115c8::bonus::BonusPeriod  │
│  │ Version: 426861                                                                                     │
│  │ Digest: 4sHGazj69PNrkega89dTPmdu2QLqjkqsBc8HuZGMnW17    



export BONUS_ADMIN=0xb2aba4a9d52bc1f6b4cf51053dc282c58661a4e504631e133e55ef618232061a
export BONUS_PKG=0x20ebc0e38995f52ebfc26acab3eb8395ec9c4ad78157eb35a4710cfb20c115c8
export PERIOD=0x67592e2825b318fa3254d50502744dccb790f1cb97861da5f799423410f44338
export CLOCK=0x6
sui client ptb --move-call $BONUS_PKG::bonus::create_period @$BONUS_ADMIN @$CLOCK




public fun create_user_bonus(user :address , gain : u64, 
                    pay : u64, principal : u64) : UserBonus{
public fun add_user_bonus(_ : &AdminCap,
                    period : &mut BonusPeriod, 
                    bonus : UserBonus)


sui client ptb --move-call $BONUS_PKG::bonus::create_period @$BONUS_ADMIN @$CLOCK

sui client ptb --move-call $BONUS_PKG::bonus::create_user_bonus @0xa 5000 9000 1000000 \
--assign bonus \
--move-call $BONUS_PKG::bonus::add_user_bonus @$BONUS_ADMIN @$PERIOD bonus

sui client ptb --move-call $BONUS_PKG::bonus::create_user_bonus @0xb "5000000000" "9000" "1000000000000" \
--assign bonus \
--move-call $BONUS_PKG::bonus::add_user_bonus @$BONUS_ADMIN @$PERIOD bonus


sui client ptb --move-call $BONUS_PKG::bonus::create_user_bonus @0xc "6000000000" "9000" "1000000000000" \
--assign bonus \
--move-call $BONUS_PKG::bonus::add_user_bonus @$BONUS_ADMIN @$PERIOD bonus



sui client ptb --move-call $BONUS_PKG::bonus::create_user_bonus @0xd "7000000000" "9000" "1000000000000" \
--assign bonus \
--move-call $BONUS_PKG::bonus::add_user_bonus @$BONUS_ADMIN @$PERIOD bonus
