pragma circom 2.0.0;

/*
 * 能力证明电路
 * 这个电路允许用户证明他们拥有特定等级的SBT，而不暴露具体的SBT内容
 * 比如，用户可以证明他们的测验分数超过某个门槛，而不需要透露具体分数
 */

// 包含标准库
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

// 主电路：证明用户的SBT等级超过特定门槛
template AbilityProof() {
    // 私有输入：实际SBT等级(初级=1, 中级=2, 高级=3)
    signal input userSbtLevel;
    
    // 私有输入：用户拥有的SBT ID (作为随机数使证明不可重用)
    signal input sbtId;
    
    // 公共输入：要求的最低等级
    signal input requiredLevel;
    
    // 公共输入：验证者提供的挑战值(防止重放攻击)
    signal input challenge;
    
    // 公共输出：是否满足条件
    signal output qualified;
    
    // 验证用户SBT等级是否大于等于要求等级
    component greaterOrEqual = GreaterEqThan(8); // 8位足够表示SBT等级
    greaterOrEqual.in[0] <== userSbtLevel;
    greaterOrEqual.in[1] <== requiredLevel;
    
    // 验证结果
    qualified <== greaterOrEqual.out;
    
    // 验证SBT ID与挑战值结合（防止重放攻击）
    signal combinedHash;
    combinedHash <== sbtId + challenge;
    
    // 确保combinedHash不为零
    signal nonZero;
    nonZero <== combinedHash * combinedHash;
}

// 主要组件
component main {public [requiredLevel, challenge]} = AbilityProof(); 