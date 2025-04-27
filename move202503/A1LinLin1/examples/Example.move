module 0x1::ExampleErrors {
    use std::option::{Option, none, some};
    use std::vector;

    /// 1. 未做访问控制的外部调用（detectCallSafety）
    public fun unsafe_call(account: &signer) {
        // 这里调用了外部模块，但没有任何 if (signer) 检查
        0x2::OtherModule::do_something();
    }

    /// 2. 缺少 &signer 参数或地址校验的资源操作（detectAccessControl）
    public fun bad_mutate() {
        // 完全没传 signer，也没做 address() 校验
        move_from<Balance>(@0x1);
    }

    /// 3. 漏洞示例：算术溢出（detectOverflow）
    public fun bad_overflow(account: &signer) {
        let a: u64 = 0xffff_ffff_ffff_ffff;
        // 直接 +1 会溢出
        let b = a + 1;
    }

    /// 4. 重入漏洞示例：外部调用后未更新状态（detectReentrancy）
    public fun bad_reentrancy(account: &signer) {
        // 模拟取款：先调用外部转账
        0x2::Bank::transfer(account, 100);
        // 然后才更新余额，导致重入时余额仍旧旧值
        let bal = borrow_global_mut<Balance>(@0x1);
        *bal = *bal - 100;
        move_to<Balance>(account, bal);
    }

    /// 5. 冻结绕过示例：转账前未检查 frozen 标志（detectFreezeBypass）
    public fun bad_freeze_bypass(account: &signer) {
        // 应该先检查 is_frozen 标志，但这里直接转账
        0x2::Token::transfer(account, @0x3, 50);
    }

    /// 6. 逻辑缺陷示例：if 缺少 else 分支（detectLogicDefect）
    public fun bad_logic(account: &signer, x: u64) {
        if (x > 100) {
            // 处理大于 100 的情况
            0x2::Log::info(quote!("<100 handled"));
        }
        // x <= 100 时什么都不做，可能遗漏边界
    }

    /// 7. 随机数误用示例：直接用伪随机数（detectRandomnessMisuse）
    public fun bad_random(account: &signer) {
        let r = Random::random();     // 伪随机，易被操控
        // 用于关键逻辑
        0x2::Lottery::enter(account, r % 10);
    }
}

