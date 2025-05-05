import { NewTokenOptions } from "./helper";
import { generateSvgBase64 } from "./svghelper";

export const buildMoveCode = (options: NewTokenOptions) => {
  if (
    !options.base64Icon ||
    options.base64Icon == "" ||
    options.base64Icon == null
  ) {
    options.base64Icon = generateSvgBase64(options.symbol);
  }
  const name = options.name.toLowerCase();
  const nameUpper = name.toUpperCase();

  const newTokenMoveCode = `

// this is auto generated code to create a new token

module ${name}::${name};
use sui::coin::{Self, TreasuryCap, Coin, CoinMetadata};
use buzzing::buzzing::{Self, Market};
use sui::balance::{Self, Balance};
use sui::url::{Self};

const E_ABORT:u64 = 0;

public struct AdminCap has key {
    id: UID,
}

public struct ${nameUpper} has drop {}

public struct CoinValt has key,store {
    id: UID,
    tokens: Balance<${nameUpper}>,
}

fun init(witness: ${nameUpper}, ctx: &mut TxContext) {
  let sender = ctx.sender();
  let (mut treasury, metadata) = coin::create_currency(
      witness,
      ${options.decimals},
      // name
      b"${options.symbol}",
      // symbol
      b"${options.symbol}",
      // description
      b"Buzzing CTF Token ${options.symbol}",
      // icon url 
      option::some(url::new_unsafe_from_bytes(b"${options.base64Icon}")),
      ctx,
	);
	
  let admin_cap = AdminCap {
      id: object::new(ctx),
  };

  transfer::transfer(admin_cap, sender);

  mint_once(&mut treasury, ${options.initialSupply}, sender, ctx);
  transfer::public_freeze_object(metadata);
	transfer::public_transfer(treasury, sender);

  let coin_valt = CoinValt {
    id: object::new(ctx),
    tokens: balance::zero(),
  };

  transfer::public_share_object(coin_valt);
}

fun mint_once(
    treasury_cap: &mut TreasuryCap<${nameUpper}>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
	let coin = coin::mint(treasury_cap, amount, ctx);
	transfer::public_transfer(coin, recipient)
}

public entry fun redeem_coin<StakeToken>(
  market: &mut Market<StakeToken>,
  metadata: &CoinMetadata<${nameUpper}>,
  coin: Coin<${nameUpper}>,
  valt: &mut CoinValt,
  ctx: &mut TxContext,
) {
  let meta_address = object::id_address(metadata);
  let partition = buzzing::buzzing_partion(market, meta_address);
  assert!(partition == 1, E_ABORT);

  let coin_amount = coin::value(&coin);

  let reward_coin = buzzing::get_reward_coin(market, coin_amount, ctx);
  transfer::public_transfer(reward_coin, ctx.sender());

  // should be destroyed
  let user_coin_balance = coin::into_balance(coin);
  valt.tokens.join(user_coin_balance);
}

`;
  return newTokenMoveCode;
};
