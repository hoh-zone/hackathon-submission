module audit::ReportStore {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    public struct AuditReport has key, store {
        id: UID,
        owner: address,
        code_hash: vector<u8>,
        result_summary: vector<u8>,
    }

    fun new_report(
        code_hash: vector<u8>,
        result_summary: vector<u8>,
        ctx: &mut TxContext
    ): AuditReport {
        AuditReport {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            code_hash,
            result_summary
        }
    }

    public entry fun submit(
        code_hash: vector<u8>,
        result_summary: vector<u8>,
        ctx: &mut TxContext
    ) {
        let report = new_report(code_hash, result_summary, ctx);
        transfer::public_transfer(report, tx_context::sender(ctx));
    }
}

