"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SuiInputVotePool, VoteOption, EncryptedInputVotePool } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import * as sealUtils from "@/contracts/seal";
import { suiClient } from "@/contracts";
import { createVotePoolTx, createVotePoolTx_woal } from "@/contracts/transaction";
import { AllowlistManager } from "@/components/vote/allowlist-manager";
import { findObjectTypeName } from "@/contracts/query";
import { Transaction } from "@mysten/sui/transactions";

// 表单步骤类型
type FormStep = "basicInfo" | "options" | "time" | "permissions" | "confirmation";

// 生成随机ID前缀 (3个字符)
const generateRandomIdPrefix = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(3);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < 3; i++) {
        result += chars[randomValues[i] % chars.length];
    }

    return result;
};

// 投票选项类型
interface FormVoteOption {
    id: string;
    text: string;
}

// 投票表单数据类型
interface VoteFormData {
    title: string;
    description: string;
    options: FormVoteOption[];
    startTime: string;
    endTime: string;
    permissionType: "all" | "specific";
    selectedAllowlistId: string;
    selectedAllowlistInfo: {
        name: string;
        addressCount: number;
    } | null;
}

// 步骤配置
const STEPS: { [key in FormStep]: { title: string; description: string } } = {
    basicInfo: {
        title: "基本信息",
        description: "设置投票的标题和描述"
    },
    options: {
        title: "选项设置",
        description: "添加投票选项"
    },
    time: {
        title: "时间设置",
        description: "设置投票的开始和结束时间"
    },
    permissions: {
        title: "权限设置",
        description: "设置谁可以参与投票"
    },
    confirmation: {
        title: "确认提交",
        description: "确认投票信息并提交"
    }
};

export function VoteForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<FormStep>("basicInfo");
    const [idPrefix, setIdPrefix] = useState<string>(generateRandomIdPrefix());

    const [formData, setFormData] = useState<VoteFormData>({
        title: "",
        description: "",
        options: [
            { id: `${idPrefix}_0`, text: "" },
            { id: `${idPrefix}_1`, text: "" }
        ],
        startTime: "",
        endTime: "",
        permissionType: "all",
        selectedAllowlistId: "",
        selectedAllowlistInfo: null
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");

    const currentAccount = useCurrentAccount();

    // 当钱包地址改变时重置表单
    useEffect(() => {
        // 生成新的ID前缀
        const newIdPrefix = generateRandomIdPrefix();
        setIdPrefix(newIdPrefix);

        // 重置表单数据到初始状态
        setFormData({
            title: "",
            description: "",
            options: [
                { id: `${newIdPrefix}_0`, text: "" },
                { id: `${newIdPrefix}_1`, text: "" }
            ],
            startTime: "",
            endTime: "",
            permissionType: "all",
            selectedAllowlistId: "",
            selectedAllowlistInfo: null
        });
        // 重置到第一步
        setCurrentStep("basicInfo");
    }, [currentAccount]);

    const { mutate: signAndExecute } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showEffects: true,
                },
            }),
    });

    // 获取当前步骤索引
    const getCurrentStepIndex = () => {
        const steps: FormStep[] = ["basicInfo", "options", "time", "permissions", "confirmation"];
        return steps.indexOf(currentStep);
    };

    // 导航到上一步
    const goToPrevStep = () => {
        const stepIndex = getCurrentStepIndex();
        if (stepIndex > 0) {
            const steps: FormStep[] = ["basicInfo", "options", "time", "permissions", "confirmation"];
            setCurrentStep(steps[stepIndex - 1]);
        }
    };

    // 导航到下一步
    const goToNextStep = () => {
        const stepIndex = getCurrentStepIndex();
        const steps: FormStep[] = ["basicInfo", "options", "time", "permissions", "confirmation"];
        if (stepIndex < steps.length - 1) {
            setCurrentStep(steps[stepIndex + 1]);
        }
    };

    // 添加新选项
    const addOption = () => {
        // 获取当前最大的索引值
        const maxIndex = formData.options.reduce((max, option) => {
            const parts = option.id.split('_');
            const index = parseInt(parts[1]);
            return Math.max(max, index);
        }, -1);

        setFormData({
            ...formData,
            options: [...formData.options, { id: `${idPrefix}_${maxIndex + 1}`, text: "" }]
        });
    };

    // 删除选项
    const removeOption = (id: string) => {
        if (formData.options.length <= 2) {
            return; // 保持至少两个选项
        }
        setFormData({
            ...formData,
            options: formData.options.filter(option => option.id !== id)
        });
    };

    // 更新选项文本
    const updateOptionText = (id: string, text: string) => {
        setFormData({
            ...formData,
            options: formData.options.map(option =>
                option.id === id ? { ...option, text } : option
            )
        });
    };

    // 更新选择的白名单ID
    const updateSelectedAllowlistId = (id: string) => {
        setFormData({
            ...formData,
            selectedAllowlistId: id
        });
    };

    // 更新选择的白名单信息
    const updateSelectedAllowlistInfo = (info: { name: string, addressCount: number }) => {
        setFormData({
            ...formData,
            selectedAllowlistInfo: info
        });
    };

    const transformFormData = (): { suiVotePool: SuiInputVotePool, encryptInput: EncryptedInputVotePool } => {
        const start = new Date(formData.startTime).getTime();
        const end = new Date(formData.endTime).getTime();

        // 将投票选项转换为合适的格式
        const options: VoteOption[] = formData.options.map((option) => ({
            id: option.id,
            text: option.text
        }));

        const encryptInput: EncryptedInputVotePool = {
            title: formData.title,
            description: formData.description,
            options: options
        }

        const suiVotePool: SuiInputVotePool = {
            title: formData.title,
            allowlist_Id: formData.permissionType === "specific" ? formData.selectedAllowlistId : "",
            start,
            end,
            details: ""
        }

        return { suiVotePool, encryptInput };
    }

    const encryptVotePool = async (EncryptInput: EncryptedInputVotePool) => {

        if (formData.permissionType !== "specific" && !formData.selectedAllowlistId) {
            throw new Error("白名单ID不能为空");
        }

        try {
            setProcessingStatus("投票池加密中...");

            const allowlistId = formData.permissionType === "specific" ? formData.selectedAllowlistId : "";
            const encryptedBytes = await sealUtils.encryptVotePool(EncryptInput, allowlistId);

            return encryptedBytes;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    const handleCreateVotePool = async () => {
        try {
            setIsProcessing(true);
            let tx = new Transaction();
            if (formData.permissionType === "specific" && formData.selectedAllowlistId) {
                const { suiVotePool, encryptInput } = transformFormData();
                const encryptedBytes = await encryptVotePool(encryptInput);
                suiVotePool.details = encryptedBytes;
                console.log(suiVotePool);
                tx = createVotePoolTx(suiVotePool);
            } else {
                const { suiVotePool, encryptInput: details } = transformFormData();
                const Input = JSON.stringify(details);
                suiVotePool.details = Input;
                console.log(suiVotePool);
                tx = createVotePoolTx_woal(suiVotePool);
            }

            setProcessingStatus("正在提交至Sui区块链...");

            signAndExecute({
                transaction: tx.serialize(),
            }, {
                onSuccess: async (result) => {

                    const createdObjects = [];
                    let voteId = "";
                    const digest = result.digest;

                    console.log('交易成功:', result);

                    setIsProcessing(false);
                    setProcessingStatus("");

                    if (result.effects && result.effects.created) {
                        for (const item of result.effects.created) {
                            if (item.owner && typeof item.owner === 'object' && 'Shared' in item.owner) {
                                createdObjects.push(item.reference.objectId);

                                // 检查对象类型并分配ID
                                const objectType = await findObjectTypeName(item.reference.objectId);
                                if (objectType) {
                                    if (objectType.includes('::shadowvote::VotePool') || objectType.includes('::votepool_wo_al::VotePool_WOAl'))
                                        voteId = item.reference.objectId;
                                }
                            }
                        }
                    }

                    console.log('创建的对象ID:', createdObjects);

                    // 跳转到成功页面并传递数据
                    if (voteId) {
                        const queryParams = new URLSearchParams({
                            voteId,
                            digest
                        }).toString();

                        router.push(`/votes/create/success?${queryParams}`);
                    } else {
                        router.push("/votes/create/success");
                    }
                },
                onError: (error) => {
                    console.error('交易失败:', error);
                    alert('交易失败: ' + error.message);
                    setIsProcessing(false);
                    setProcessingStatus("");
                },
            });
        } catch (error) {
            console.error('创建投票失败:', error);
            alert('创建投票失败: ' + (error as Error).message);
            setIsProcessing(false);
            setProcessingStatus("");
        }
    }

    // 渲染步骤标签
    const renderStepTabs = () => {
        const steps: FormStep[] = ["basicInfo", "options", "time", "permissions", "confirmation"];
        return (
            <div className="flex border-b mb-6">
                {steps.map((step) => (
                    <div
                        key={step}
                        className={`px-4 py-2 cursor-pointer text-sm font-medium border-b-2 ${currentStep === step
                            ? "text-primary border-primary"
                            : "text-gray-500 border-transparent"
                            }`}
                        onClick={() => setCurrentStep(step)}
                    >
                        {STEPS[step].title}
                    </div>
                ))}
            </div>
        );
    };

    // 渲染基本信息步骤
    const renderBasicInfoStep = () => (
        <>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">投票标题</Label>
                    <Input
                        id="title"
                        placeholder="输入投票标题"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">投票描述</Label>
                    <Textarea
                        id="description"
                        placeholder="详细说明投票的目的和背景"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[100px]"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                >
                    <i className="fas fa-times mr-2"></i> 取消
                </Button>
                <Button onClick={goToNextStep}>
                    <i className="fas fa-arrow-right mr-2"></i> 下一步
                </Button>
            </div>
        </>
    );

    // 渲染选项设置步骤
    const renderOptionsStep = () => (
        <>
            <div className="space-y-4">
                <Label>投票选项列表</Label>
                {formData.options.map((option, index) => (
                    <div key={option.id} className="flex space-x-2 mb-2">
                        <Input
                            placeholder={`选项 ${index + 1}`}
                            value={option.text}
                            onChange={(e) => updateOptionText(option.id, e.target.value)}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(option.id)}
                            disabled={formData.options.length <= 2}
                        >
                            <i className="fas fa-trash"></i>
                        </Button>
                    </div>
                ))}

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={addOption}
                >
                    <i className="fas fa-plus mr-2"></i> 添加选项
                </Button>

                <p className="text-xs text-gray-500">至少需要添加两个选项</p>
            </div>

            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={goToPrevStep}
                >
                    <i className="fas fa-arrow-left mr-2"></i> 上一步
                </Button>
                <Button onClick={goToNextStep}>
                    <i className="fas fa-arrow-right mr-2"></i> 下一步
                </Button>
            </div>
        </>
    );

    // 渲染时间设置步骤
    const renderTimeStep = () => (
        <>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="startTime">开始时间</Label>
                    <Input
                        type="datetime-local"
                        id="startTime"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="endTime">结束时间</Label>
                    <Input
                        type="datetime-local"
                        id="endTime"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={goToPrevStep}
                >
                    <i className="fas fa-arrow-left mr-2"></i> 上一步
                </Button>
                <Button onClick={goToNextStep}>
                    <i className="fas fa-arrow-right mr-2"></i> 下一步
                </Button>
            </div>
        </>
    );

    // 渲染权限设置步骤
    const renderPermissionsStep = () => (
        <>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>参与权限</Label>
                    <RadioGroup
                        value={formData.permissionType}
                        onValueChange={(value) =>
                            setFormData({ ...formData, permissionType: value as "all" | "specific" })
                        }
                    >
                        <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="all" id="all-users" />
                            <Label htmlFor="all-users">所有人可参与</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific" id="specific-users" />
                            <Label htmlFor="specific-users">指定地址可参与</Label>
                        </div>
                    </RadioGroup>
                </div>

                {formData.permissionType === "specific" && (
                    <div className="space-y-4 mt-4">
                        <AllowlistManager
                            selectedAllowlistId={formData.selectedAllowlistId}
                            onAllowlistSelect={updateSelectedAllowlistId}
                            onAllowlistInfoChange={updateSelectedAllowlistInfo}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={goToPrevStep}
                >
                    <i className="fas fa-arrow-left mr-2"></i> 上一步
                </Button>
                <Button onClick={goToNextStep}>
                    <i className="fas fa-arrow-right mr-2"></i> 下一步
                </Button>
            </div>
        </>
    );

    // 渲染确认步骤中的参与权限信息
    const renderPermissionInfo = () => {
        if (formData.permissionType === "all") {
            return "所有人可参与";
        } else if (formData.selectedAllowlistInfo) {
            return `指定地址可参与 ：来自白名单 ${formData.selectedAllowlistInfo.name}的(${formData.selectedAllowlistInfo.addressCount} 个地址)`;
        } else {
            return "指定地址可参与";
        }
    }

    // 渲染确认步骤
    const renderConfirmationStep = () => {
        // 格式化日期时间
        const formatDateTime = (dateTimeStr: string) => {
            if (!dateTimeStr) return "";
            const date = new Date(dateTimeStr);
            return date.toLocaleString("zh-CN");
        };

        return (
            <>
                <div className="space-y-4">
                    <Card className="bg-gray-50">
                        <CardHeader>
                            <CardTitle className="text-base">{formData.title}</CardTitle>
                            <CardDescription>{formData.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="font-medium text-sm mb-2">投票选项:</div>
                                <ul className="list-none pl-2">
                                    {formData.options.map((option) => (
                                        <li key={option.id} className="text-sm mb-1">• {option.text || "空选项"}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <div className="font-medium text-sm mb-2">投票时间:</div>
                                <div className="text-sm">
                                    {formatDateTime(formData.startTime)} - {formatDateTime(formData.endTime)}
                                </div>
                            </div>

                            <div>
                                <div className="font-medium text-sm mb-2">参与权限:</div>
                                <div className="text-sm">
                                    {renderPermissionInfo()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50">
                        <CardContent className="pt-4">
                            <div className="flex">
                                <i className="fas fa-exclamation-circle text-amber-500 mr-3 mt-1"></i>
                                <div>
                                    <div className="font-medium text-sm mb-1">创建投票将消耗少量SUI代币作为燃料费</div>
                                    <div className="text-xs text-gray-500">预估费用: 0.01 SUI</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={goToPrevStep}
                        disabled={isProcessing}
                    >
                        <i className="fas fa-arrow-left mr-2"></i> 上一步
                    </Button>
                    <div className="flex flex-col items-end">
                        <Button
                            onClick={handleCreateVotePool}
                            disabled={isProcessing}
                            className="mb-2"
                        >
                            {isProcessing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i> 处理中...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check mr-2"></i> 确认创建
                                </>
                            )}
                        </Button>
                        {isProcessing && (
                            <div className="text-xs text-gray-500">{processingStatus}</div>
                        )}
                    </div>
                </div>
            </>
        );
    };

    // 根据当前步骤渲染内容
    const renderStepContent = () => {
        switch (currentStep) {
            case "basicInfo":
                return renderBasicInfoStep();
            case "options":
                return renderOptionsStep();
            case "time":
                return renderTimeStep();
            case "permissions":
                return renderPermissionsStep();
            case "confirmation":
                return renderConfirmationStep();
            default:
                return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="mr-4"
                    onClick={() => router.push("/")}
                >
                    <i className="fas fa-arrow-left"></i>
                </Button>
                <h1 className="text-xl font-medium">创建新投票</h1>
            </div>

            {renderStepTabs()}
            {renderStepContent()}
        </div>
    );
}
