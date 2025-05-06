/**
 * 积分代币模块
 * 实现了ERC20风格的代币，用于答题系统的奖励和支付
 * 用户答对题目获得积分，查看解析需要消耗积分
 * 设计为去中心化模式，用户可以直接获得积分奖励
 */
module chain_contract::point_token;

use std::option;
use std::string;
use std::ascii;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;
use sui::object::{Self, UID};
use sui::package;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::url;

// 错误码定义
/// 代币余额不足错误
const EInsufficientBalance: u64 = 0;
/// 操作未被授权错误
const ENotAuthorized: u64 = 1;
/// 重复回答问题错误
const EAlreadyAnswered: u64 = 2;
/// 问题不存在错误
const EQuestionNotFound: u64 = 3;
/// 答案不正确错误
const EIncorrectAnswer: u64 = 4;

/// 定义积分代币类型 - 使用模块名称的全部大写版本作为one-time witness
public struct POINT_TOKEN has drop {}

/**
 * 问题结构体
 * 存储问题相关信息
 */
public struct Question has key, store {
    id: UID,
    /// 问题ID
    question_id: u64,
    /// 问题内容
    content: string::String,
    /// 正确答案
    correct_answer: string::String,
    /// 奖励积分数量
    reward_points: u64,
}

/**
 * 答题管理器结构
 * 控制积分代币的发行和管理，并存储问题与用户答题记录
 */
public struct QuizManager has key {
    id: UID,
    /// 积分代币的铸币权，用于创建新代币
    treasury_cap: TreasuryCap<POINT_TOKEN>,
    /// 管理员地址，只有管理员可以添加问题
    admin: address,
    /// 存储用户已答题记录，防止重复奖励
    /// 格式: (用户地址, 问题ID) => 是否已回答
    user_answers: Table<address, Table<u64, bool>>,
    /// 下一个问题ID
    next_question_id: u64,
}

/**
 * 答案解析结构
 * 存储特定问题的解析内容和所需的查看费用
 */
public struct SolutionContent has key, store {
    id: UID,
    /// 关联的问题ID
    question_id: u64,
    /// 解析内容
    content: string::String,
    /// 查看解析所需的代币数量
    token_cost: u64,
}

// 事件定义
/**
 * 答题完成事件
 * 当用户完成答题时触发，记录答题结果
 */
public struct QuizCompleted has copy, drop {
    /// 用户地址
    user: address,
    /// 问题ID
    question_id: u64,
    /// 是否回答正确
    is_correct: bool,
    /// 获得的积分（如果回答正确）
    points_earned: u64,
}

/**
 * 查看解析事件
 * 当用户查看题目解析时触发
 */
public struct SolutionViewed has copy, drop {
    /// 用户地址
    user: address,
    /// 问题ID
    question_id: u64,
    /// 消耗的代币数量
    tokens_spent: u64,
}

/**
 * 问题添加事件
 * 当管理员添加新问题时触发
 */
public struct QuestionAdded has copy, drop {
    /// 问题ID
    question_id: u64,
    /// 奖励积分
    reward_points: u64,
}

/**
 * 模块初始化函数，自动调用
 * 当模块首次发布时由框架自动调用
 */
fun init(witness: POINT_TOKEN, ctx: &mut TxContext) {
    // 使用one-time witness创建代币
    let (treasury_cap, metadata) = coin::create_currency<POINT_TOKEN>(
        witness,
        9, // 小数位数
        b"POINT", // 符号
        b"Quiz Points", // 名称
        b"Points earned from answering questions correctly", // 描述
        option::some(url::new_unsafe(std::ascii::string(b"https://learnchainx.netlify.app/logo.png"))), // 图标URL
        ctx,
    );

    // 转移元数据给发布者
    transfer::public_transfer(metadata, tx_context::sender(ctx));

    // 创建Quiz管理器实例
    let quiz_manager = QuizManager {
        id: object::new(ctx),
        treasury_cap,
        admin: tx_context::sender(ctx),
        user_answers: table::new(ctx),
        next_question_id: 0,
    };

    // 将管理器共享为全局对象，使任何人都能访问和使用
    transfer::share_object(quiz_manager);
}

/**
 * 添加新问题
 * 创建并共享新的问题对象
 * @param manager - 管理器实例
 * @param content - 问题内容
 * @param correct_answer - 正确答案
 * @param reward_points - 答对奖励的积分
 * @param solution_content - 解析内容
 * @param token_cost - 查看解析所需积分
 * @param ctx - 交易上下文
 */
public entry fun add_question(
    manager: &mut QuizManager,
    content: string::String,
    correct_answer: string::String,
    reward_points: u64,
    solution_content: string::String,
    token_cost: u64,
    ctx: &mut TxContext,
) {
    // 获取并递增问题ID
    let question_id = manager.next_question_id;
    manager.next_question_id = question_id + 1;

    // 创建问题对象
    let question = Question {
        id: object::new(ctx),
        question_id,
        content,
        correct_answer,
        reward_points,
    };

    // 创建解析对象
    let solution = SolutionContent {
        id: object::new(ctx),
        question_id,
        content: solution_content,
        token_cost,
    };

    // 共享问题和解析对象，使其可被所有人访问
    transfer::share_object(question);
    transfer::share_object(solution);

    // 发出问题添加事件
    event::emit(QuestionAdded {
        question_id,
        reward_points,
    });
}

/**
 * 用户回答问题 - 简化版
 * 直接奖励用户积分，不验证答案（前端已验证）
 * @param manager - 管理器实例
 * @param question - 问题对象
 * @param user - 接收奖励的用户地址
 * @param ctx - 交易上下文
 */
public entry fun reward_correct_answer(
    manager: &mut QuizManager,
    question: &Question,
    user: address,
    ctx: &mut TxContext,
) {
    let question_id = question.question_id;

    // 检查用户是否已经回答过这个问题
    if (!table::contains(&manager.user_answers, user)) {
        table::add(&mut manager.user_answers, user, table::new(ctx));
    };

    let user_question_table = table::borrow_mut(&mut manager.user_answers, user);

    // 确保用户没有重复获取奖励
    assert!(!table::contains(user_question_table, question_id), EAlreadyAnswered);

    // 记录用户已回答这个问题
    table::add(user_question_table, question_id, true);

    // 铸造积分
    let points = question.reward_points;
    let points_coin = coin::mint<POINT_TOKEN>(&mut manager.treasury_cap, points, ctx);

    // 转移给用户
    transfer::public_transfer(points_coin, user);

    // 发出事件
    event::emit(QuizCompleted {
        user,
        question_id,
        is_correct: true,
        points_earned: points,
    });
}

/**
 * 用户回答问题（原始方法，保留但不推荐使用）
 * 验证答案并自动奖励积分
 * @param manager - 管理器实例
 * @param question - 问题对象
 * @param answer - 用户的答案
 * @param ctx - 交易上下文
 */
public entry fun answer_question(
    manager: &mut QuizManager,
    question: &Question,
    answer: string::String,
    ctx: &mut TxContext,
) {
    let user = tx_context::sender(ctx);
    let question_id = question.question_id;

    // 检查用户是否已经回答过这个问题
    if (!table::contains(&manager.user_answers, user)) {
        table::add(&mut manager.user_answers, user, table::new(ctx));
    };

    let user_question_table = table::borrow_mut(&mut manager.user_answers, user);

    assert!(!table::contains(user_question_table, question_id), EAlreadyAnswered);

    // 验证答案
    let is_correct = string::bytes(&question.correct_answer) == string::bytes(&answer);

    // 记录用户已回答这个问题
    table::add(user_question_table, question_id, true);

    // 如果答案正确，奖励积分
    if (is_correct) {
        // 铸造积分
        let points = question.reward_points;
        let points_coin = coin::mint<POINT_TOKEN>(&mut manager.treasury_cap, points, ctx);

        // 转移给用户
        transfer::public_transfer(points_coin, user);

        // 发出事件
        event::emit(QuizCompleted {
            user,
            question_id,
            is_correct: true,
            points_earned: points,
        });
    } else {
        // 答案错误，只记录事件
        event::emit(QuizCompleted {
            user,
            question_id,
            is_correct: false,
            points_earned: 0,
        });
    }
}

/**
 * 查看解析（消耗积分）
 * 用户支付积分以查看问题解析
 * @param solution - 解析内容对象
 * @param payment - 用户的代币支付
 * @param ctx - 交易上下文
 */
public entry fun view_solution(
    solution: &SolutionContent,
    payment: &mut Coin<POINT_TOKEN>,
    ctx: &mut TxContext,
) {
    // 检查用户积分是否足够
    let required = solution.token_cost;
    assert!(coin::value(payment) >= required, EInsufficientBalance);

    // 从用户的代币中扣除费用
    let burn_amount = coin::split(payment, required, ctx);
    let burn_balance = coin::into_balance(burn_amount);

    // 记录事件
    event::emit(SolutionViewed {
        user: tx_context::sender(ctx),
        question_id: solution.question_id,
        tokens_spent: required,
    });

    // 销毁代币
    balance::destroy_zero(burn_balance);
}

/**
 * 更改管理员
 * 修改管理器的管理员地址
 * @param manager - 管理器实例
 * @param new_admin - 新管理员地址
 * @param ctx - 交易上下文
 */
public entry fun change_admin(manager: &mut QuizManager, new_admin: address, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == manager.admin, ENotAuthorized);
    manager.admin = new_admin;
}

/**
 * 铸造新代币给指定用户
 * 任何人都可以调用该函数为其他用户铸造代币
 * @param manager - 管理器实例
 * @param amount - 铸造数量
 * @param recipient - 接收者地址
 * @param ctx - 交易上下文
 */
public entry fun mint_tokens(
    manager: &mut QuizManager,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    // 铸造积分
    let points_coin = coin::mint<POINT_TOKEN>(&mut manager.treasury_cap, amount, ctx);

    // 转移给接收者
    transfer::public_transfer(points_coin, recipient);

    // 发出事件
    event::emit(QuizCompleted {
        user: recipient,
        question_id: 0, // 不与问题关联
        is_correct: true,
        points_earned: amount,
    });
}

/**
 * 销毁用户代币
 * 用户可以将自己的代币销毁
 * @param manager - Quiz管理器
 * @param coin - 要销毁的代币
 */
public entry fun burn_tokens(
    manager: &mut QuizManager,
    coin: Coin<POINT_TOKEN>,
) {
    // 销毁代币
    coin::burn(&mut manager.treasury_cap, coin);
}

// Getter 函数
public fun get_question_content(question: &Question): string::String {
    question.content
}

public fun get_question_id(question: &Question): u64 {
    question.question_id
}

public fun get_question_reward(question: &Question): u64 {
    question.reward_points
}

public fun get_solution_content(solution: &SolutionContent): string::String {
    solution.content
}

public fun get_solution_cost(solution: &SolutionContent): u64 {
    solution.token_cost
}

public fun has_answered_question(manager: &QuizManager, user: address, question_id: u64): bool {
    if (!table::contains(&manager.user_answers, user)) {
        return false
    };

    let user_question_table = table::borrow(&manager.user_answers, user);
    table::contains(user_question_table, question_id)
}
