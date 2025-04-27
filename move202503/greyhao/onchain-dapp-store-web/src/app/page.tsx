'use client';

import Image from "next/image";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { loadStoreInfo } from "@/contracts";
import { useEffect, useRef, useState } from 'react';
import { DAppInfo, StoreInfo } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formateAddress, formateDate } from "@/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { useGlobalLoading } from "@/provider/GlobalLoadingProvier";
import { Transaction } from "@mysten/sui/transactions";
import { currentNetConfig } from "@/utils/sui";
import Topbar from "@/components/topbar";

export default function Home() {

  const currentAddress = useCurrentAccount();
  const [reloadStoreInfo, setReloadStoreInfo] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const totalAdmin = useRef(0);
  const { setLoading } = useGlobalLoading();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    setLoading(true);
    const loadInfo = async () => {
      const temp = await loadStoreInfo();
      setStoreInfo(temp);
      if (storeInfo && currentAddress) {
        setIsAdmin(storeInfo?.admins.includes(currentAddress.address));
      }
      setIsSuperAdmin(currentAddress?.address === currentNetConfig.superAdmin);
      totalAdmin.current = storeInfo?.admins.length || 0;
      setReloadStoreInfo(false);
      setLoading(false);
    }
    loadInfo();
    return () => {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setStoreInfo(null);
    }
  }, [currentAddress, reloadStoreInfo]);

  const handleVerifyState = async (info: DAppInfo, isApprove: boolean) => {
    setLoading(true);
    const tx = new Transaction();
    tx.moveCall({
      package: currentNetConfig.package,
      module: currentNetConfig.module,
      function: "admin_verify_dapp",
      arguments: [
        tx.pure.bool(isApprove ? true : false),
        tx.object(currentNetConfig.storeInfo),
        tx.object(info.id.id),
      ]
    });
    signAndExecuteTransaction({
      transaction: tx,
    }, {
      onSuccess: (reslut) => {
        console.log(reslut);
        alert("审核通过");
        setLoading(false);
        setReloadStoreInfo(true);
      },
      onError: (error) => {
        setLoading(false);
        console.log("Error ", error.message);
        alert(`审核失败： ${error}`);
      },
    });
  }

  const adminStateView = (info: DAppInfo) => {
    if (info.approve_admins.includes(currentAddress?.address || "")) {
      return <p>已通过</p>
    }
    if (info.approve_admins.includes(currentAddress?.address || "")) {
      return <p>已拒绝</p>
    }
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='outline'>现在审核</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              审核 DApp
            </AlertDialogTitle>
            <AlertDialogDescription>
              重要：审核之前，请确认该协议您已访问并且确认它是安全的。如果随意审核，你的管理员会被取消。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>暂不审核</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleVerifyState(info, true)}>审核通过</AlertDialogAction>
            <AlertDialogAction onClick={() => handleVerifyState(info, false)}>拒绝通过</AlertDialogAction>
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    );
  }

  return (
    <div className="container mx-auto h-dvh p-4 flex flex-col justify-between">
      <Topbar />
      <main className="w-full h-full mx-auto pt-4 overflow-scroll">
        {/* dApp 信息 */}
        {
          storeInfo && <div className="">
            {isSuperAdmin && <div className="mb-2 border-1 p-2 rounded-md">
              <p>当前地址是超级管理员，您可以添加/删除管理员。</p>
              <Button asChild variant="outline" className="mt-2 mr-4">
                <Link href="/add/admin">
                  添加管理员
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admins">
                  所有管理员
                </Link>
              </Button>
            </div>}

            {isAdmin && <div className="flex flex-col mt-2">
              <p className="text-blue-500">当前地址是管理员，请及时审核还未审核的 DApp。</p>
            </div>}

            <div className="border-1 p-2 rounded-md mt-4">
              <p>添加想让 dApp Store 收录的应用，请确保信息的真实性，提交之后我们会尽快审核。</p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/add/dapp">
                  提交 DApp
                </Link>
              </Button>
            </div>

            {
              storeInfo.dApps &&
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {isAdmin && <TableHead>审核状态</TableHead>}
                    <TableHead>图标</TableHead>
                    <TableHead>名字</TableHead>
                    <TableHead>网址</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>提交地址</TableHead>
                    <TableHead>提交时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 管理员可以看到所有提交的应用列表，非管理员只能看到已经通过审核的应用（通过审核的管理大于等于所有管理员的一半） */}
                  {
                    storeInfo.dApps.filter(item => isAdmin ? true : item.approve_admins.length * 2 >= storeInfo.admins.length).map((item, index) => (
                      <TableRow key={item.id.id}>
                        <TableCell>{index + 1}</TableCell>
                        {isAdmin &&
                          <TableCell>
                            {adminStateView(item)}
                          </TableCell>
                        }
                        <TableCell>
                          {item.url && <img src={item.icon} alt="dapp-icon" className="w-[24px] h-[24px]" />}
                        </TableCell>
                        <TableCell>
                          <p>{item.name}</p>
                        </TableCell>
                        <TableCell>
                          <Link href={item.url} target="_bank">
                            {item.url}
                          </Link>
                        </TableCell>
                        <TableCell>{item.desc}</TableCell>
                        <TableCell>
                          <Link href={currentNetConfig.browser + item.submit_address} target="_bank">
                            {formateAddress(item.submit_address)}
                          </Link>
                        </TableCell>
                        <TableCell>{formateDate(item.submit_timestamp)}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            }
          </div>
        }

      </main>
      <footer className="flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://x.com/0x0grey"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          想申请成为管理员？点击联系我
        </a>
      </footer>
    </div>
  );
}
