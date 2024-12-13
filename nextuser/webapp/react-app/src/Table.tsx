//import React from "react"
import { Table, Button, message } from "antd"
import { CopyOutlined } from "@ant-design/icons";
import data from "./services/data";
import copy from "copy-to-clipboard";
import type { ColumnsType } from "antd/es/table";
////import { DataType } from "./services/type";
import { get_records } from "./data-provider";
import { useEffect,useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { BonusRecord} from "./contract_types";
const handleCopy = (text: string) => {
  copy(text);
  message.success("地址已复制到剪贴板！");
};
const columns: ColumnsType<BonusRecord> = [
  {
    title: "地址",
    dataIndex: "id",
    key: "id",
    render: (text) => (
      <div>
        <span>{text}</span>
        <Button
          type="link"
          style={{ marginLeft: 8 }}
          onClick={() => handleCopy(text)}
        >
          <CopyOutlined /> 
        </Button>
      </div>
    ),
  },

  {
    title: "原始本金",
    dataIndex: "principal",
    key: "principal",
  },
  {
    title: "现有资产",
    dataIndex: "principal",
    key: "principal",
  }, 
  {
    title: "奖金",
    dataIndex: "gain",
    key: "gain",
  },
];

const TableUI = ( props:{period_id:string | undefined }) => {
  let suiClient = useSuiClient();
  let [records,set_records] = useState<BonusRecord[]>([]);
  useEffect(()=>{
    if(props.period_id){
      get_records(suiClient,props.period_id).then((r)=>{
        set_records(r);
        console.log(r)
      });
     
    }
  },[props.period_id])
  return (
    <div>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={{ pageSize: 3 }}
      />
    </div>
  )
}

export default TableUI