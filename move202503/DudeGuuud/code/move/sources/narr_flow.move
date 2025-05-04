module narr_flow::narr_flow {
    use std::string::{String};
    use narr_flow::story::{Self, StoryBook};
    use narr_flow::token::{Self, Treasury};
    const ENotAuthorized: u64 = 0;
    
    // 平台管理员能力结构
    public struct PlatformCap has key, store {
        id: UID,
        admin: address
    }
    
    // 事件
    public struct StoryCreatedWithReward has copy, drop {
        book_index: u64,
        author: address,
        title: String,
        reward_amount: u64
    }
    
    public struct ParagraphAddedWithReward has copy, drop {
        book_index: u64,
        author: address,
        content_preview: String,
        reward_amount: u64
    }
    
    public struct ProposalSubmittedWithReward has copy, drop {
        story_id: ID,
        author: address,
        reward_amount: u64
    }
    
    public struct VotingReward has copy, drop {
        story_id: ID,
        voter: address,
        reward_amount: u64
    }
    
    public struct WinningProposalReward has copy, drop {
        story_id: ID,
        author: address,
        reward_amount: u64
    }
    
    // === 初始化函数 ===
    
    fun init(_ctx: &mut TxContext) {
        let platform_cap = PlatformCap {
            id: object::new(_ctx),
            admin: tx_context::sender(_ctx)
        };
        
        transfer::transfer(platform_cap, tx_context::sender(_ctx));
    }
    
    // === 公共入口函数 ===
    
    // 开启新书并奖励作者
    public entry fun start_new_book_with_reward(
        _treasury: &mut Treasury,
        story_book: &mut StoryBook,
        title: String,
        _ctx: &mut TxContext
    ) {
        let _sender = tx_context::sender(_ctx);
        story::start_new_book(story_book, title, _sender, _treasury, _ctx);
        let _book_index = story::get_current_book_index(story_book);
        // token::reward_story_creation(_treasury, _sender, _book_index, _ctx); // 你可自定义奖励逻辑
        // event::emit(StoryCreatedWithReward { book_index: _book_index, author: _sender, title, reward_amount: 0 });
    }
    
    // 添加段落并奖励作者
    public entry fun add_paragraph_with_reward(
        _treasury: &mut Treasury,
        story_book: &mut StoryBook,
        content: String,
        _ctx: &mut TxContext
    ) {
        let _sender = tx_context::sender(_ctx);
        story::add_paragraph(story_book, content, _sender, _treasury, _ctx);
        let _book_index = story::get_current_book_index(story_book);
        // token::reward_paragraph_addition(_treasury, _sender, _book_index, _ctx);
        // event::emit(ParagraphAddedWithReward { book_index: _book_index, author: _sender, content_preview: content, reward_amount: 0 });
    }
    
    // 开始段落投票会话
    public entry fun start_voting_session(
        _story_book: &mut StoryBook,
        _proposals_hash: vector<vector<u8>>,
        _proposals_walrus_id: vector<vector<u8>>,
        _voting_duration: u64,
        _ctx: &mut TxContext
    ) {
        // story::start_voting(_story_book, _proposals_hash, _proposals_walrus_id, _voting_duration, _ctx);
    }
    
    // 提交段落提案并奖励
    /*
    public entry fun submit_proposal_with_reward(
        treasury: &mut Treasury,
        story: &mut Story,
        content: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // 提交提案
        // story::submit_proposal(story, content, ctx);
        // 奖励提案者
        // let story_id = object::id(story);
        // token::reward_paragraph_addition(treasury, sender, story_id, ctx);
        // 发出事件
        // event::emit(ProposalSubmittedWithReward {
        //     story_id,
        //     author: sender,
        //     reward_amount: 10_000_000_000 // 10 NARR
        // });
    }
    */
    
    // 投票并奖励投票者
    public entry fun vote_with_reward(
        _treasury: &mut Treasury,
        story_book: &mut StoryBook,
        para_index: u64,
        _ctx: &mut TxContext
    ) {
        let _sender = tx_context::sender(_ctx);
        story::vote_paragraph(story_book, para_index);
        let _book_index = story::get_current_book_index(story_book);
        // token::reward_voter(_treasury, _sender, _book_index, _ctx);
    }
    
    // 结束投票并奖励获胜提案的作者
    public entry fun end_voting_with_reward(
        _treasury: &mut Treasury,
        _story_book: &mut StoryBook,
        _ctx: &mut TxContext
    ) {
        // let _winning_author = story::complete_story(_story_book, _ctx);
        // let story_id = object::id(story);
        // token::reward_winning_proposal(_treasury, _winning_author, story_id, _ctx);
    }
    
    // 归档书本并奖励
    public entry fun archive_book_with_reward(
        _treasury: &mut Treasury,
        story_book: &mut StoryBook,
        _ctx: &mut TxContext
    ) {
        story::archive_book(story_book, _treasury, _ctx);
        let _book_index = story::get_current_book_index(story_book);
        // 可在此处奖励归档相关用户
    }
    
    // === 管理员功能 ===
    
    // 管理员自定义奖励
    public entry fun admin_custom_reward(
        _treasury: &mut Treasury,
        _platform_cap: &PlatformCap,
        receiver: address,
        amount: u64,
        _ctx: &mut TxContext
    ) {
        // 校验只有平台管理员可以调用
        let _sender = tx_context::sender(_ctx);
        assert!(_sender == _platform_cap.admin, ENotAuthorized);
        let story_id_opt = std::option::none<ID>();
        // token::admin_reward(_treasury, receiver, amount, story_id_opt, _ctx);
    }
} 