import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getAllowlists, AllowlistWithCap } from "@/contracts/query";
import { createAllowlisTx, allowListAdd, allowListRemove, allowlistMultiAdd, allowListMultiRemove } from "@/contracts/transaction";
import { suiClient } from "@/contracts";
import { Transaction } from "@mysten/sui/transactions";

interface AllowlistManagerProps {
    selectedAllowlistId: string;
    onAllowlistSelect: (id: string) => void;
    onAllowlistInfoChange?: (info: { name: string, addressCount: number }) => void;
    useMockData?: boolean; // 是否使用模拟数据
}

export function AllowlistManager({
    selectedAllowlistId,
    onAllowlistSelect,
    onAllowlistInfoChange
}: AllowlistManagerProps) {
    const [allowlists, setAllowlists] = useState<AllowlistWithCap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingAllowlist, setEditingAllowlist] = useState<AllowlistWithCap | null>(null);
    const [newAllowlistName, setNewAllowlistName] = useState("");
    const [addresses, setAddresses] = useState<string[]>([]);
    const [newAddress, setNewAddress] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 用于跟踪上一次发送的白名单信息，防止无限循环
    const lastSentInfoRef = useRef<{ name: string, addressCount: number } | null>(null);

    const currentAccount = useCurrentAccount();

    // 使用 dapp-kit 的 hook 执行交易
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

    // 加载 allowlist 数据
    const loadAllowlists = useCallback(async () => {
        try {
            setLoading(true);
            // 否则从链上获取数据
            if (!currentAccount?.address) {
                setLoading(false);
                return;
            }

            const lists = await getAllowlists(currentAccount.address);
            setAllowlists(lists);

            // 如果有 allowlist 且未选择，默认选择第一个
            if (lists.length > 0 && !selectedAllowlistId) {
                onAllowlistSelect(lists[0].allowlist.id.id);
            }
        } catch (err) {
            console.error("Failed to load allowlists:", err);
            setError("加载白名单失败，请稍后再试。");
        } finally {
            setLoading(false);
        }
    }, [currentAccount, selectedAllowlistId, onAllowlistSelect]);

    // 更新选中的白名单信息
    useEffect(() => {
        if (!selectedAllowlistId || !onAllowlistInfoChange) return;

        const selectedAllowlist = allowlists.find(a => a.allowlist.id.id === selectedAllowlistId);
        if (!selectedAllowlist) return;

        const newInfo = {
            name: selectedAllowlist.allowlist.name,
            addressCount: selectedAllowlist.allowlist.list.length
        };

        // 比较当前信息和上次发送的信息是否相同
        const lastInfo = lastSentInfoRef.current;
        const isInfoChanged = !lastInfo ||
            lastInfo.name !== newInfo.name ||
            lastInfo.addressCount !== newInfo.addressCount;

        // 只有当信息变化时才更新
        if (isInfoChanged) {
            lastSentInfoRef.current = newInfo;
            onAllowlistInfoChange(newInfo);
        }
    }, [selectedAllowlistId, allowlists]);

    // 处理白名单选择变化时，先重置上次发送的信息
    const handleAllowlistSelect = useCallback((id: string) => {
        lastSentInfoRef.current = null; // 清除上次的信息记录
        onAllowlistSelect(id);
    }, [onAllowlistSelect]);

    // 初始加载
    useEffect(() => {
        loadAllowlists();
    }, [loadAllowlists]);

    // 打开编辑对话框
    const handleEditClick = (allowlist: AllowlistWithCap) => {
        setEditingAllowlist(allowlist);
        setAddresses([...allowlist.allowlist.list]);
        setIsEditDialogOpen(true);
    };

    // 添加地址
    const addAddress = () => {
        if (newAddress.trim() && !addresses.includes(newAddress.trim())) {
            setAddresses([...addresses, newAddress.trim()]);
            setNewAddress("");
        }
    };

    // 删除地址
    const removeAddress = (index: number) => {
        setAddresses(addresses.filter((_, i) => i !== index));
    };

    // 执行交易并刷新数据
    const executeTransaction = async (transaction: Transaction, successMessage: string) => {
        try {
            setIsProcessing(true);

            await signAndExecute({
                transaction: transaction.serialize(),
            }, {
                onSuccess: async (result) => {
                    console.log('交易成功:', result);
                    alert(successMessage);

                    // 重新加载数据
                    if (currentAccount?.address) {
                        const lists = await getAllowlists(currentAccount.address);
                        setAllowlists(lists);
                    }
                    setIsProcessing(false);
                },
                onError: (error) => {
                    console.error('交易失败:', error);
                    alert('交易失败: ' + error.message);
                    setIsProcessing(false);
                },
            });
        } catch (error) {
            console.error('准备交易失败:', error);
            alert('准备交易失败: ' + (error as Error).message);
            setIsProcessing(false);
        }
    };

    // 保存编辑
    const saveEdits = async () => {

        if (!editingAllowlist) return;

        try {
            setIsProcessing(true);

            // 获取当前白名单的地址列表
            const currentAddresses = editingAllowlist.allowlist.list;
            const newAddresses = addresses;

            // 找出需要添加的地址
            const addressesToAdd = newAddresses.filter(addr => !currentAddresses.includes(addr));

            // 找出需要删除的地址
            const addressesToRemove = currentAddresses.filter(addr => !newAddresses.includes(addr));

            // 如果同时添加和删除了相同的地址，从两个列表中都移除它
            const finalAddressesToAdd = addressesToAdd.filter(addr => !addressesToRemove.includes(addr));
            const finalAddressesToRemove = addressesToRemove.filter(addr => !addressesToAdd.includes(addr));

            if (finalAddressesToAdd.length > 0 || finalAddressesToRemove.length > 0) {
                let tx = new Transaction();

                if (finalAddressesToAdd.length > 1) {
                    tx = await allowlistMultiAdd(
                        tx,
                        editingAllowlist.allowlist.id.id,
                        editingAllowlist.capId,
                        finalAddressesToAdd
                    );
                } else if (finalAddressesToAdd.length == 1) {
                    tx = await allowListAdd(
                        tx,
                        editingAllowlist.allowlist.id.id,
                        editingAllowlist.capId,
                        finalAddressesToAdd[0]
                    );
                }

                if (finalAddressesToRemove.length > 1) {
                    tx = await allowListMultiRemove(
                        tx,
                        editingAllowlist.allowlist.id.id,
                        editingAllowlist.capId,
                        finalAddressesToRemove
                    );
                } else if (finalAddressesToRemove.length == 1) {
                    tx = await allowListRemove(
                        tx,
                        editingAllowlist.allowlist.id.id,
                        editingAllowlist.capId,
                        finalAddressesToRemove[0]
                    );
                }

                await executeTransaction(tx, `白名单更新成功`);
            }

            // 显示新增和删除的地址列表
            let message = "";
            if (finalAddressesToAdd.length > 0) {
                message += `新增地址(${finalAddressesToAdd.length}个):\n${finalAddressesToAdd.join('\n')}\n\n`;
            }
            if (finalAddressesToRemove.length > 0) {
                message += `删除地址(${finalAddressesToRemove.length}个):\n${finalAddressesToRemove.join('\n')}`;
            }
            if (message) {
                console.log(message);
            }


            setIsProcessing(false);
        } catch (error) {
            console.error("保存编辑到链上失败:", error);
            alert("保存编辑到链上失败: " + (error as Error).message);
            setIsProcessing(false);
        }


        setIsEditDialogOpen(false);
    };

    // 创建新的 allowlist
    const createNewAllowlist = async () => {

        // 实现创建新的 allowlist 的区块链交互逻辑
        try {
            setIsProcessing(true);

            // 创建白名单
            const createTx = await createAllowlisTx(newAllowlistName);

            await signAndExecute({
                transaction: createTx.serialize(),
            }, {
                onSuccess: async (result) => {
                    console.log('创建白名单成功:', result);

                    try {
                        const allowlistObject = result.effects?.created?.find(
                            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
                        );
                        const newAllowlistId = allowlistObject?.reference?.objectId ?? '';

                        if (currentAccount?.address) {
                            const lists = await getAllowlists(currentAccount.address);
                            setAllowlists(lists);

                            // 选择新创建的白名单
                            const newList = lists.find(item => item.allowlist.id.id === newAllowlistId);
                            if (newList) {
                                onAllowlistSelect(newAllowlistId);
                            }
                        }

                    } catch (error) {
                        console.error("解析交易结果失败:", error);
                    }

                    alert('成功创建白名单!');
                    setIsProcessing(false);
                },
                onError: (error) => {
                    console.error('创建白名单失败:', error);
                    alert('创建白名单失败: ' + error.message);
                    setIsProcessing(false);
                },
            });
        } catch (error) {
            console.error("创建新白名单到链上失败:", error);
            alert("创建新白名单到链上失败: " + (error as Error).message);
            setIsProcessing(false);
        }


        setIsNewDialogOpen(false);
        setNewAllowlistName("");
        setAddresses([]);
    };

    // 打开创建新 allowlist 对话框
    const openNewAllowlistDialog = () => {
        setAddresses([]);
        setNewAllowlistName("");
        setIsNewDialogOpen(true);
    };

    if (loading) return <div className="text-center">加载白名单中...</div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;

    return (
        <div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>选择白名单</Label>
                    <Select
                        value={selectedAllowlistId}
                        onValueChange={handleAllowlistSelect}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="选择一个白名单" />
                        </SelectTrigger>
                        <SelectContent>
                            {allowlists.map((item) => (
                                <SelectItem key={item.allowlist.id.id} value={item.allowlist.id.id}>
                                    {item.allowlist.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedAllowlistId && (
                    <Card className="mt-4">
                        <CardHeader className="py-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base">
                                    白名单详情
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const selected = allowlists.find(a => a.allowlist.id.id === selectedAllowlistId);
                                        if (selected) handleEditClick(selected);
                                    }}
                                >
                                    <i className="fas fa-edit mr-2"></i> 编辑
                                </Button>
                            </div>
                            <CardDescription>
                                {allowlists.find(a => a.allowlist.id.id === selectedAllowlistId)?.allowlist.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>地址</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allowlists
                                            .find(a => a.allowlist.id.id === selectedAllowlistId)
                                            ?.allowlist.list.map((address, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-mono text-xs truncate max-w-xs">
                                                        {address}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={openNewAllowlistDialog}
                    disabled={isProcessing}
                >
                    <i className="fas fa-plus mr-2"></i> 创建新白名单
                </Button>
            </div>

            {/* 编辑白名单对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>编辑白名单</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>白名单名称</Label>
                            <Input
                                value={editingAllowlist?.allowlist.name || ""}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>地址列表</Label>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {addresses.map((address, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <Input
                                            value={address}
                                            disabled
                                            className="flex-1 font-mono text-xs"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeAddress(index)}
                                            disabled={isProcessing}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex space-x-2 mt-2">
                                <Input
                                    placeholder="输入新地址"
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    className="flex-1"
                                    disabled={isProcessing}
                                />
                                <Button onClick={addAddress} disabled={isProcessing}>添加</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isProcessing}>
                            取消
                        </Button>
                        <Button onClick={saveEdits} disabled={isProcessing}>
                            {isProcessing ? '处理中...' : '保存'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 创建新白名单对话框 */}
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>创建新白名单</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>白名单名称</Label>
                            <Input
                                placeholder="输入白名单名称"
                                value={newAllowlistName}
                                onChange={(e) => setNewAllowlistName(e.target.value)}
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>地址列表</Label>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {addresses.map((address, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <Input
                                            value={address}
                                            disabled
                                            className="flex-1 font-mono text-xs"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeAddress(index)}
                                            disabled={isProcessing}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex space-x-2 mt-2">
                                <Input
                                    placeholder="输入新地址"
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    className="flex-1"
                                    disabled={isProcessing}
                                />
                                <Button onClick={addAddress} disabled={isProcessing}>添加</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewDialogOpen(false)} disabled={isProcessing}>
                            取消
                        </Button>
                        <Button onClick={createNewAllowlist} disabled={isProcessing}>
                            {isProcessing ? '处理中...' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 