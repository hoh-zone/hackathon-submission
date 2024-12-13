import  { useState } from 'react';
import {useEffect } from 'react';
import { Input, Button, Space, DatePicker } from 'antd';
import dayjs, { Dayjs } from "dayjs";
import {UserInfo } from './contract_types';
const SpaceUI = (props : {user_info:UserInfo}) => {
  let user_info = props.user_info;
  const [depositInput, setDepositInput] = useState('');
  // const [totalDeposit, setTotalDeposit] = useState(0);
  // const [interest, setInterest] = useState(0);
  // const [prize, setPrize] = useState(0);
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  useEffect(()=>{

  },[])

  const handleAddDeposit = () => {
    // 假设这里是添加存款的逻辑
    ///setTotalDeposit(totalDeposit + parseFloat(depositInput));
    // 你可以根据需要更新利息和中奖金额
  };

  const handleDateChange = (date: Dayjs | null, dateString: string | string[]) => {
    if (date) {
      // 如果 dateString 是字符串数组，取数组的第一个元素，或者其他适合的处理方式
      const dateToSet = Array.isArray(dateString) ? dateString[0] : dateString;
      setDate(dateToSet); // 更新日期为字符串格式
    }
  };

  const SUI_OVER_FROST = 1e9;
  function sui_show( amount : number) : string{
     return amount > SUI_OVER_FROST ?  String(amount/SUI_OVER_FROST) + " SUI"
                             :  String(amount ) + "FROST";
  }


  return (
    <div>
      <Space.Compact style={{ marginBottom: 20 }}>
        <Input
          style={{ width: "60%", marginRight: 10 }}
          placeholder="输入存款金额"
          value={depositInput}
          onChange={(e) => setDepositInput(e.target.value)}
        />
        <Button type="primary" onClick={handleAddDeposit}>
          增加存款
        </Button>
      </Space.Compact>
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div>你的存款: {sui_show(user_info.orignal_amount)} </div>
          <div>你的利息: {sui_show(user_info.reward)} </div>
          <div>你的中奖: {sui_show(user_info.bonus)} </div>
        </div>
        <DatePicker
          style={{ marginBottom: 10 }}
          value={dayjs(date, "YYYY-MM-DD")}
          onChange={handleDateChange}
        />
        <div>距离下次开奖还有23小时23分钟</div>
      </div>
    </div>
  );
};

export default SpaceUI;
