module narr_flow::story {
    use std::string;
    use narr_flow::token;

    /// 段落对象
    public struct Paragraph has copy, drop, store {
        content: string::String,
        author: address,
        votes: u64,
    }

    /// 一本书对象
    public struct Book has key, store {
        id: UID,
        title: string::String,
        author: address,
        status: u8, // 0=进行中, 1=已归档
        index: u64, // 第几本书
        paragraphs: vector<Paragraph>,
    }

    /// 故事列表对象（全局唯一，shared）
    public struct StoryBook has key {
        id: UID,
        books: vector<Book>,
        current_book_index: u64, // 当前活跃 Book 的下标
    }

    /// 初始化 StoryBook（只需一次，部署后调用）
    public entry fun init_story_book(ctx: &mut TxContext) {
        let book = StoryBook { id: object::new(ctx),
            books: vector::empty<Book>(),
            current_book_index: 0 };
        transfer::share_object(book);
    }

    /// 开启新书（不再需要归档票数阈值）
    public entry fun start_new_book(
        story_book: &mut StoryBook,
        title: string::String,
        author: address,
        treasury: &mut token::Treasury,
        ctx: &mut TxContext
    ) {
        let book = Book {
            id: object::new(ctx),
            title,
            author,
            status: 0,
            index: vector::length(&story_book.books) + 1,
            paragraphs: vector::empty<Paragraph>(),
        };
        vector::push_back(&mut story_book.books, book);
        story_book.current_book_index = vector::length(&story_book.books) - 1;
        // 奖励
        let idx = story_book.current_book_index;
        let book_ref = vector::borrow(&story_book.books, idx);
        token::reward_start_new_book(treasury, object::id(book_ref), ctx);
    }

    /// 添加段落
    public entry fun add_paragraph(
        story_book: &mut StoryBook,
        content: string::String,
        author: address,
        treasury: &mut token::Treasury,
        ctx: &mut TxContext
    ) {
        // 限制内容最大字符数（2000字符）
        assert!(string::length(&content) <= 2000, 110); // 超出2000字符报错
        let idx = story_book.current_book_index;
        let book_ref = vector::borrow_mut(&mut story_book.books, idx);
        assert!(book_ref.status == 0, 100); // 只能给进行中的书添加段落
        let para = Paragraph { content, author, votes: 0 };
        vector::push_back(&mut book_ref.paragraphs, para);
        // 奖励
        token::reward_paragraph_addition(treasury, object::id(book_ref), ctx);
    }

    /// 投票
    public entry fun vote_paragraph(
        story_book: &mut StoryBook,
        para_index: u64
    ) {
        let idx = story_book.current_book_index;
        let book_ref = vector::borrow_mut(&mut story_book.books, idx);
        assert!(book_ref.status == 0, 120); // 只能对进行中的书投票
        let para_ref = vector::borrow_mut(&mut book_ref.paragraphs, para_index);
        para_ref.votes = para_ref.votes + 1;
    }

    /// 归档书本（段落数达到10时可归档）
    public entry fun archive_book(
        story_book: &mut StoryBook,
        treasury: &mut token::Treasury,
        ctx: &mut TxContext
    ) {
        let idx = story_book.current_book_index;
        let book_ref = vector::borrow_mut(&mut story_book.books, idx);
        assert!(book_ref.status == 0, 130);
        assert!(vector::length(&book_ref.paragraphs) >= 10, 131); // 段落数未达10不能归档
        book_ref.status = 1;
        // 归档后 current_book_index 指向无效，需前端检测后自动开启新书
        story_book.current_book_index = 0;
        // 奖励
        token::reward_archive(treasury, object::id(book_ref), ctx);
    }

    /// 查询所有 Book
    public fun get_all_books(story_book: &StoryBook): &vector<Book> {
        &story_book.books
    }

    /// 查询 Book 下所有段落
    public fun get_all_paragraphs(book: &Book): &vector<Paragraph> {
        &book.paragraphs
    }

    /// 查询当前活跃 Book 的下标
    public fun get_current_book_index(story_book: &StoryBook): u64 {
        story_book.current_book_index
    }
} 