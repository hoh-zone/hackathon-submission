import React from "react";
import UserInfoUI from "./UserInfoUI";
import TableUI from "./Table";
import { useState } from "react";

const App: React.FC = () => {
  let [period_addr,set_period_addr] = useState<string>();

  let change_period = (addr : string )=>{
    set_period_addr(addr);
  };

  return (
    <div style={{ padding: 20 }}>
      <UserInfoUI onSelectPeriod={change_period}/>
      <TableUI period_id = {period_addr}/>
    </div>
  );
};

export default App;
