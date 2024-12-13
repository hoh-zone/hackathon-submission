import React from "react";
import UserInfoUI from "./UserInfoUI";
import TableUI from "./Table";

const App: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <UserInfoUI />
      <TableUI />
    </div>
  );
};

export default App;
