/**
 * 零知识证明生成工具
 * 用于在浏览器环境中生成证明
 */

import { groth16 } from 'snarkjs';

/**
 * 生成能力证明
 * @param {number} userSbtLevel - 用户实际SBT等级 (初级=1, 中级=2, 高级=3)
 * @param {bigint} sbtId - 用户SBT的ID
 * @param {number} requiredLevel - 要求的最低等级
 * @param {bigint} challenge - 验证者提供的挑战值
 * @returns {Promise<Object>} - 包含证明和公共输入的对象
 */
export async function generateAbilityProof(userSbtLevel, sbtId, requiredLevel, challenge) {
  try {
    // 准备输入
    const input = {
      userSbtLevel: userSbtLevel,
      sbtId: sbtId.toString(),
      requiredLevel: requiredLevel,
      challenge: challenge.toString()
    };

    console.log('Generating proof with inputs:', input);

    // 加载电路的WASM和zkey文件
    // 注意：这些文件路径需要根据实际部署情况调整
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      '/circuits/ability_proof.wasm',
      '/circuits/ability_proof.zkey'
    );

    // 格式化输出
    const formattedProof = JSON.stringify(proof);
    const formattedPublicInputs = JSON.stringify(publicSignals);

    console.log('Proof generated successfully:', formattedProof.substring(0, 100) + '...');

    return {
      proof: formattedProof,
      publicInputs: formattedPublicInputs,
      requiredLevel: requiredLevel
    };
  } catch (error) {
    console.error('Error generating proof:', error);
    throw new Error('Failed to generate zero-knowledge proof: ' + error.message);
  }
}

/**
 * 在浏览器中验证零知识证明（用于本地测试）
 * @param {string} proofJson - 证明JSON字符串
 * @param {string} publicInputsJson - 公共输入JSON字符串
 * @param {string} vkJson - 验证密钥JSON字符串
 * @returns {Promise<boolean>} - 验证结果
 */
export async function verifyProofLocally(proofJson, publicInputsJson, vkJson) {
  try {
    const proof = JSON.parse(proofJson);
    const publicInputs = JSON.parse(publicInputsJson);
    const vk = JSON.parse(vkJson);

    // 使用snarkjs验证证明
    const isValid = await groth16.verify(vk, publicInputs, proof);

    console.log('Proof verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error verifying proof locally:', error);
    throw new Error('Failed to verify proof: ' + error.message);
  }
} 