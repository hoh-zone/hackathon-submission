import {useState,useEffect} from 'react';
import * as Tabs from "@radix-ui/react-tabs";
import {BonusPeriodWrapper, UserShare,DepositEvent} from './contract_types'
import DepositUI from './DepositUI';
import WithdrawUI from './WithdrawUI';
import {get_user_share , get_bonus_periods ,get_withdraw_tx,
        get_deposit_tx,get_balance,get_zero_share} from './data-provider';

import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
    // useSuiClientQuery,
  } from "@mysten/dapp-kit";


  function check_max(value :string, max : number) :number{
    if(!value ||value.trim().length == 0) return 9;
    let amount = Number(value.trim());
    if(amount == 0) return 0;
    
    if(amount  > max) {
      alert(`输入金额需要小于${max}` );
      return 0;
    }
    return Math.round(amount * 1e9);
  }
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
  let query_user_info = () =>{
    if(!account) return;
    get_user_share(suiClient,account!.address).then((share : UserShare)=>{
      set_user_info(share);
    });
  }


  let deposit =function ( value :string ,max : number)
  {
    let amount = check_max(value,max);
    if(amount == 0 ){
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
                          // for(let i = 0 ; i < response.events.length; ++i ){
                          //   console.log(response.events[i]);
                          // }
                          //let events = response.events;
                          query_user_info();
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

    let withdraw = function(value : string , max : number){
    let amount = check_max(value,max);
    if(amount == 0 ){
      return;
    }

    let tx =  get_withdraw_tx(amount);
    signAndExecute( {transaction: tx},
      {
        onSuccess: (tx ) => {
          console.log("succ! digest:",tx.digest);
          suiClient.waitForTransaction({ digest: tx.digest, options: {showEvents: true} })
                   .then((response)=>{

                  query_user_info();
                  //show the user max balance                  
                  query_balance()
                });
        },
        onError:(err)=>{
          console.error("deposit fail",err," digest:",tx.digest);
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
    return (
    	<Tabs.Root className="TabsRoot" defaultValue="tab1">
        <Tabs.List className="TabsList" aria-label="Manage your account">
          <Tabs.Trigger className="TabsTrigger" value="tab1">
            存款
          </Tabs.Trigger>
          <Tabs.Trigger className="TabsTrigger" value="tab2">
            取款
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="TabsContent" value="tab1">
          <DepositUI user_info={user_info} balance={balance} deposit={deposit} change_period={props.onSelectPeriod} periods={periods}></DepositUI>
        </Tabs.Content>
        <Tabs.Content className="TabsContent" value="tab2">
          <WithdrawUI user_info={user_info} balance={balance} withdraw={withdraw} change_period={props.onSelectPeriod} periods={periods}></WithdrawUI>
        </Tabs.Content>
    </Tabs.Root>
    )   
}

export default UserInfoUI;