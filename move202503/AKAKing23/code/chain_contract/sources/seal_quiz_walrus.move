/**
 * 基于SUI SEAL的题目信息加密存储模块
 * 提供题目数据的加密存储功能，使用Walrus存储加密数据
 */
module chain_contract::seal_quiz_walrus {
    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// 错误码
    /// 未授权操作错误
    const ENotAuthorized: u64 = 0;

    /**
     * 题目Blob引用结构
     * 关联题目数据和Walrus blobId
     */
    public struct QuizBlobRef has key, store {
        id: UID,
        /// 创建者地址
        creator: address,
        /// Walrus中的blobId
        blob_id: String,
        /// 题目难度级别
        difficulty: String,
        /// 创建时间戳
        created_at: u64,
    }

    /**
     * 题目Blob发布事件
     * 当题目数据被加密并关联到链上时触发
     */
    public struct BlobPublished has copy, drop {
        /// 创建者地址
        creator: address,
        /// Walrus中的blobId
        blob_id: String,
        /// 题目难度级别
        difficulty: String,
    }

    /**
     * 发布题目Blob信息到链上
     * 基本版本，使用默认难度
     * @param sender_addr - 发送者地址
     * @param blob_id - Walrus中的blobId
     * @param ctx - 交易上下文
     */
    public entry fun publish(
        sender_addr: address,
        blob_id: String,
        ctx: &mut TxContext
    ) {
        // 使用默认难度
        let difficulty = string::utf8(b"default");
        
        // 创建题目Blob引用
        let quiz_blob = QuizBlobRef {
            id: object::new(ctx),
            creator: sender_addr,
            blob_id,
            difficulty,
            created_at: tx_context::epoch(ctx),
        };

        // 发布事件
        event::emit(
            BlobPublished {
                creator: sender_addr,
                blob_id,
                difficulty,
            }
        );

        // 将对象转移给发送者
        transfer::transfer(quiz_blob, sender_addr);
    }

    /**
     * 发布题目Blob信息到链上，前端调用时默认使用此函数
     * 接收难度参数并处理
     * @param sender_addr - 发送者地址
     * @param blob_id - Walrus中的blobId
     * @param difficulty - 题目难度级别
     * @param ctx - 交易上下文
     */
    public entry fun publish_with_difficulty(
        sender_addr: address,
        blob_id: String,
        difficulty: String,
        ctx: &mut TxContext
    ) {
        // 创建题目Blob引用
        let quiz_blob = QuizBlobRef {
            id: object::new(ctx),
            creator: sender_addr,
            blob_id,
            difficulty,
            created_at: tx_context::epoch(ctx),
        };

        // 发布事件
        event::emit(
            BlobPublished {
                creator: sender_addr,
                blob_id,
                difficulty,
            }
        );

        // 将对象转移给发送者
        transfer::transfer(quiz_blob, sender_addr);
    }
    
    /**
     * 查询指定难度下的所有题目Blob列表
     * 这个函数仅定义接口，实际实现需要在前端通过事件索引完成
     * @param difficulty - 题目难度级别
     * @param ctx - 交易上下文
     */
    public entry fun query_blobs_by_difficulty(
        difficulty: String,
        _ctx: &mut TxContext
    ) {
        // 实际查询通过前端事件索引实现
        // 此函数仅作为接口定义，不包含具体实现
        // 仅用于匹配前端调用需求
        let _d = difficulty;
    }
}
