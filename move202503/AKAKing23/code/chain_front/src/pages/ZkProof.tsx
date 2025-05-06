// @ts-nocheck
import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  generateAbilityProof,
  getVerifierId,
  getVerificationKey,
} from "../utils/zkProof";
import {
  createVerifyZkProofParams,
  createAddVerificationKeyParams,
} from "../api/sui";
import { Loader2 } from "lucide-react";
import {
  // TESTNET_ZK_VERIFIER_ID,
  TESTNET_COUNTER_PACKAGE_ID,
} from "@/utils/constants";

// 样式定义
const styles = {
  container: {
    maxWidth: "850px",
    margin: "0 auto",
    padding: "2rem",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    color: "#fff",
    position: "relative" as const,
    zIndex: 999,
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#fff",
    textAlign: "center" as const,
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    color: "#f0f0f0",
  },
  description: {
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    color: "#ddd",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#eee",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "8px",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    marginBottom: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  verifyButton: {
    backgroundColor: "#10b981",
  },
  card: {
    padding: "1.5rem",
    borderRadius: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginBottom: "1.5rem",
  },
  infoText: {
    color: "#bbb",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  proofContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: "1rem",
    borderRadius: "6px",
    overflowX: "auto" as const,
    maxHeight: "200px",
    fontSize: "0.8rem",
  },
  statusSuccess: {
    color: "#10b981",
    fontWeight: "bold",
  },
  statusPending: {
    color: "#f59e0b",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: "6px",
  },
  tableHeader: {
    padding: "0.75rem",
    textAlign: "left" as const,
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
  },
  tableCell: {
    padding: "0.75rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#ddd",
  },
};

// 验证记录类型定义
interface VerificationRecord {
  user: string;
  circuitName: string;
  isVerified: boolean;
  requiredLevel: number;
  timestamp: string;
  transactionDigest: string;
}

const ZkProof: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [userSbtLevel, setUserSbtLevel] = useState<number>(1); // 默认为中级
  const [requiredLevel, setRequiredLevel] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isAddingKey, setIsAddingKey] = useState<boolean>(false);
  const [proof, setProof] = useState<string>("");
  const [publicInputs, setPublicInputs] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [verificationRecords, setVerificationRecords] = useState<
    VerificationRecord[]
  >([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [sbtId, setSbtId] = useState<bigint>(BigInt("0")); // 初始化为0
  const [isLoadingSbt, setIsLoadingSbt] = useState<boolean>(false);

  // 获取用户拥有的SBT
  const fetchUserSbt = async () => {
    if (!currentAccount || !suiClient) return;

    setIsLoadingSbt(true);
    try {
      // 查询用户拥有的对象，筛选出SBT类型的对象
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${TESTNET_COUNTER_PACKAGE_ID}::sbt::SoulboundToken`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (ownedObjects.data && ownedObjects.data.length > 0) {
        // 获取第一个SBT对象的ID
        const userSbtId = ownedObjects.data[0].data?.objectId;
        if (userSbtId) {
          console.log("获取到用户SBT ID:", userSbtId);
          // 将对象ID转换为BigInt（移除0x前缀并转为十进制BigInt）
          const sbtIdBigInt = BigInt(parseInt(userSbtId.replace("0x", ""), 16));
          setSbtId(sbtIdBigInt);
          return;
        }
      }

      console.log("用户没有SBT，使用模拟ID");
      // 如果没有找到SBT，使用模拟ID
      setSbtId(BigInt("123456789"));
    } catch (error) {
      console.error("获取用户SBT失败:", error);
      // 出错时使用模拟ID
      setSbtId(BigInt("123456789"));
    } finally {
      setIsLoadingSbt(false);
    }
  };

  // 组件挂载时获取用户SBT
  useEffect(() => {
    if (currentAccount) {
      fetchUserSbt();
    }
  }, [currentAccount]);

  // 模拟从验证者获取挑战值
  const getChallenge = () => {
    return BigInt(Math.floor(Math.random() * 1000000000));
  };

  // 获取验证记录
  const fetchVerificationRecords = async () => {
    if (!suiClient) return;

    setIsLoadingRecords(true);
    try {
      // 查询VerificationResult事件
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${TESTNET_COUNTER_PACKAGE_ID}::zk_verifier::VerificationResult`,
        },
        limit: 50, // 获取最近的50条记录
      });

      // 处理事件数据
      const records: VerificationRecord[] = events.data.map((event) => {
        const fields = event.parsedJson as {
          user: string;
          circuit_name: string;
          is_verified: boolean;
          required_level: number;
        };

        return {
          user: fields.user,
          circuitName: fields.circuit_name,
          isVerified: fields.is_verified,
          requiredLevel: fields.required_level,
          timestamp: new Date(Number(event.timestampMs)).toLocaleString(),
          transactionDigest: event.id.txDigest,
        };
      });
      // records.splice(0, 2);
      setVerificationRecords(records);
    } catch (error) {
      console.error("获取验证记录失败:", error);
      alert("获取验证记录失败: " + (error as Error).message);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // 当管理员面板显示时获取验证记录
  useEffect(() => {
    if (showAdminPanel) {
      fetchVerificationRecords();
    }
  }, [showAdminPanel]);

  const handleGenerateProof = async () => {
    if (!currentAccount) {
      alert(`请先连接钱包！`);
      return;
    }

    setIsGenerating(true);
    try {
      const challenge = getChallenge();
      const result = await generateAbilityProof(
        userSbtLevel,
        sbtId, // 使用从链上查询到的实际SBT ID
        requiredLevel,
        challenge
      );
      console.log(result, "result---");
      setProof(result.proof);
      setPublicInputs(result.publicInputs);
      setTimeout(() => {
        alert(`零知识证明生成成功！`);
        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      console.error("生成证明失败:", error);
      alert("生成证明失败: " + (error as Error).message);
      setIsGenerating(false);
    } finally {
      // setIsGenerating(false);
    }
    console.log(isGenerating, "isGenerating---");
  };

  const handleVerifyProof = async () => {
    if (!proof || !publicInputs || !currentAccount) {
      alert(`请先生成证明或连接钱包！`);
      return;
    }

    setIsVerifying(true);

    try {
      // 获取验证器对象ID
      const verifierId = await getVerifierId();
      // const circuitName = "ability" + new Date(); // 电路名称  后续可改为企业/社区名称
      const circuitName = "MoveAbilityTest"; // 电路名称  后续可改为企业/社区名称

      // 创建并执行交易
      const txParams = createVerifyZkProofParams(
        verifierId,
        circuitName,
        proof,
        publicInputs,
        requiredLevel
      );

      signAndExecute(txParams, {
        onSuccess: (result) => {
          console.log("交易成功:", result);
          setVerificationResult(true);
          alert("证明验证成功！");
          setIsVerifying(false);
          // 如果管理员面板打开，刷新验证记录
          if (showAdminPanel) {
            fetchVerificationRecords();
          }
        },
        onError: (error) => {
          console.error("交易失败:", error);
          setVerificationResult(false);
          alert("证明验证失败: " + error.message);
          setIsVerifying(false);
        },
      });
    } catch (error) {
      console.error("验证证明失败:", error);
      alert("验证证明失败: " + (error as Error).message);
      setVerificationResult(false);
      setIsVerifying(false);
    }
  };

  // 处理添加验证密钥
  const handleAddVerificationKey = async () => {
    if (!currentAccount) {
      alert(`请先连接钱包！`);
      return;
    }

    setIsAddingKey(true);

    try {
      // 获取验证器ID
      const verifierId = await getVerifierId();
      // const circuitName = "ability" + new Date().getTime(); // 电路名称
      const circuitName = "MoveAbilityTest"; // 电路名称

      // 获取验证密钥
      const verificationKey = await getVerificationKey();

      // 创建添加验证密钥的交易
      const txParams = createAddVerificationKeyParams(
        verifierId,
        circuitName,
        verificationKey
      );

      // 执行交易
      signAndExecute(txParams, {
        onSuccess: (result) => {
          console.log("添加验证密钥成功:", result);
          alert("添加验证密钥成功！");
          setIsAddingKey(false);
        },
        onError: (error) => {
          console.error("添加验证密钥失败:", error);
          alert("添加验证密钥失败: " + error.message);
          setIsAddingKey(false);
        },
      });
    } catch (error) {
      console.error("添加验证密钥失败:", error);
      alert("添加验证密钥失败: " + (error as Error).message);
      setIsAddingKey(false);
    }
  };

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return (
      address.substring(0, 6) + "..." + address.substring(address.length - 4)
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>企业、社区认证</h1>
      {/* 管理员面板切换按钮 */}
      {currentAccount && (
        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
          <button
            style={{
              ...styles.button,
              backgroundColor: "#6b7280",
              padding: "0.5rem 1rem",
            }}
            onClick={() => setShowAdminPanel(!showAdminPanel)}
          >
            {showAdminPanel ? "隐藏管理员面板" : "显示管理员面板"}
          </button>
        </div>
      )}

      {/* 管理员面板 */}
      {showAdminPanel && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>管理员面板</h2>
          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <p style={styles.description}>
                管理员功能：查看用户认证记录和添加验证密钥
              </p>
              <button
                style={styles.button}
                onClick={fetchVerificationRecords}
                disabled={isLoadingRecords}
              >
                {isLoadingRecords ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "刷新记录"
                )}
              </button>
            </div>
            <button
              style={{ ...styles.button, marginBottom: "1.5rem" }}
              onClick={handleAddVerificationKey}
              disabled={isAddingKey}
            >
              {isAddingKey ? (
                <Loader2 className="animate-spin" />
              ) : (
                "添加验证密钥"
              )}
            </button>

            <h3 style={styles.sectionTitle}>用户认证记录</h3>
            {isLoadingRecords ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Loader2 className="animate-spin" size={24} />
                <p style={{ marginTop: "1rem" }}>加载记录中...</p>
              </div>
            ) : verificationRecords.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>用户地址</th>
                      <th style={styles.tableHeader}>电路名称</th>
                      <th style={styles.tableHeader}>验证结果</th>
                      <th style={styles.tableHeader}>要求等级</th>
                      <th style={styles.tableHeader}>时间</th>
                      <th style={styles.tableHeader}>交易ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationRecords.map((record, index) => (
                      <tr key={index}>
                        <td style={styles.tableCell}>
                          {formatAddress(record.user)}
                        </td>
                        <td style={styles.tableCell}>{record.circuitName}</td>
                        <td
                          style={{
                            ...styles.tableCell,
                            color: record.isVerified ? "#10b981" : "#ef4444",
                          }}
                        >
                          {record.isVerified ? "验证成功" : "验证失败"}
                        </td>
                        <td style={styles.tableCell}>
                          {record.requiredLevel == 1
                            ? "初级"
                            : record.requiredLevel == 2
                            ? "中级"
                            : "高级"}
                        </td>
                        <td style={styles.tableCell}>{record.timestamp}</td>
                        <td style={styles.tableCell}>
                          <a
                            href={`https://suiscan.xyz/testnet/tx/${record.transactionDigest}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#3b82f6", textDecoration: "none" }}
                          >
                            {formatAddress(record.transactionDigest)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#ddd", textAlign: "center" }}>暂无认证记录</p>
            )}
          </div>
        </div>
      )}
      <div style={styles.section}>
        <p style={styles.description}>
          向企业证明你拥有特定等级的能力凭证，而不必透露你的实际SBT内容或精确分数。
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>能力证明</h2>
        <p style={styles.description}>
          选择你的实际SBT等级和你想要证明的能力等级，然后生成零知识证明。
        </p>

        <div style={styles.card}>
          {isLoadingSbt ? (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <Loader2 className="animate-spin" size={24} />
              <p style={{ marginTop: "0.5rem" }}>正在加载SBT信息...</p>
            </div>
          ) : (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  你的SBT等级（实际值，仅你自己可见）
                </label>
                <select
                  style={styles.select}
                  value={userSbtLevel}
                  onChange={(e) => setUserSbtLevel(Number(e.target.value))}
                >
                  <option value={1}>初级 SBT</option>
                  <option value={2}>中级 SBT</option>
                  <option value={3}>高级 SBT</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>需要证明的能力等级（将公开）</label>
                <select
                  style={styles.select}
                  value={requiredLevel}
                  onChange={(e) => setRequiredLevel(Number(e.target.value))}
                >
                  <option value={1}>初级</option>
                  <option value={2}>中级</option>
                  <option value={3}>高级</option>
                </select>
              </div>

              <button
                style={styles.button}
                onClick={handleGenerateProof}
                disabled={isGenerating || !currentAccount}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "生成证明"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {proof && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>验证证明</h2>
          <div style={styles.card}>
            <p style={styles.infoText}>生成的证明（简化显示）:</p>
            <div style={styles.proofContainer}>
              {proof.substring(0, 100)}...
            </div>

            <p style={styles.infoText}>公共输入:</p>
            <div style={styles.proofContainer}>{publicInputs}</div>

            <p style={styles.infoText}>
              验证状态:{" "}
              {verificationResult === null ? (
                <span style={styles.statusPending}>等待验证</span>
              ) : verificationResult ? (
                <span style={styles.statusSuccess}>验证成功</span>
              ) : (
                <span style={{ color: "red" }}>验证失败</span>
              )}
            </p>

            <button
              style={{ ...styles.button, ...styles.verifyButton }}
              onClick={handleVerifyProof}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin" /> : "验证证明"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZkProof;
