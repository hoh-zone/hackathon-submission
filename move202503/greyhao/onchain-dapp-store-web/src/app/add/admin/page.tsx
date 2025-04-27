"use client";

import Topbar from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { currentNetConfig } from "@/utils/sui";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";

export default function AddAdminPage() {

  const [inputAddress, setInputAddress] = useState<string>("");

  const currentAddress = useCurrentAccount();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setIsSuperAdmin(currentAddress?.address === currentNetConfig.superAdmin);

    return () => {
      setIsSuperAdmin(false);
    }
  }, [currentAddress]);


  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleAddAdmin = async () => {
    if (!currentAddress) {
      alert("请先连接钱包");
      return;
    }
    const tx = new Transaction();
    tx.moveCall({
      package: currentNetConfig.package,
      module: currentNetConfig.module,
      function: "add_admin",
      arguments: [
        tx.object(currentNetConfig.superAdminCap),
        tx.object(currentNetConfig.storeInfo),
        tx.pure.address(inputAddress),
      ],
    });

    signAndExecuteTransaction({
      transaction: tx,
    }, {
      onSuccess: (result) => {
        alert("成功");
        console.log(result);
        setInputAddress("");
      },
      onError: (err) => {
        console.log(err);
      }
    });
  }

  return (
    <div className="container  mx-auto h-dvh p-4 flex flex-col items-center">
      <Topbar />
      {
        !currentAddress &&
        <div>
          <p className="font-bold text-red-500 text-2xl">
            ⚠️ 请先连接钱包
          </p>
        </div>
      }
      {
        !isSuperAdmin &&
        <div>
          <p className="font-bold text-red-500 text-2xl">
            ⚠️ 只有超级管理员可以使用此功能。
          </p>
        </div>
      }
      {
        isSuperAdmin &&
        <Card className="w-[550px] mt-6">
          <CardHeader>
            <CardTitle>添加管理员</CardTitle>
            <CardDescription>作为超级管理员，添加管理员审核已经提交到平台的应用。你需要确认被添加的地址的真实性。</CardDescription>
          </CardHeader>

          <CardContent>
            <form >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">钱包地址</Label>
                  <Input
                    id="name"
                    placeholder="请输入钱包地址"
                    inputMode="text"
                    value={inputAddress}
                    onChange={(v) => setInputAddress(v.target.value)}
                  />
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleAddAdmin()}>
              添加
            </Button>
          </CardFooter>
        </Card>
      }

    </div>
  );
}