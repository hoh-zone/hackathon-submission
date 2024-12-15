import  { useState } from 'react';
import {useEffect } from 'react';
import { Input, Button, Space, DatePicker } from 'antd';
import dayjs, { Dayjs } from "dayjs";
import { UserShare } from './contract_types';
import { BonusPeriodWrapper } from './contract_types';
import { to_date_str ,sui_show} from './util';
import { progressPropDefs } from '@radix-ui/themes/dist/esm/components/progress.props.js';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

const WithdrawUI = (props : {user_info:UserShare, 
                          balance:number,
                          withdraw : (str:string, _max:number) => void,
                          change_period : (addr:string)=>void,
                          periods : BonusPeriodWrapper[]|undefined}) => {
  let user_info = props.user_info;
  let max_value = 0;
  if(user_info){
    max_value = Number(user_info.asset) + Number(user_info.bonus);
    console.log("withdrawui max:",max_value, user_info.asset, user_info.bonus);
  }

  let [withdraw_value, set_deposit_value ] = useState<string>("");

  return (
    <div>
      <div>MAX: {sui_show(max_value)} </div>
      <Space.Compact style={{ marginBottom: 20 }}>
        <Input
          style={{ width: "60%", marginRight: 10 }}
          placeholder="输入提取金额"
          value={withdraw_value}
          onChange={ (e)=>{set_deposit_value(e.target.value)}}
        />
        <Button type="primary" onClick={(e) =>props.withdraw && props.withdraw(withdraw_value,max_value/1e9)}>
          取款
        </Button>
        
      </Space.Compact>
      
      
      
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div>你的钱包余额: {sui_show(props.balance)} </div>
          <div>你的资产: {sui_show(user_info.asset)} </div>
          <div>你的奖金: {sui_show(user_info.bonus)} </div>
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

export default WithdrawUI;
