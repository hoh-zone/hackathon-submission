import {useState} from 'react';
import { useEffect} from 'react'
import {BonusPeriodWrapper, UserInfo} from './contract_types'
import SpaceUI from './SpaceUI';
import {  get_user_info_tx , get_bonus_periods } from './data-provider';
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
    // useSuiClientQuery,
  } from "@mysten/dapp-kit";

const UserInfoUI = ( props : {onSelectPeriod: (address:string)=>void}) =>{

    let account = useCurrentAccount();
    let initial_value :UserInfo = {
        id : account ? account.address : "",
        orignal_amount : 0,
        reward :0,
        bonus : 0,
    };
    
    let [user_info , set_user_info] = useState(initial_value);
    let [periods ,set_periods] = useState<BonusPeriodWrapper[]>()
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    useEffect(()=>{
            signAndExecute(
                {
                  transaction: get_user_info_tx(),
                },
                {
                  onSuccess: (tx ) => {
                    suiClient.waitForTransaction({ digest: tx.digest, options: {
                        showEvents: true,
                    }, }).then((response)=>{
                        let  user_info =  response.events![0].parsedJson as unknown as UserInfo;
                        console.log("wait result :", response);
                        set_user_info(user_info);
                    })
                  },
                  onError:(err)=>{
                    console.error(err);
                  }
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
    return (<SpaceUI user_info={user_info} change_period={props.onSelectPeriod} periods={periods}></SpaceUI>)   
}

export default UserInfoUI;