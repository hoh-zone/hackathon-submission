module ffd::props;

use std::string::String;
use sui::event;
use sui::package::Publisher;
use sui::random::Random;
use sui::vec_map::{Self, VecMap};
use ffd::nft::FightForDoveNFT;

const E_Not_Valid_Quality: u64 = 0;
const E_Not_Matched_Length: u64 = 1;

public struct InnerProps has copy, drop, store {
    props_type: String,
    image_url: String,
    effects: VecMap<String, String>
}

public struct PropsList has key {
    id: UID,
    ordinary: VecMap<ID, InnerProps>,
    excellent: VecMap<ID, InnerProps>,
    epic: VecMap<ID, InnerProps>
}

public struct Props has key, store {
    id: UID,
    props_type: String,
    image_url: String,
    quality: String,
    effects: VecMap<String, String>
}

public struct GenerateNewPropsEvent has copy, drop {
    new_props_id: ID
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(PropsList {
        id: object::new(ctx),
        ordinary: vec_map::empty<ID, InnerProps>(),
        excellent: vec_map::empty<ID, InnerProps>(),
        epic: vec_map::empty<ID, InnerProps>()
    });
}

public fun burn_props(props: Props) {
    let Props {
        id,
        props_type: _,
        image_url: _,
        quality: _,
        mut effects
    } = props;
    object::delete(id);
    while (!effects.is_empty()) {
        effects.pop();
    };
    effects.destroy_empty();
}

public(package) fun deal_with_in_game_props(props: Props, nft: &mut FightForDoveNFT, ids: &vector<ID>) {
    if (ids.contains(&props.id.to_inner())) {
        nft.add_props<Props>(props);
    } else {
        props.burn_props();
    };
}

entry fun generate_new_props(
    _: &Publisher,
    list: &mut PropsList,
    quality: u8,
    props_type: String,
    image_url: String,
    ctx: &mut TxContext
) {
    let uid = object::new(ctx);
    let new_props_id = uid.to_inner();
    object::delete(uid);
    assert!(quality <= 2, E_Not_Valid_Quality);
    let quality_map = if (quality == 0) &mut list.ordinary else if (quality == 1) &mut list.excellent else &mut list.epic;
    quality_map.insert(new_props_id, InnerProps {
        props_type,
        image_url,
        effects: vec_map::empty<String, String>()
    });
    event::emit(GenerateNewPropsEvent {
        new_props_id
    });
}

entry fun edit_props_effects(
    _: &Publisher,
    list: &mut PropsList,
    quality: u8,
    id: ID,
    mut keys: vector<String>,
    mut values: vector<String>
) {
    assert!(quality <= 2, E_Not_Valid_Quality);
    assert!(keys.length() == values.length(), E_Not_Matched_Length);
    let quality_map = if (quality == 0) &mut list.ordinary else if (quality == 1) &mut list.excellent else &mut list.epic;
    let props = &mut quality_map[&id];
    while (!keys.is_empty()) {
        let key = keys.pop_back();
        let value = values.pop_back();
        if (key == b"props_type".to_string()) {
            props.props_type = value;
        } else if (key == b"image_url".to_string()) {
            props.image_url = value;
        } else if (!props.effects.contains(&key)) {
            props.effects.insert(key, value);
        } else {
            let old_value = &mut props.effects[&key];
            *old_value = value;
        };
    };
    keys.destroy_empty();
    values.destroy_empty();
}

entry fun delete_props_effects(
    _: &Publisher,
    list: &mut PropsList,
    quality: u8,
    id: ID,
    mut keys: vector<String>
) {
    assert!(quality <= 2, E_Not_Valid_Quality);
    let quality_map = if (quality == 0) &mut list.ordinary else if (quality == 1) &mut list.excellent else &mut list.epic;
    let props = &mut quality_map[&id];
    while (!keys.is_empty()) {
        let key = keys.pop_back();
        props.effects.remove(&key);
    };
    keys.destroy_empty();
}

public(package) fun generate_new_in_game_props(list: &PropsList, level: u64, random: &Random, ctx: &mut TxContext): Props {
    // 80 - level -> ordinary
    // 3 + level / 3 -> epic
    // last -> excellent
    let mut random_generator = random.new_generator(ctx);
    let quality = random_generator.generate_u64_in_range(1, 100);
    let quality_map = if (quality <= 80 - level) &list.ordinary else if (quality <= 80 - level + 3 + level / 3) &list.epic else &list.excellent;
    let idx = random_generator.generate_u64_in_range(0, quality_map.size() - 1);
    let (_, inner_props) = quality_map.get_entry_by_idx(idx);
    Props {
        id: object::new(ctx),
        props_type: inner_props.props_type,
        image_url: inner_props.image_url,
        quality: if (quality <= 80 - level) b"ordinary".to_string() else if (quality <= 80 - level + 3 + level / 3) b"epic".to_string() else b"excellent".to_string(),
        effects: inner_props.effects
    }
}

public(package) fun generate_empty_skill_props(ctx: &mut TxContext): Props {
    Props {
        id: object::new(ctx),
        props_type: b"skill".to_string(),
        image_url: b"https://mainnet-aggregator.hoh.zone/v1/blobs/7zi-F7J4B9JqsQ_PjfIpTUiK1NZywVXRiC00deTHZ2Q".to_string(),
        quality: b"epic".to_string(),
        effects: vec_map::empty<String, String>()
    }
}

public(package) fun generate_skill_props(points: u64, ctx: &mut TxContext): Props {
    let mut props = generate_empty_skill_props(ctx);
    props.effects.insert(b"points".to_string(), points.to_string());
    props
}

public fun get_props_effect(props: &Props, key: String): String {
    props.effects[&key]
}

public fun get_props_type(props: &Props): String {
    props.props_type
}