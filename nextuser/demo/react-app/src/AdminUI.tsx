import  { useState } from 'react';
import {useEffect } from 'react';
import { Input, Button, Space, DatePicker } from 'antd';
import dayjs, { Dayjs } from "dayjs";
import { StorageData, UserShare } from './contract_types';
import { BonusPeriodWrapper } from './contract_types';
import { to_date_str ,sui_show} from './util';
import { progressPropDefs } from '@radix-ui/themes/dist/esm/components/progress.props.js';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

const AdminUI = (props : {user_info : UserShare,
                          storage : StorageData | null,
                          balance : number,
                          assign : (str:string) =>void,
                          change_period : (addr:string)=>void,
                          withdraw_fee : (value :string, max :number) =>void,
                          periods : BonusPeriodWrapper[]|undefined}) => {


  let [fee,set_fee] = useState<string>("");
  let max_value = props.storage ? Number(props.storage.fee_balance) : 0;
  let [to, set_to ] = useState<string>("");
  return (
    <div>
      <div>
        <div>MAX：{sui_show(max_value)}</div>
        <Space.Compact style={{ marginBottom: 20 }}>
          <Input
            style={{ width: "60%", marginRight: 10 }}
            placeholder="提取费用"
            value={fee}
            onChange={ (e)=>{set_fee(e.target.value)}}
          />
          <Button type="primary" onClick={(e) =>props.withdraw_fee && props.withdraw_fee(fee,max_value/1e9)}>
            取款
          </Button>
          
        </Space.Compact>
      <div>
      </div>
      <Space.Compact style={{ marginBottom: 20 }}>
        <Input
          style={{ width: "60%", marginRight: 10 }}
          placeholder="输入新运营者地址"
          value={to}
          onChange={ (e)=>{set_to(e.target.value)}}
        />
        <Button type="primary" onClick={(e) =>props.assign && props.assign(to)}>
          增加运营
        </Button>
        
      </Space.Compact>  
      </div>  
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div>你的钱包余额: {sui_show(props.balance)} </div>
          {props.storage != null ? 
          <div>
            <div>总存款: {sui_show(props.storage!.total_staked)} </div>
            <div>待提取奖金: {sui_show(Number(props.storage!.bonus_balance))} </div>
            <div>捐赠奖金: {sui_show(Number(props.storage!.bonus_donated))} </div>
            <div>未提取费用: {sui_show(max_value)} </div>
          </div>
          : <span/> }
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

export default AdminUI;
