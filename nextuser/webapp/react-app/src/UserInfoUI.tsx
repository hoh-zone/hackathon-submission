import {useState} from 'react';
import { useEffect} from 'react'
import {BonusPeriodWrapper, UserShare,DepositEvent} from './contract_types'
import SpaceUI from './SpaceUI';
import {get_user_share , get_bonus_periods ,
        get_deposit_tx,get_balance,get_zero_share} from './data-provider';

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
                  //let events = response.events;
                  get_user_share(suiClient,account!.address).then((share : UserShare)=>{
                    set_user_info(share);
                  });
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

    let initial_value :UserShare = get_zero_share(account!.address || "");
    
    let [user_info , set_user_info] = useState<UserShare>(initial_value);
    let [periods ,set_periods] = useState<BonusPeriodWrapper[]>()

    useEffect(()=>{
            query_balance();
            get_user_share(suiClient,account!.address).then((share : UserShare)=>{
              set_user_info(share);
            });
            
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