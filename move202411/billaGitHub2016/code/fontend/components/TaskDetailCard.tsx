"use client";

import { forwardRef, Ref, useImperativeHandle, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@/types/task";
import { SUI_MIST, STATUS_MAP, REWARD_METHODS } from "@/config/constants";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { toast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { Record } from "@/types/record";
interface TaskDetailProps {
  taskName: string;
  description: string;
  images: string[];
}

export async function updateTask(updateTask: Partial<Task>): Promise<Task> {
  const response = await fetch(`/api/publishedTasks`, {
    method: "PUT",
    body: JSON.stringify(updateTask),
    headers: {
      "Content-Type": "application/json",
    }
  });
  if (!response.ok) {
    throw new Error("更新任务失败");
  }
  const result = await response.json();
  return result.data;
}

export async function updateWinnerRecord(winnerRecord: any): Promise<Task> {
  const response = await fetch(`/api/raffle`, {
    method: "PUT",
    body: JSON.stringify(winnerRecord),
    headers: {
      "Content-Type": "application/json",
    }
  });
  if (!response.ok) {
    throw new Error("更新中奖记录失败");
  }
  return await response.json();
}

function TaskDetailCard(
  {
    task,
    isLoading = false,
    user,
  }: {
    task: Task | null;
    isLoading?: boolean;
    user: User | null;
  },
  ref: Ref<{
    handlePublish: () => void;
  }>
) {
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    handlePublish,
    handleWithdraw,
    handleRaffle
  }));

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="flex items-center">
      <span className="text-sm text-gray-500">{label}:</span>&nbsp;
      <span className="text-sm font-medium">{value}</span>
    </div>
  );

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          showEffects: true,
          showEvents: true,
        },
      }),
  });
  const handlePublish = () => {
    if (!task) {
      return Promise.reject();
    }
    if (task.status !== 0) {
      toast({
        title: "校验失败",
        description: "任务不能发布",
        variant: "destructive",
      });
      return Promise.reject();
    }
    if (!account) {
      toast({
        title: "校验失败",
        description: "请先连接钱包",
        variant: "destructive",
      });
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      const txb = new Transaction();

      txb.setGasBudget(100000000);
      const [coin] = txb.splitCoins(txb.gas, [
        // BigInt(task.pool as number),
        task.pool as number,
      ]);

      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::task::create_task`,
        arguments: [
          coin,
          txb.pure.string(task.name as string),
          txb.pure.u64(new Date(task.end_date as string).getTime()),
          txb.pure.u8(task.reward_method as number),
          txb.pure.u64(1),
          txb.object("0x6"),
        ],
        // typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>']
        typeArguments: [],
      });

      setLoading(true);
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: async (data) => {
            console.log("transaction digest: " + JSON.stringify(data));
            if (
              ((data.effects &&
                data.effects.status.status) as unknown as string) === "success"
            ) {
              const taskAddress =
                data.events && Array.isArray(data.events) && (data.events.length > 0) && (data.events[0].parsedJson as any).task_id
              const taskAdminCap =
                data.events && Array.isArray(data.events) && (data.events.length > 0) && (data.events[0].parsedJson as any).task_cap
              updateTask({
                id: task.id,
                publish_date: new Date().toISOString().toLocaleString(),
                status: 1,
                owner_address: account.address,
                address: taskAddress,
                task_admin_cap_address: taskAdminCap,
              })
                .then(() => {
                  toast({
                    title: "发布成功",
                    description: "任务发布成功，在犹豫期内可下架任务",
                  });
                  resolve("");
                })
                .catch((err) => {
                  reject(err);
                })
                .finally(() => {
                  setLoading(false);
                });
            } else {
              toast({
                title: "发布失败",
                description: "发布链上任务失败，请稍后再试",
                variant: "destructive",
              });
            }
          },
          onError: (err) => {
            console.log("transaction error: " + err);
            toast({
              title: "发布失败",
              description: `发布链上任务失败:${err.message}，请稍后再试`,
              variant: "destructive",
            });
            setLoading(false);
            reject(err);
          },
        }
      );
    });
  };

  const handleWithdraw = () => {
    if (!task) {
      return Promise.reject();
    }
    if (!account) {
      toast({
        title: "校验失败",
        description: "请先连接钱包",
        variant: "destructive",
      });
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      const txb = new Transaction();

      txb.setGasBudget(100000000);
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::task::withdraw_task`,
        arguments: [
          txb.object(task.address as string),
          txb.object(task.task_admin_cap_address as string),
          txb.object("0x6"),
        ],
        typeArguments: [],
      });
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::task::remove_all_task_records`,
        arguments: [
          txb.object(task.address as string),
          txb.object(task.task_admin_cap_address as string),
          txb.object("0x6"),
        ],
        typeArguments: [],
      });
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::task::remove_task`,
        arguments: [
          txb.object(task.address as string),
          txb.object(task.task_admin_cap_address as string),
          txb.object("0x6"),
        ],
        typeArguments: [],
      });

      setLoading(true);
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: async (data) => {
            console.log("withdraw digest: " + JSON.stringify(data));
            if (
              ((data.effects &&
                data.effects.status.status) as unknown as string) === "success"
            ) {
              toast({
                title: "提现成功",
                description: "任务提现成功，链上任务数据已删除",
              });
              updateTask({
                id: task.id,
                status: 0
              })
                .then(() => {
                  resolve("");
                })
                .catch((err) => {
                  toast({
                    title: "提示",
                    description: "更新任务信息失败",
                    variant: "destructive",
                  });
                  reject(err);
                })
                .finally(() => {
                  setLoading(false);
                });
            } else {
              toast({
                title: "提现失败",
                description: "链上数据提现失败，请稍后再试",
                variant: "destructive",
              });
              setLoading(false);
              reject(new Error("提现失败"));
            }
          },
          onError: (err) => {
            console.log("transaction error: " + err);
            toast({
              title: "提现失败",
              description: `链上数据提现失败:${err.message}，请稍后再试`,
              variant: "destructive",
            });
            setLoading(false);
            reject(err);
          },
        }
      );
    });
  };

  const handleRaffle = () => {
    if (!task) {
      return Promise.reject();
    }
    if (!account) {
      toast({
        title: "校验失败",
        description: "请先连接钱包",
        variant: "destructive",
      });
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      const txb = new Transaction();

      txb.setGasBudget(100000000);
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::task::handle_task_raffle`,
        arguments: [
          txb.object(task.task_admin_cap_address as string),
          txb.object(task.address as string),
          txb.object("0x8"),
          txb.object("0x6"),
        ],
        typeArguments: [],
      });

      setLoading(true);
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: async (data) => {
            console.log("raffle: " + JSON.stringify(data));
            if (
              ((data.effects &&
                data.effects.status.status) as unknown as string) === "success"
            ) {
              toast({
                title: "抽奖成功",
                description: "抽奖成功，奖励已发放",
              });
              await updateTask({
                id: task.id,
                status: 2
              })
                .catch((err) => {
                  toast({
                    title: "提示",
                    description: "更新任务信息失败",
                    variant: "destructive",
                  });
                  reject(err);
                })
              
                const events = data.events;
                const rewardEvent = Array.isArray(events) && events.length > 0 ? events[0] : null;
                if (rewardEvent) {
                  await updateWinnerRecord({
                    winnerRecord: {
                      reward_digest: data.digest,
                      task_address: (rewardEvent.parsedJson as any).task_id,
                      record_address: (rewardEvent.parsedJson as any).record_id
                    }
                  }).catch((err) => {
                    toast({
                      title: "提示",
                      description: "更新申请信息失败",
                      variant: "destructive",
                    });
                    reject(err);
                  })
                }
              resolve('')
              setLoading(false);
            } else {
              toast({
                title: "抽奖失败",
                description: "链上任务抽奖失败，请稍后再试",
                variant: "destructive",
              });
              setLoading(false);
              reject(new Error("抽奖失败"));
            }
          },
          onError: (err) => {
            console.log("transaction error: " + err);
            toast({
              title: "抽奖失败",
              description: `链上任务抽奖失败:${err.message}，请稍后再试`,
              variant: "destructive",
            });
            setLoading(false);
            reject(err);
          },
        }
      );
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    task && (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-center">
            {task.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm text-gray-500">任务描述:</h3>
            <p className="text-sm leading-relaxed">{task.desc}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <DetailItem
                label="奖励方式"
                value={REWARD_METHODS[task.reward_method as 1 | 2] as string}
              />
              <DetailItem
                label="任务状态"
                value={STATUS_MAP[task?.status as 0 | 1 | 2] as string}
              />
              <DetailItem
                label="奖池金额"
                value={(task.pool as number) / SUI_MIST + "SUI"}
              />
              {/* <DetailItem
                label="申请通过总数"
                value={task.claim_limit as number}
              /> */}
              {task.reward_method === 1 && (
                <DetailItem
                  label="单个申请奖励金额"
                  value={
                    (task.pool as number) /
                    SUI_MIST /
                    (task.claim_limit as number) +
                    "SUI"
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <DetailItem
                label="创建时间"
                value={new Date(task.created_at).toLocaleString()}
              />
              <DetailItem
                label="任务发布日期"
                value={(task.publish_date && new Date(task.publish_date as string).toLocaleString()) || "未发布"}
              />
              <DetailItem
                label="任务结束日期"
                value={new Date(task.end_date as string).toLocaleString()}
              />
              <DetailItem
                label="已通过申请数/总数"
                value={(task.record_pass_count || 0) + "/" + task.claim_limit}
              />
            </div>
          </div>
          {user?.id === task.user_id && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-gray-500">
                  钱包地址:{" "}
                  <ConnectButton className="bg-fuchsia-800"></ConnectButton>
                </span>
              </div>
            </>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm text-gray-500 mb-2">附件图片</h3>
                <div className="grid grid-cols-4 gap-2">
                  {task.attachments.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden"
                    >
                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                      >
                        <Image
                          src={image}
                          alt={`Task image ${index + 1}`}
                          width={120}
                          height={120}
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {/* <Button onClick={handlePublish}>测试发布</Button>
          <Button onClick={handleClaim}>测试申请</Button> */}
        </CardFooter>
      </Card>
    )
  );
}

export default forwardRef(TaskDetailCard);
