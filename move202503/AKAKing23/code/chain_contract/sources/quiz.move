/**
 * 答题系统核心模块
 * 实现问题管理、用户答题记录以及查看解析的核心功能
 * 设计为去中心化模式，用户可以直接获得积分奖励
 */
module chain_contract::quiz;

use chain_contract::point_token::{Self, QuizManager, POINT_TOKEN, Question as TokenQuestion};
use std::string::{Self, String};
use std::vector;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// 错误码
/// 未授权操作错误
const ENotAuthorized: u64 = 0;
/// 问题不存在错误
const EQuestionNotFound: u64 = 1;
/// 已回答过此问题错误
const EAlreadyAnswered: u64 = 2;
/// 积分不足错误
const EInsufficientBalance: u64 = 3;

/// Quiz系统的one-time witness
public struct QUIZ has drop {}

/**
 * 问题结构
 * 存储问题内容、选项和答案
 */
public struct Question has key, store {
    id: UID,
    /// 问题内容
    content: String,
    /// 问题选项列表
    options: vector<String>,
    /// 正确答案的索引
    correct_answer: u64,
    /// 答对可获得的积分
    points_reward: u64,
    /// 查看解析的积分花费
    solution_cost: u64,
    /// 答案解析内容
    solution: String,
}

/**
 * 问题注册表
 * 管理系统中的所有问题
 */
public struct QuestionRegistry has key {
    id: UID,
    /// 问题ID到问题的映射表
    questions: Table<u64, Question>,
    /// 下一个问题ID，用于自增
    next_question_id: u64,
    /// 管理员地址
    admin: address,
}

/**
 * 用户答题记录
 * 记录用户回答问题的历史和查看解析的历史
 */
public struct UserAnswerRecord has key {
    id: UID,
    /// 用户地址
    user: address,
    /// 用户已回答问题记录，问题ID -> 是否回答正确
    answered_questions: Table<u64, bool>,
    /// 用户查看解析记录，问题ID -> 是否查看过解析
    viewed_solutions: Table<u64, bool>,
}

// 事件定义
/**
 * 问题创建事件
 * 当新问题被添加时触发
 */
public struct QuestionCreated has copy, drop {
    /// 问题ID
    question_id: u64,
    /// 问题内容
    content: String,
    /// 回答正确可获得的积分
    points_reward: u64,
}

/**
 * 问题回答事件
 * 当用户回答问题时触发
 */
public struct QuestionAnswered has copy, drop {
    /// 用户地址
    user: address,
    /// 问题ID
    question_id: u64,
    /// 是否回答正确
    is_correct: bool,
}

/**
 * 解析查看事件
 * 当用户付费查看解析时触发
 */
public struct SolutionViewed has copy, drop {
    /// 用户地址
    user: address,
    /// 问题ID
    question_id: u64,
    /// 消费的代币数量
    tokens_spent: u64,
}

/**
 * 模块初始化函数
 * 将由sui框架在部署时自动调用
 */
fun init(witness: QUIZ, ctx: &mut TxContext) {
    // 创建问题注册表对象
    let registry = QuestionRegistry {
        id: object::new(ctx),
        questions: table::new(ctx),
        next_question_id: 0,
        admin: tx_context::sender(ctx),
    };

    // 共享问题注册表，使其全局可访问
    transfer::share_object(registry);
}

/**
 * 为用户创建答题记录
 * 每个用户需要创建自己的答题记录来跟踪答题历史
 * @param ctx - 交易上下文
 */
public entry fun create_user_record(ctx: &mut TxContext) {
    // 创建用户答题记录对象
    let record = UserAnswerRecord {
        id: object::new(ctx),
        user: tx_context::sender(ctx),
        answered_questions: table::new(ctx),
        viewed_solutions: table::new(ctx),
    };

    // 将记录直接转移给创建者
    transfer::transfer(record, tx_context::sender(ctx));
}

/**
 * 添加新问题
 * 管理员添加新问题到系统中，同时在积分系统中注册
 * @param registry - 问题注册表
 * @param manager - Quiz管理器
 * @param content - 问题内容
 * @param options - 问题选项
 * @param correct_answer - 正确答案索引
 * @param correct_answer_str - 正确答案字符串
 * @param points_reward - 回答正确的积分奖励
 * @param solution_cost - 查看解析所需积分
 * @param solution - 解析内容
 * @param ctx - 交易上下文
 */
public entry fun add_question(
    registry: &mut QuestionRegistry,
    manager: &mut QuizManager,
    content: String,
    options: vector<String>,
    correct_answer: u64,
    correct_answer_str: String,
    points_reward: u64,
    solution_cost: u64,
    solution: String,
    ctx: &mut TxContext,
) {
    // 只有管理员可以添加问题
    assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

    // 创建问题对象
    let question = Question {
        id: object::new(ctx),
        content,
        options,
        correct_answer,
        points_reward,
        solution_cost,
        solution,
    };

    // 获取并保存问题ID
    let question_id = registry.next_question_id;

    // 添加到问题列表
    table::add(&mut registry.questions, question_id, question);

    // 更新下一个问题ID（自增）
    registry.next_question_id = question_id + 1;

    // 同时在积分系统中添加问题
    point_token::add_question(
        manager,
        content,
        correct_answer_str,
        points_reward,
        solution,
        solution_cost,
        ctx,
    );

    // 触发问题创建事件
    emit_question_created(question_id, content, points_reward);
}

/**
 * 简化的用户回答问题处理 - 前端验证后直接调用
 * 不需要验证答案，直接发放奖励
 * @param manager - Quiz管理器
 * @param token_question - 积分系统中的问题对象
 * @param user_record - 用户的答题记录
 * @param question_id - 问题ID
 * @param ctx - 交易上下文
 */
public entry fun reward_answer(
    registry: &QuestionRegistry,
    manager: &mut QuizManager,
    token_question: &TokenQuestion,
    user_record: &mut UserAnswerRecord,
    question_id: u64,
    ctx: &mut TxContext,
) {
    // 确保是用户自己的记录
    let user = tx_context::sender(ctx);
    assert!(user_record.user == user, ENotAuthorized);

    // 检查问题是否存在
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);

    // 检查是否已经回答过
    assert!(!table::contains(&user_record.answered_questions, question_id), EAlreadyAnswered);

    // 记录用户的回答结果为正确 (直接假设正确，因为前端已验证)
    table::add(&mut user_record.answered_questions, question_id, true);

    // 调用积分系统的奖励方法
    point_token::reward_correct_answer(
        manager,
        token_question,
        user,
        ctx,
    );

    // 触发问题回答事件
    emit_question_answered(user_record.user, question_id, true);
}

/**
 * 用户回答问题（原始方法，保留但不推荐使用）
 * 处理用户的答题请求，检验答案并记录结果
 * @param registry - 问题注册表
 * @param manager - Quiz管理器
 * @param token_question - 积分系统中的问题对象
 * @param user_record - 用户的答题记录
 * @param question_id - 问题ID
 * @param answer - 用户提交的答案索引
 * @param ctx - 交易上下文
 */
public entry fun answer_question(
    registry: &QuestionRegistry,
    manager: &mut QuizManager,
    token_question: &TokenQuestion,
    user_record: &mut UserAnswerRecord,
    question_id: u64,
    answer: u64,
    ctx: &mut TxContext,
) {
    // 确保是用户自己的记录
    assert!(user_record.user == tx_context::sender(ctx), ENotAuthorized);

    // 检查问题是否存在
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);

    // 检查是否已经回答过
    assert!(!table::contains(&user_record.answered_questions, question_id), EAlreadyAnswered);

    // 获取问题
    let question = table::borrow(&registry.questions, question_id);

    // 判断答案是否正确
    let is_correct = question.correct_answer == answer;

    // 记录用户的回答结果
    table::add(&mut user_record.answered_questions, question_id, is_correct);

    // 获取选项文本作为答案
    let options = &question.options;
    let answer_str = *vector::borrow(options, answer);

    // 调用积分系统的答题方法
    point_token::answer_question(
        manager,
        token_question,
        answer_str,
        ctx,
    );

    // 触发问题回答事件
    emit_question_answered(user_record.user, question_id, is_correct);
}

/**
 * 查看问题解析（需要花费积分）
 * 用户使用积分购买解析的查看权限
 * @param registry - 问题注册表
 * @param manager - Quiz管理器
 * @param user_record - 用户的答题记录
 * @param payment - 用户的积分代币
 * @param question_id - 问题ID
 * @param ctx - 交易上下文
 */
public entry fun view_solution(
    registry: &QuestionRegistry,
    manager: &mut QuizManager,
    user_record: &mut UserAnswerRecord,
    payment: &mut Coin<POINT_TOKEN>,
    question_id: u64,
    ctx: &mut TxContext,
) {
    // 确保是用户自己的记录
    assert!(user_record.user == tx_context::sender(ctx), ENotAuthorized);

    // 检查问题是否存在
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);

    // 获取问题
    let question = table::borrow(&registry.questions, question_id);

    // 检查用户积分是否足够
    assert!(coin::value(payment) >= question.solution_cost, EInsufficientBalance);

    // 如果是第一次查看，需要支付积分
    if (!table::contains(&user_record.viewed_solutions, question_id)) {
        // 从代币中分割出需要销毁的数量
        let burn_amount = coin::split(payment, question.solution_cost, ctx);

        // 销毁代币
        point_token::burn_tokens(manager, burn_amount);

        // 记录已查看标记，后续可免费查看
        table::add(&mut user_record.viewed_solutions, question_id, true);

        // 触发解析查看事件
        emit_solution_viewed(user_record.user, question_id, question.solution_cost);
    }
    // 如果已经查看过，不需要再次支付
}

/**
 * 获取问题解析（仅当已经支付过可以免费查看）
 * 查询已付费解析的内容
 * @param registry - 问题注册表
 * @param user_record - 用户的答题记录
 * @param question_id - 问题ID
 * @return 解析内容
 */
public fun get_solution(
    registry: &QuestionRegistry,
    user_record: &UserAnswerRecord,
    question_id: u64,
): String {
    // 检查问题是否存在
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);

    // 检查是否已经支付过查看费用
    assert!(table::contains(&user_record.viewed_solutions, question_id), ENotAuthorized);

    // 获取问题
    let question = table::borrow(&registry.questions, question_id);
    // 返回解析内容
    question.solution
}

/**
 * 更改管理员
 * 修改问题注册表的管理员地址
 * @param registry - 问题注册表
 * @param manager - Quiz管理器
 * @param new_admin - 新管理员地址
 * @param ctx - 交易上下文
 */
public entry fun change_admin(
    registry: &mut QuestionRegistry,
    manager: &mut QuizManager,
    new_admin: address,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);
    registry.admin = new_admin;

    // 同时更新积分系统的管理员
    point_token::change_admin(manager, new_admin, ctx);
}

// 简化版：直接发放奖励，无需任何ID
/**
 * 直接奖励用户 - 最简化版本
 * 不需要问题ID或记录，直接奖励用户指定数量的代币
 * @param manager - Quiz管理器
 * @param recipient - 接收代币的用户地址
 * @param amount - 奖励数量
 * @param ctx - 交易上下文
 */
public entry fun direct_reward(
    manager: &mut QuizManager,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext,
) {
    // 调用积分系统的铸币方法
    point_token::mint_tokens(
        manager,
        amount,
        recipient,
        ctx,
    );
}

// ===== 内部事件函数 =====
/**
 * 封装问题创建事件发送函数
 * 避免直接使用event::emit导致的linter错误
 */
fun emit_question_created(question_id: u64, content: String, points_reward: u64) {
    event::emit(QuestionCreated {
        question_id,
        content,
        points_reward,
    });
}

/**
 * 封装问题回答事件发送函数
 * 避免直接使用event::emit导致的linter错误
 */
fun emit_question_answered(user: address, question_id: u64, is_correct: bool) {
    event::emit(QuestionAnswered {
        user,
        question_id,
        is_correct,
    });
}

/**
 * 封装解析查看事件发送函数
 * 避免直接使用event::emit导致的linter错误
 */
fun emit_solution_viewed(user: address, question_id: u64, tokens_spent: u64) {
    event::emit(SolutionViewed {
        user,
        question_id,
        tokens_spent,
    });
}

// Getter 函数
public fun get_question_content(registry: &QuestionRegistry, question_id: u64): String {
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);
    let question = table::borrow(&registry.questions, question_id);
    question.content
}
/**
* 获取问题选项
* @param registry - 问题注册表
* @param question_id - 问题ID
* @return 问题选项列表
*/
public fun get_question_options(registry: &QuestionRegistry, question_id: u64): vector<String> {
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);
    let question = table::borrow(&registry.questions, question_id);
    question.options
}

/**
* 获取问题奖励积分
* @param registry - 问题注册表
* @param question_id - 问题ID
* @return 答对可获得的积分
*/
public fun get_question_reward(registry: &QuestionRegistry, question_id: u64): u64 {
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);
    let question = table::borrow(&registry.questions, question_id);
    question.points_reward
}
/**
* 获取解析所需积分
* @param registry - 问题注册表
* @param question_id - 问题ID
* @return 查看解析所需积分
*/
public fun get_solution_cost(registry: &QuestionRegistry, question_id: u64): u64 {
    assert!(table::contains(&registry.questions, question_id), EQuestionNotFound);
    let question = table::borrow(&registry.questions, question_id);
    question.solution_cost
}
/**
* 获取用户是否回答过特定问题
* @param user_record - 用户的答题记录
* @param question_id - 问题ID
* @return 是否已回答
*/
public fun has_answered(user_record: &UserAnswerRecord, question_id: u64): bool {
    table::contains(&user_record.answered_questions, question_id)
}
/**
* 获取用户回答是否正确
* @param user_record - 用户的答题记录
* @param question_id - 问题ID
* @return 回答是否正确
*/
public fun is_answer_correct(user_record: &UserAnswerRecord, question_id: u64): bool {
    assert!(table::contains(&user_record.answered_questions, question_id), EQuestionNotFound);
    *table::borrow(&user_record.answered_questions, question_id)
}
/**
* 获取用户是否已查看解析
* @param user_record - 用户的答题记录
* @param question_id - 问题ID
* @return 是否已查看解析
*/
public fun has_viewed_solution(user_record: &UserAnswerRecord, question_id: u64): bool {
    table::contains(&user_record.viewed_solutions, question_id)
}

/**
 * 添加新问题（不包含答案和解析）
 * 只上传问题内容和选项，不上传答案和解析，适用于前端验证答案的场景
 * @param registry - 问题注册表
 * @param content - 问题内容
 * @param options - 问题选项
 * @param ctx - 交易上下文
 * @return 新问题的ID
 */
public entry fun add_question_without_solution(
    registry: &mut QuestionRegistry,
    content: String,
    options: vector<String>,
    ctx: &mut TxContext,
): u64 {
    // 创建问题对象，使用占位符值
    let question = Question {
        id: object::new(ctx),
        content,
        options,
        correct_answer: 0, // 占位符，不存储真实答案
        points_reward: 0,  // 不设置奖励
        solution_cost: 0,  // 不设置解析费用
        solution: string::utf8(b""), // 空解析
    };

    // 获取并保存问题ID
    let question_id = registry.next_question_id;

    // 添加到问题列表
    table::add(&mut registry.questions, question_id, question);

    // 更新下一个问题ID（自增）
    registry.next_question_id = question_id + 1;

    // 发出问题创建事件
    emit_question_created(question_id, content, 0);
    
    // 返回问题ID
    question_id
}

/**
 * 添加简化问题（只有内容，没有选项、答案和解析）
 * 适用于前端处理选项和验证答案的场景
 * @param registry - 问题注册表
 * @param content - 问题内容
 * @param ctx - 交易上下文
 * @return 新问题的ID
 */
public entry fun add_simple_question(
    registry: &mut QuestionRegistry,
    content: String,
    ctx: &mut TxContext,
): u64 {
    // 创建问题对象，使用空选项和占位符值
    let empty_options = vector::empty<String>();
    
    let question = Question {
        id: object::new(ctx),
        content,
        options: empty_options,
        correct_answer: 0, // 占位符，不存储真实答案
        points_reward: 0,  // 不设置奖励
        solution_cost: 0,  // 不设置解析费用
        solution: string::utf8(b""), // 空解析
    };

    // 获取并保存问题ID
    let question_id = registry.next_question_id;

    // 添加到问题列表
    table::add(&mut registry.questions, question_id, question);

    // 更新下一个问题ID（自增）
    registry.next_question_id = question_id + 1;

    // 发出问题创建事件
    emit_question_created(question_id, content, 0);
    
    // 返回问题ID
    question_id
}

/**
 * 简化版查看解析（不需要问题ID）
 * 用户直接支付一定数量的积分，不关联特定问题
 * @param manager - Quiz管理器
 * @param payment - 用户的积分代币
 * @param amount - 要销毁的积分数量
 * @param ctx - 交易上下文
 */
public entry fun view_solution_simple(
    manager: &mut QuizManager,
    payment: &mut Coin<POINT_TOKEN>,
    amount: u64,
    ctx: &mut TxContext,
) {
    // 检查用户积分是否足够
    assert!(coin::value(payment) >= amount, EInsufficientBalance);

    // 从代币中分割出需要销毁的数量
    let burn_amount = coin::split(payment, amount, ctx);

    // 销毁代币
    point_token::burn_tokens(manager, burn_amount);

    // 触发解析查看事件，使用0作为占位符问题ID
    emit_solution_viewed(tx_context::sender(ctx), 0, amount);
}