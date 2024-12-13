import {useState} from 'react';
import { useEffect} from 'react'
import {BonusPeriodWrapper, UserInfo,DepositEvent} from './contract_types'
import SpaceUI from './SpaceUI';
import {get_user_info_tx , get_bonus_periods ,
        get_deposit_tx,get_balance} from './data-provider';

import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
    // useSuiClientQuery,
  } from "@mysten/dapp-kit";

  const UserInfoUI = ( props : {onSelectPeriod: (address:string)=>void}) =>{

  let account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [balance, setBalance] = useState(0);

  // const [totalDeposit, setTotalDeposit] = useState(0);
  // const [interest, setInterest] = useState(0);
  // const [prize, setPrize] = useState(0);
  // const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  let query_balance = ()=>{
    if(!account) return;

    get_balance(suiClient,account!.address).then( (value : number)=>{
        setBalance(value);
    })
  }
  let deposit =function ( value :string )
  {
    if(value.length == 0) return;
    let amount = Number(value);
    if(amount == 0) return;
    if(amount > balance) {
      alert("max amount is:" + balance);
      return;
    }
    let tx =  get_deposit_tx(amount);
    signAndExecute(
      {
        transaction: tx,
        
      },
      {
        onSuccess: (tx ) => {
          suiClient.waitForTransaction({ digest: tx.digest, options: {showEvents: true} })
                   .then((response)=>{
                if(response.events){
                  console.log("deposit events",response.events,"tx digest",tx.digest);
                  for(let i = 0 ; i < response.events.length; ++i ){
                    console.log(response.events[i]);
                  }
                  let events = response.events;
                  if(events && events.length){
                    for(let i = 0;  i < events.length; ++ i){
                      if(events[i].type.endsWith('deposit_bonus::UserInfo')){
                        let  user_info =  events[i].parsedJson as unknown as UserInfo
                        //show use stake info
                        set_user_info(user_info);
                        break;
                      }
                    }
                  }
                  //show the user max balance                  
                  query_balance()
                }
          });
        },
        onError:(err)=>{
          console.error("deposit fail",err);
        }
      });
  }

    let initial_value :UserInfo = {
        id : account ? account.address : "",
        orignal_amount : 0,
        reward :0,
        bonus : 0,
    };
    
    let [user_info , set_user_info] = useState<UserInfo>(initial_value);
    let [periods ,set_periods] = useState<BonusPeriodWrapper[]>()


    let query_ue_info = ( setter:(info:UserInfo)=>void)=>{

      signAndExecute(
        {
          transaction: get_user_info_tx(),
        },
        {
          onSuccess: (tx ) => {
            suiClient.waitForTransaction({ digest: tx.digest, options: {showEvents: true} }).then((response)=>{
                let  user_info =  response.events![0].parsedJson as unknown as UserInfo;
                console.log("wait result :", response);
                setter(user_info);
            })
          },
          onError:(err)=>{
            console.error(err);
          }
        });
    }

    useEffect(()=>{
            query_balance();
            query_ue_info(set_user_info);
    },[]);

    useEffect(()=>{
       get_bonus_periods(suiClient).then((periods:BonusPeriodWrapper[])=>{
        set_periods(periods);
        if(periods.length > 0){
          props.onSelectPeriod(periods[0].id.id);
        }
       });
    },[]    );
    return (<SpaceUI user_info={user_info} balance={balance} deposit={deposit} change_period={props.onSelectPeriod} periods={periods}></SpaceUI>)   
}

export default UserInfoUI;