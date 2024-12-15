import { useState, useEffect } from 'react';
import * as Tabs from "@radix-ui/react-tabs";
import { BonusPeriodWrapper, UserShare, DepositEvent, StorageData } from './contract_types'
import DepositUI from './DepositUI';
import WithdrawUI from './WithdrawUI';
import OperatorUI from './OperatorUI';
import AdminUI from './AdminUI'
import { SuiTransactionBlockResponse } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import {
  get_user_share, get_bonus_periods, get_withdraw_tx,
  get_deposit_tx, get_balance, get_zero_share, get_operators, get_admin,
  get_owner, get_assign_tx, get_allocate_bonus_tx,
  get_storage, get_withdraw_fee_tx,
  get_donate_tx
} from './data-provider';

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  // useSuiClientQuery,
} from "@mysten/dapp-kit";
import { TransactionArgument } from '@mysten/sui/transactions';


function check_max(value: string, max: number): number {
  if (!value || value.trim().length == 0) return 9;
  let amount = Number(value.trim());
  if (amount == 0) return 0;

  if (amount > max) {
    alert(`输入金额需要小于${max}`);
    return 0;
  }
  return Math.round(amount * 1e9);
}
const UserInfoUI = (props: { onSelectPeriod: (address: string) => void }) => {
  let [storage, set_storage] = useState<StorageData | null>(null)
  let [is_operator, set_operator] = useState(false);
  let [admin, set_admin] = useState("");
  let account = useCurrentAccount();
  let address = account ? account!.address : "";
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [balance, set_balance] = useState(0);



  // const [totalDeposit, setTotalDeposit] = useState(0);
  // const [interest, setInterest] = useState(0);
  // const [prize, setPrize] = useState(0);
  // const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  let query_balance = () => {
    console.log('--query_balance--');
    get_balance(suiClient, address).then((value: number) => {
      console.log("--query_balance result--\n",value);
      set_balance(value);
    })
  }
  let query_user_info = () => {
    console.log('--query_user_info--');
    get_user_share(suiClient, address).then((share: UserShare) => {
      console.log("--query_user_info result:--\n",share);
      set_user_info(share);
    });
  }
  let query_storage = () => {
    console.log('-----query-storage----');
    get_storage(suiClient).then((storage: StorageData) => { 
        console.log("--query_storage result--\n",storage);
        set_storage(storage) 
    })
  };

  let query_periods=()=>{
    get_bonus_periods(suiClient).then((periods: BonusPeriodWrapper[]) => {
      set_periods(periods);
      if (periods.length > 0) {
        props.onSelectPeriod(periods[0].id.id);
      }
    });
  }

  let refresh_user = (response: SuiTransactionBlockResponse) => {
    console.log("refresh-user:" ,response);
    if (response.events) {
      // for(let i = 0 ; i < response.events.length; ++i ){
      //   console.log(response.events[i]);
      // }
      console.log('--refresh user--');
      //let events = response.events;
      query_user_info();
      //show the user max balance                  
      query_balance();
      query_storage();
    }
    else {
      console.log("no events");
    }
  }

  let refresh_operator = (response: SuiTransactionBlockResponse) => {
       query_balance();
       query_storage();
       query_periods();
  }

  let refresh_admin = (response: SuiTransactionBlockResponse) => {
    query_balance();
    query_storage();
    query_user_info();
  }

  let call_tx = function (tx: Transaction, succ_callback: (response: SuiTransactionBlockResponse) => void) {
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest, options: { showEvents: true } })
            .then((response) => {
              succ_callback(response);
            });
        },
        onError: (err) => {
          console.error("signAndExecute transaction fail", err.message);
        }
      });
  }


  let deposit = function (value: string, max: number) {
    let amount = check_max(value, max);
    if (amount == 0) return;
    let tx = get_deposit_tx(amount);
    call_tx(tx, refresh_user);

  };

  let withdraw = function (value: string, max: number) {
    let amount = check_max(value, max);
    if (amount == 0) return;

    let tx = get_withdraw_tx(amount);
    call_tx(tx, refresh_user);
  };

  let withdraw_fee = function (value: string, max: number) {
    let amount = check_max(value, max);
    if (amount == 0) return;

    let tx = get_withdraw_fee_tx(amount);
    call_tx(tx, refresh_user);
  };

  let allocate = function () {
    let tx = get_allocate_bonus_tx();
    call_tx(tx, refresh_operator);
  }

  let assign = function (to: string) {
    let tx = get_assign_tx(to);
    call_tx(tx, query_operator);
  }

  let donate = function (value: string, max: number) {
    let amount = check_max(value, max);
    if (amount == 0) return;
    let tx = get_donate_tx(amount);
    call_tx(tx,refresh_operator);
  }
  let query_operator=()=>{
    get_operators(suiClient).then((operators:string[]) => { 
      console.log('-operators-',operators);
      console.log('--addr--',address);
      set_operator( operators.indexOf(address) >= 0);
     })
  }

  let initial_value: UserShare = get_zero_share(address);

  let [user_info, set_user_info] = useState<UserShare>(initial_value);
  let [periods, set_periods] = useState<BonusPeriodWrapper[]>()

  useEffect(() => {
    query_balance();
    query_user_info();
    query_operator();
    get_admin(suiClient).then((owner) => { set_admin(owner) })
  }, []);

  useEffect(query_storage, []);

  useEffect(() => {
    query_periods();
  }, []);
  return (
    <Tabs.Root className="TabsRoot" defaultValue="tab1">
      <Tabs.List className="TabsList" aria-label="Manage your account">
        <Tabs.Trigger className="TabsTrigger" value="tab1">
          存款
        </Tabs.Trigger>
        <Tabs.Trigger className="TabsTrigger" value="tab2">
          取款
        </Tabs.Trigger>
        {address == admin ? <Tabs.Trigger className="TabsTrigger" value="tab3">
          管理
        </Tabs.Trigger> : <span/>}
        {is_operator ? <Tabs.Trigger className="TabsTrigger" value="tab4">
          运营
        </Tabs.Trigger> : <span />}
      </Tabs.List>
      <Tabs.Content className="TabsContent" value="tab1">
        <DepositUI user_info={user_info} balance={balance} deposit={deposit} change_period={props.onSelectPeriod} periods={periods}></DepositUI>
      </Tabs.Content>
      <Tabs.Content className="TabsContent" value="tab2">
        <WithdrawUI user_info={user_info} balance={balance} withdraw={withdraw} change_period={props.onSelectPeriod} periods={periods}></WithdrawUI>
      </Tabs.Content>
      {address == admin ? <Tabs.Content className="TabsContent" value="tab3">
        <AdminUI user_info={user_info} balance={balance} storage={storage}  assign={assign} withdraw_fee={withdraw_fee} change_period={props.onSelectPeriod} periods={periods}></AdminUI>
      </Tabs.Content> : <span />}
      { is_operator ? <Tabs.Content className="TabsContent" value="tab4">
        <OperatorUI user_info={user_info} balance={balance} storage={storage}  donate={donate} allocate={allocate} change_period={props.onSelectPeriod} periods={periods}></OperatorUI>
      </Tabs.Content> : <span />}
    </Tabs.Root>
  )
}

export default UserInfoUI;