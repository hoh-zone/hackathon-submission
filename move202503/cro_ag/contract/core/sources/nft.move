module core::nft {
    use sui::table;
    use sui::types;
    use sui::event;
    use sui::sui::SUI;
    use sui::coin::{Coin, Self};
    use sui::balance;
    use sui::clock;

    use core::treasury;
    
    use core::admin;
    use core::events;
    use core::version;

    use points::points::POINTS;
    use cro::cro::CRO;

    const TGE_TIME: u64 = 1903824000000;
    const UNLOCK_TIME: u64 = 1903824000000;
    const END_LOCK_TIME: u64 = UNLOCK_TIME + TOTAL_MS;
    const TOTAL_MS: u64 = 63072000000;
    const CRO_PER_POINT: u64 = 0;

    const NFT_PRICE: u64 = 0;
    const REFERRAL_NFT_PRICE: u64 = 0;

    const MINT_REWARD: u64 = 50;
    const REFERRAL_MINT_REWARD: u64 = 50;

    const POINTS_PER_LENDING: u64 = 50;
    const POINTS_PER_SWAP: u64 = 50;
    
    const POINTS_PER_OBJECT: u64 = 1;

    const URL: vector<u8> = b"https://cro-ag.pages.dev/cronft.png";

    const DEV_WALLET: address = @0x0000060c049b5aea93660573019b2ed5d657245212a998e030981589726d11fe;

    public struct NFT has drop { }

    #[allow(lint(share_owned))]
    fun init(arg0: NFT, arg1: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x2::package::claim<NFT>(arg0, arg1);
        let mut v1 = 0x2::display::new<CroNft>(&v0, arg1);
        0x2::display::add<CroNft>(&mut v1, 0x1::string::utf8(b"name"), 0x1::string::utf8(b"CroNft #{number}"));
        0x2::display::add<CroNft>(&mut v1, 0x1::string::utf8(b"description"), 0x1::string::utf8(b"CroNft #{number}"));
        0x2::display::add<CroNft>(&mut v1, 0x1::string::utf8(b"image_url"), 0x1::string::utf8(URL));
        0x2::display::add<CroNft>(&mut v1, 0x1::string::utf8(b"minted_by"), 0x1::string::utf8(b"{minted_by}"));
        0x2::display::update_version<CroNft>(&mut v1);
        let (v2, v3) = 0x2::transfer_policy::new<CroNft>(&v0, arg1);
        0x2::transfer::public_share_object<0x2::transfer_policy::TransferPolicy<CroNft>>(v2);
        0x2::transfer::public_transfer<0x2::transfer_policy::TransferPolicyCap<CroNft>>(v3, 0x2::tx_context::sender(arg1));
        0x2::transfer::public_transfer<0x2::package::Publisher>(v0, 0x2::tx_context::sender(arg1));
        0x2::transfer::public_transfer<0x2::display::Display<CroNft>>(v1, 0x2::tx_context::sender(arg1));
    }

    public struct NftConfig has store, key {
        id: object::UID,
        version: u64,
        tge_time: u64,
        unlock_time: u64,
        end_lock_time: u64,
        cro_per_points: u64,
        total_mint_nfts: u64,
        total_staked_points: u64,
        user_to_nft: table::Table<address, object::ID>,
        nft_to_user: table::Table<object::ID, address>,
        nft_price: u64,
        referral_nft_price: u64,
        mint_reward: u64,
        referral_mint_reward: u64,
        points_per_lending: u64,
        points_per_swap: u64,
    }

    public fun get_points_per_lending(nftConfig: &NftConfig): u64{
        nftConfig.points_per_lending
    }

    public fun get_points_per_swap(nftConfig: &NftConfig): u64{
        nftConfig.points_per_swap
    }

    fun check_version(nftConfig: &NftConfig) {
        version::check_version(nftConfig.version);
    }

    public(package) fun check_before_tge(nftConfig: &NftConfig, clock: &clock::Clock): bool{
        let if_before_tge = if( nftConfig.tge_time == 0 || clock::timestamp_ms(clock) < nftConfig.tge_time ){
            true
        } else {
            false
        };
        if_before_tge
    }
    
    #[allow(unused_variable)]
    public fun change_nft_config(
        adminCap: &admin::AdminCap,
        nftConfig: &mut NftConfig, 
        version: &mut option::Option<u64>, 
        tge_time: &mut option::Option<u64>,  
        unlock_time: &mut option::Option<u64>, 
        end_lock_time: &mut option::Option<u64>,
        cro_per_points: &mut option::Option<u64>,
        nft_price: &mut option::Option<u64>,
        referral_nft_price: &mut option::Option<u64>,
        mint_reward: &mut option::Option<u64>,
        referral_mint_reward: &mut option::Option<u64>,
        points_per_lending: &mut option::Option<u64>,
        points_per_swap: &mut option::Option<u64>,
    ) {
        if (option::is_some<u64>(freeze(version))) {
            nftConfig.version = option::extract<u64>(version);
        };
        if (option::is_some<u64>(freeze(tge_time))) {
            nftConfig.tge_time = option::extract<u64>(tge_time);
        };
        if (option::is_some<u64>(freeze(end_lock_time))) {
            nftConfig.end_lock_time = option::extract<u64>(end_lock_time);
        };
        if (option::is_some<u64>(freeze(unlock_time))) {
            nftConfig.unlock_time = option::extract<u64>(unlock_time);
        };
        if (option::is_some<u64>(freeze(cro_per_points))) {
            nftConfig.cro_per_points = option::extract<u64>(cro_per_points);
        };
        if (option::is_some<u64>(freeze(nft_price))) {
            nftConfig.nft_price = option::extract<u64>(nft_price);
        };
        if (option::is_some<u64>(freeze(referral_nft_price))) {
            nftConfig.referral_nft_price = option::extract<u64>(referral_nft_price);
        };
        if (option::is_some<u64>(freeze(mint_reward))) {
            nftConfig.mint_reward = option::extract<u64>(mint_reward);
        };
        if (option::is_some<u64>(freeze(referral_mint_reward))) {
            nftConfig.referral_mint_reward = option::extract<u64>(referral_mint_reward);
        };
        if (option::is_some<u64>(freeze(points_per_lending))) {
            nftConfig.points_per_lending = option::extract<u64>(points_per_lending);
        };
        if (option::is_some<u64>(freeze(points_per_swap))) {
            nftConfig.points_per_swap = option::extract<u64>(points_per_swap);
        };
    }

    public(package) fun create_config<T0: drop>(
        witness: &T0, 
        ctx: &mut tx_context::TxContext
    ) : NftConfig {
        assert!(types::is_one_time_witness<T0>(witness), 1);
        let nftConfig = NftConfig{
            id                          : object::new(ctx), 
            version                     : version::current_version(), 
            tge_time                    : TGE_TIME, 
            unlock_time                 : UNLOCK_TIME,
            end_lock_time               : END_LOCK_TIME,
            cro_per_points              : CRO_PER_POINT, 
            total_mint_nfts             : 0,
            total_staked_points         : 0,
            user_to_nft                 : table::new<address, object::ID>(ctx), 
            nft_to_user                 : table::new<object::ID, address>(ctx), 
            nft_price                   : NFT_PRICE,
            referral_nft_price          : REFERRAL_NFT_PRICE,
            mint_reward                 : MINT_REWARD,
            referral_mint_reward        : REFERRAL_MINT_REWARD,
            points_per_lending          : POINTS_PER_LENDING,
            points_per_swap             : POINTS_PER_SWAP,
        };
        nftConfig
    }

    public struct CroNft has store, key {
        id: object::UID,
        staked_points: balance::Balance<POINTS>,
        staked_cro: balance::Balance<CRO>,
        unlock_time: u64,
        owner: address,
    }

    public struct MintNftEvent has copy, drop {
        nft_id: address,
        owner: address,
    }

    public struct MintReferralNftEvent has copy, drop {
        nft_id: address,
        owner: address,
        referral: address,
    }

    #[allow(lint(self_transfer))]
    public fun mint_nft(
        nftConfig: &mut NftConfig,
        treasury: &mut treasury::Treasury, 
        payment: Coin<SUI>, 
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        check_version(nftConfig);
        let sender = tx_context::sender(ctx);
        assert!(coin::value(&payment) == nftConfig.nft_price, 0);
        nftConfig.total_mint_nfts = 1 + nftConfig.total_mint_nfts;
        treasury::deposit<SUI>(treasury, payment);
        zero_obj_mint_with_points(
            nftConfig, 
            treasury,
            MINT_REWARD,
            clock,
            ctx,
        );
        let nft = CroNft{
            id: object::new(ctx),
            staked_points: balance::zero<POINTS>(),
            staked_cro: balance::zero<CRO>(),
            unlock_time: 0,
            owner: sender,
        };
        let mint_event = MintNftEvent { 
            nft_id: object::uid_to_address(&nft.id), 
            owner: nft.owner 
        };
        event::emit<MintNftEvent>(mint_event);
        register(nftConfig, &nft, sender);
        transfer::public_transfer<CroNft>(nft, sender);
    }

    #[allow(lint(self_transfer))]
    public fun referral_mint(
        nftConfig: &mut NftConfig,
        treasury: &mut treasury::Treasury, 
        payment: Coin<SUI>, 
        referral: address,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ){
        let sender = tx_context::sender(ctx);
        assert!(referral != sender, 0);
        check_version(nftConfig);
        assert!(coin::value(&payment) == nftConfig.referral_nft_price, 0);
        nftConfig.total_mint_nfts = 1 + nftConfig.total_mint_nfts;
        treasury::deposit<SUI>(treasury, payment);
        zero_obj_mint_with_points(
            nftConfig, 
            treasury,
            MINT_REWARD,
            clock,
            ctx,
        );
        let nft = CroNft{
            id: object::new(ctx),
            staked_points: balance::zero<POINTS>(),
            staked_cro: balance::zero<CRO>(),
            unlock_time: 0,
            owner: sender,
        };
        let mint_event = MintReferralNftEvent { 
            nft_id: object::uid_to_address(&nft.id), 
            owner: nft.owner,
            referral: referral,
        };
        event::emit<MintReferralNftEvent>(mint_event);

        register(nftConfig, &nft, sender);
        transfer::public_transfer<CroNft>(nft, sender);

        if(check_before_tge(nftConfig, clock)){
            let total_balance = treasury::borrow_from_treasury<POINTS>(treasury);
            let referral_reward = coin::from_balance<POINTS>(balance::split<POINTS>(total_balance, nftConfig.referral_mint_reward), ctx);
            transfer::public_transfer<coin::Coin<POINTS>>(referral_reward, referral);
        }
    }

    public(package) fun register(nftConfig: &mut NftConfig, nft: &CroNft, owner: address) {
        let nft_id = object::id<CroNft>(nft);
        assert!(!table::contains<address, object::ID>(&nftConfig.user_to_nft, owner), 3);
        assert!(!table::contains<object::ID, address>(&nftConfig.nft_to_user, nft_id), 2);
        table::add<address, object::ID>(&mut nftConfig.user_to_nft, owner, nft_id);
        table::add<object::ID, address>(&mut nftConfig.nft_to_user, nft_id, owner);
    }

    public fun add_points(
        nftConfig: &mut NftConfig,
        nft: &mut CroNft, 
        points: coin::Coin<POINTS>,
        clock: &clock::Clock, 
        ctx: &mut tx_context::TxContext
    ) {
        assert!(check_before_tge(nftConfig, clock), 1);
        check_version(nftConfig);
        let amount = coin::value<POINTS>(&points);
        nftConfig.total_staked_points = amount + nftConfig.total_staked_points;
        events::emit_add_points_event(amount, ctx);
        balance::join<POINTS>(&mut nft.staked_points, coin::into_balance<POINTS>(points));
    }

    public fun remove_points(
        nftConfig: &mut NftConfig,
        nft: &mut CroNft, 
        amount: u64, 
        clock: &clock::Clock, 
        ctx: &mut tx_context::TxContext
    ): coin::Coin<POINTS> {
        assert!(check_before_tge(nftConfig, clock), 1);
        check_version(nftConfig);
        nftConfig.total_staked_points = nftConfig.total_staked_points - amount;
        let balance = balance::split<POINTS>(&mut nft.staked_points, amount);
        events::emit_remove_points_event(amount, ctx);
        coin::from_balance<POINTS>(balance, ctx)
    }

    public(package) fun check_unlock_time_not_zero(nft: &CroNft) {
        assert!(nft.unlock_time != 0, 0)
    }

    public(package) fun check_unlock_time_zero(nft: &CroNft) {
        assert!(nft.unlock_time == 0, 0)
    }

    public(package) fun check_unlock_time_valid(nft: &CroNft, clock: &clock::Clock) {
        assert!(nft.unlock_time <= clock::timestamp_ms(clock), 1)
    }

    public(package) fun update_prev_unlock_time(nft: &mut CroNft, clock: &clock::Clock) {
        nft.unlock_time = clock::timestamp_ms(clock);
    }

    public(package) fun update_unlock_time_init(nft: &mut CroNft) {
        check_unlock_time_zero(nft);
        nft.unlock_time = UNLOCK_TIME;
    }

    public fun claim_init(
        nftConfig: &NftConfig,
        treasury: &mut treasury::Treasury,
        nft: &mut CroNft,
        clock: &clock::Clock, 
    ) {
        assert!( nftConfig.tge_time != 0, 0);
        assert!( clock::timestamp_ms(clock) >= nftConfig.tge_time, 1);
        update_unlock_time_init(nft);
        let total_balance = treasury::borrow_from_treasury<CRO>(treasury);
        let balance = balance::split<CRO>(
            total_balance, 
            balance::value<POINTS>(&nft.staked_points) * nftConfig.cro_per_points
        );
        balance::join<CRO>(&mut nft.staked_cro, balance);
    }

    public fun claim_cro(
        nftConfig: &NftConfig,
        nft: &mut CroNft, 
        clock: &clock::Clock, 
        ctx: &mut tx_context::TxContext
    ): coin::Coin<CRO>{
        assert!( balance::value<CRO>(&nft.staked_cro) > 0, 0);
        assert!( nftConfig.tge_time != 0, 0);
        assert!( clock::timestamp_ms(clock) >= nftConfig.tge_time, 1);
        assert!( clock::timestamp_ms(clock) >= nftConfig.unlock_time, 2);
        if(clock::timestamp_ms(clock) >= nftConfig.end_lock_time) {
            let amount = balance::value<CRO>(&nft.staked_cro);
            assert!(amount > 0, 0);
            let balance = balance::split<CRO>(&mut nft.staked_cro, amount);
            events::emit_claim_cro_event(amount, ctx);
            coin::from_balance<CRO>(balance, ctx)
        }
        else {
            check_unlock_time_not_zero(nft);
            check_unlock_time_valid(nft, clock);
            let amount = (clock::timestamp_ms(clock) - nft.unlock_time) * balance::value<CRO>(&nft.staked_cro) / (nftConfig.end_lock_time - nftConfig.unlock_time);
            assert!(amount > 0, 0);
            let balance = balance::split<CRO>(&mut nft.staked_cro, amount);
            update_prev_unlock_time(nft, clock);
            events::emit_claim_cro_event(amount, ctx);
            coin::from_balance<CRO>(balance, ctx)
        }
    }

    #[allow(lint(self_transfer))]
    public fun zero_obj_mint_with_points(
        nftConfig: &NftConfig, 
        treasury: &mut treasury::Treasury,
        amount: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        zero_obj_mint_with_no_points(
            amount,
            ctx,
        );
        if(check_before_tge(nftConfig, clock)){
            let total_balance = treasury::borrow_from_treasury<POINTS>(treasury);
            let points = coin::from_balance<POINTS>(balance::split<POINTS>(total_balance, POINTS_PER_OBJECT * amount), ctx);
            transfer::public_transfer<coin::Coin<POINTS>>(points, sender);
        }
    }

    public fun zero_obj_mint_with_no_points(
        amount: u64,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(amount > 0, 0);
        events::emit_multi_zero_object_event(amount, ctx);
    }
}