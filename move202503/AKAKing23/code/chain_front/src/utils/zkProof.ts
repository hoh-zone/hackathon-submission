/**
 * 零知识证明生成工具
 * 用于在浏览器环境中生成证明
 */

// @ts-expect-error snarkjs没有类型定义
import { groth16 } from "snarkjs";
import { TESTNET_ZK_VERIFIER_ID } from "@/utils/constants";
/**
 * 证明结果类型
 */
export interface ProofResult {
  proof: string;
  publicInputs: string;
  requiredLevel: number;
}

/**
 * 生成能力证明
 * @param {number} userSbtLevel - 用户实际SBT等级 (初级=1, 中级=2, 高级=3)
 * @param {bigint} sbtId - 用户SBT的ID
 * @param {number} requiredLevel - 要求的最低等级
 * @param {bigint} challenge - 验证者提供的挑战值
 * @returns {Promise<ProofResult>} - 包含证明和公共输入的对象
 */
export async function generateAbilityProof(
  userSbtLevel: number,
  sbtId: bigint,
  requiredLevel: number,
  challenge: bigint
): Promise<ProofResult> {
  try {
    // 准备输入
    const input = {
      userSbtLevel: userSbtLevel,
      sbtId: sbtId.toString(),
      requiredLevel: requiredLevel,
      challenge: challenge.toString(),
    };

    console.log("Generating proof with inputs:", input);

    // 加载电路的WASM和zkey文件
    // 注意：这些文件路径需要根据实际部署情况调整
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      "/circuits/ability.wasm",
      "/circuits/ability_proof.zkey"
    );

    // 格式化输出
    const formattedProof = JSON.stringify(proof);
    const formattedPublicInputs = JSON.stringify(publicSignals);

    console.log(
      "Proof generated successfully:",
      formattedProof.substring(0, 100) + "..."
    );

    return {
      proof: formattedProof,
      publicInputs: formattedPublicInputs,
      requiredLevel: requiredLevel,
    };
  } catch (error: unknown) {
    console.error("Error generating proof:", error);
    if (error instanceof Error) {
      throw new Error(
        "Failed to generate zero-knowledge proof: " + error.message
      );
    } else {
      throw new Error("Failed to generate zero-knowledge proof: Unknown error");
    }
  }
}

/**
 * 在浏览器中验证零知识证明（用于本地测试）
 * @param {string} proofJson - 证明JSON字符串
 * @param {string} publicInputsJson - 公共输入JSON字符串
 * @param {string} vkJson - 验证密钥JSON字符串
 * @returns {Promise<boolean>} - 验证结果
 */
export async function verifyProofLocally(
  proofJson: string,
  publicInputsJson: string,
  vkJson: string
): Promise<boolean> {
  try {
    const proof = JSON.parse(proofJson);
    const publicInputs = JSON.parse(publicInputsJson);
    const vk = JSON.parse(vkJson);

    // 使用snarkjs验证证明
    const isValid = await groth16.verify(vk, publicInputs, proof);

    console.log("Proof verification result:", isValid);
    return isValid;
  } catch (error: unknown) {
    console.error("Error verifying proof locally:", error);
    if (error instanceof Error) {
      throw new Error("Failed to verify proof: " + error.message);
    } else {
      throw new Error("Failed to verify proof: Unknown error");
    }
  }
}

/**
 * 默认的验证器对象ID
 * 实际使用时应该从环境配置或API获取
 */
export const DEFAULT_VERIFIER_ID = TESTNET_ZK_VERIFIER_ID || "";

/**
 * 获取验证器对象ID
 * 在实际应用中，这个函数应该从链上或API获取验证器对象ID
 * @returns {Promise<string>} 验证器对象ID
 */
export async function getVerifierId(): Promise<string> {
  // 如果有环境变量，则使用环境变量
  if (DEFAULT_VERIFIER_ID) {
    return DEFAULT_VERIFIER_ID;
  }

  return "";
}

/**
 * 获取验证密钥
 * 从公共目录获取验证密钥JSON内容
 * @returns {Promise<string>} 验证密钥JSON字符串
 */
export async function getVerificationKey(): Promise<string> {
  try {
    const response = await fetch("/circuits/verification_key.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("获取验证密钥失败:", error);
    if (error instanceof Error) {
      throw new Error("获取验证密钥失败: " + error.message);
    } else {
      throw new Error("获取验证密钥失败: 未知错误");
    }
  }
}
