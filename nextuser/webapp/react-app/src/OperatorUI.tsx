import  { useState } from 'react';
import {useEffect } from 'react';
import { Input, Button, Space, DatePicker } from 'antd';
import dayjs, { Dayjs } from "dayjs";
import { BonusPeriodWrapper,StorageData ,UserShare} from './contract_types';
import { to_date_str ,sui_show} from './util';
import { progressPropDefs } from '@radix-ui/themes/dist/esm/components/progress.props.js';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { get_balance } from './data-provider';

const OperatorUI = (props : {user_info:UserShare, 
                          balance:number,
                          storage:StorageData | null
                          donate : (str:string, _max:number) => void,
                          allocate : ()=>void,
                          change_period : (addr:string)=>void,
                          periods : BonusPeriodWrapper[]|undefined}) => {

  let [amount , set_amount] = useState<string>("");
  let max_value = props.balance

  return (
    <div>
      <div>MAX: {sui_show(max_value)} </div>
      <Space.Compact style={{ marginBottom: 20 }}>
        <Input
          style={{ width: "60%", marginRight: 10 }}
          placeholder="输入捐赠金额"
          value={amount}
          onChange={ (e)=>{set_amount(e.target.value)}}
        />
        <Button type="primary" onClick={(e) =>props.donate && props.donate(amount,max_value/1e9)}>
          捐赠奖金
        </Button>
        
      </Space.Compact>
 
     
      
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div>奖金余额: {sui_show(props.storage ? Number(props.storage.bonus_donated) : 0 )} 
          <Button type="primary" onClick={(e) =>{  props.allocate()} }>
          分配奖金
        </Button></div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div>你的钱包余额: {sui_show(props.balance)} </div>
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

export default OperatorUI;
