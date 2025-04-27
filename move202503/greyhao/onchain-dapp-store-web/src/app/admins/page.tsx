'use client';

import Topbar from "@/components/topbar";
import { AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialog, AlertDialogContent, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadStoreInfo } from "@/contracts";
import { currentNetConfig } from "@/utils/sui";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminsPage() {

  const currentAddress = useCurrentAccount();
  const [allAdmin, setAllAdmin] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [reloadInfo, setReloadInfo] = useState(true);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    const loadInfo = async () => {
      const temp = await loadStoreInfo();
      console.log("temp ", temp.admins.length);
      setAllAdmin(temp.admins);
    }
    loadInfo();
    return () => {
      setIsSuperAdmin(false);
      setAllAdmin([]);
      setReloadInfo(false);
    }
  }, [reloadInfo]);

  useEffect(() => {
    setIsSuperAdmin(currentAddress?.address === currentNetConfig.superAdmin);

    return () => {
      setIsSuperAdmin(false);
    }
  }, [currentAddress]);

  const handleDelAdmin = (address: string) => {
    const tx = new Transaction();
    tx.moveCall({
      package: currentNetConfig.package,
      module: currentNetConfig.module,
      function: "remove_admin",
      arguments: [
        tx.object(currentNetConfig.superAdminCap),
        tx.object(currentNetConfig.storeInfo),
        tx.pure.address(address),
      ],
    });

    signAndExecuteTransaction({
      transaction: tx,
    }, {
      onSuccess: (reslut) => {
        console.log(reslut);
        alert("删除完成");
        setReloadInfo(true);
      },
      onError: (error) => {
        console.log("Error ", error.message);
        alert(`删除失败： ${error}`);
      },
    });


  }

  const delView = (address: string) => {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">删除权限</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              删除地址的管理权限
            </AlertDialogTitle>
            <AlertDialogDescription>
              删除之前请确认地址无误
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>暂不删除</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelAdmin(address)}>立即删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="container mx-auto h-dvh p-4 flex flex-col">
      <Topbar />

      {isSuperAdmin && <div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>钱包</TableHead>
              <TableHead>管理</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {
              allAdmin.map((item, index) => (
                <TableRow key={item}>
                  <TableCell>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Link href={currentNetConfig.browser + item} target="_bank">
                      {item}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {delView(item)}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>}
    </div>
  );
}