import  { useState } from 'react';
import {useEffect } from 'react';
import { Input, Button, Space, DatePicker } from 'antd';
import dayjs, { Dayjs } from "dayjs";
import { UserShare } from './contract_types';
import { BonusPeriodWrapper } from './contract_types';
import { to_date_str ,sui_show} from './util';
import { progressPropDefs } from '@radix-ui/themes/dist/esm/components/progress.props.js';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

const DepositUI = (props : {user_info:UserShare, 
                          balance:number,
                          deposit : (str:string,max:number) => void,
                          change_period : (addr:string)=>void,
                          periods : BonusPeriodWrapper[]|undefined}) => {
  let user_info = props.user_info;
  let max = Number(props.balance);


  const handleAddDeposit = () => {
    // 假设这里是添加存款的逻辑
    ///setTotalDeposit(totalDeposit + parseFloat(depositInput));
    // 你可以根据需要更新利息和中奖金额
  };

  let [deposit_value, set_deposit_value ] = useState<string>("");

  return (
    <div>
      <div>MAX：{sui_show(max)}</div>
      <Space.Compact style={{ marginBottom: 20 }}>
        <Input
          style={{ width: "60%", marginRight: 10 }}
          placeholder="输入存款金额"
          value={deposit_value}
          onChange={ (e)=>{set_deposit_value(e.target.value)}}
        />
        <Button type="primary" onClick={(e) =>props.deposit && props.deposit(deposit_value,max/1e9)}>
          增加存款
        </Button>
        
      </Space.Compact>
      
      
      
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div>你的存款: {sui_show(user_info.original_money)} </div>
          <div>你的利息: {sui_show( (user_info.asset - user_info.original_money))} </div>
          <div>你的中奖: {sui_show(user_info.bonus)} </div>
        </div>
        <select onChange={ (e) =>{console.log(e);  props.change_period(e.target.value)  }}>
            {
              props.periods && props.periods!.map( (p,k)=>{
                  //console.log("period:", p);
                  return <option value={p.id.id} key={p.id.id}>{to_date_str(Number(p.time_ms))}</option>
              })

            }
        </select>
        <div>距离下次开奖还有23小时23分钟</div>
      </div>
    </div>
  );
};

export default DepositUI;
