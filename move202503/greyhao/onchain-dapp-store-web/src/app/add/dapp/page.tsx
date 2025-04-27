'use client';

import Topbar from "@/components/topbar"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentNetConfig } from "@/utils/sui";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";

export default function AddDAppPage() {

  const currentAddress = useCurrentAccount();

  const [name, setName] = useState<string>("");
  const [icon, setIcon] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleSubmit = async () => {
    if (!currentAddress) {
      alert("请先连接钱包");
      return;
    }
    const tx = new Transaction();
    tx.moveCall({
      package: currentNetConfig.package,
      module: currentNetConfig.module,
      function: "submit_dApp",
      arguments: [
        tx.pure.string(name),
        tx.pure.string(icon),
        tx.pure.string(url),
        tx.pure.string(desc),
        tx.pure.u64((new Date()).getTime()),
        tx.object(currentNetConfig.storeInfo),
      ]
    });

    signAndExecuteTransaction({
      transaction: tx,
    }, {
      onSuccess: (result) => {
        alert("成功");
        console.log(result);
        setName("");
        setIcon("");
        setUrl("");
        setDesc("");
      },
      onError: (err) => {
        console.log(err);
      }
    });
  }

  return (
    <div className="container mx-auto h-dvh p-4 flex flex-col items-center">
      <Topbar />

      <Card className="w-[550px] mt-6">
        <CardHeader>
          <CardTitle>提交您的 DApp 应用</CardTitle>
          <CardDescription>共建更好的应用平台，您提交之后请耐心等待我们的管理员进行审核，审核通过会在首页列表中展示。</CardDescription>
        </CardHeader>
        <CardContent>
          <form >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">应用名</Label>
                <Input
                  id="name"
                  placeholder="请输入应用名字"
                  inputMode="text"
                  value={name}
                  onChange={(v) => setName(v.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="icon">图标链接</Label>
                <Input
                  id="icon"
                  placeholder="请输入应用图标链接"
                  inputMode="url"
                  value={icon}
                  onChange={(v) => setIcon(v.target.value)}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="url">网站链接</Label>
                <Input
                  id="url"
                  placeholder="请输入应用网站链接"
                  inputMode="url"
                  value={url}
                  onChange={(v) => setUrl(v.target.value)}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="desc">应用描述</Label>
                <Input
                  id="desc"
                  placeholder="请输入应用描述"
                  inputMode="text"
                  value={desc}
                  onChange={(v) => setDesc(v.target.value)}
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={() => handleSubmit()}>
            提交
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};