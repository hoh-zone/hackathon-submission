//import React from "react"
import { Table, Button, message } from "antd"
import { CopyOutlined } from "@ant-design/icons";
import data from "./services/data";
import copy from "copy-to-clipboard";
import type { ColumnsType } from "antd/es/table";
import { DataType } from "./services/type";
const handleCopy = (text: string) => {
  copy(text);
  message.success("地址已复制到剪贴板！");
};
const columns: ColumnsType<DataType> = [
  {
    title: "地址",
    dataIndex: "address",
    key: "address",
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
    dataIndex: "asset",
    key: "asset",
  }, 
  {
    title: "奖金",
    dataIndex: "reward",
    key: "reward",
  },
];

const TableUI = () => {

  return (
    <div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="address"
        pagination={{ pageSize: 3 }}
      />
    </div>
  )
}

export default TableUI