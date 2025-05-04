// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// The core logic of the Satoshi Flip game.
/// Facilitates the creation of new games, the distribution of funds,
/// and the cancellation of games.
module game::play {
    use sui::coin::{Self, Coin};
    use sui::balance::Balance;
    use sui::sui::SUI;
    use sui::event::emit;
    use sui::dynamic_object_field::{Self as dof};
    use sui::random::{generate_u8, new_generator};


    // HouseData library
    use game::house_data::HouseData;
    use sui::random::Random;

    const BoardWidth:u8 = 4;
    const BoardHeight:u8 = 6;
    // Errors
    const EStakeTooLow: u64 = 0;
    const EStakeTooHigh: u64 = 1;
    const EInsufficientHouseBalance: u64 = 5;
    const EGameDoesNotExist: u64 = 6;
    const EOutOfBoard:u64=7;
    const ENotGamePlayer:u64=9;
    const EGameDiffcultyNotValid:u64=11;

    // Events

    /// Emitted when a new game has started.
    public struct ENewGame has copy, drop {
        game_id: ID,
        player: address,
        diffculty:u8,
        user_stake: u64, // 2x user_stake should always equal the total_stake
   
       }

    public struct EGameWin has copy, drop {
        game_id: ID,
        player: address,
        index:u8,
        random:u8,
    }

    public struct EGameLoss has copy, drop {
        game_id: ID,
        player: address,       
        index:u8,        random:u8,

    }

    // Represents a game and holds the acrued stake.
    // The guess field could have also been represented as a u8 or boolean, but we chose to use "H" and "T" strings for readability and safety.
    // Makes it easier for the user to assess if a selection they made on a DApp matches with the txn they are signing on their wallet.
    public struct Game has key, store {
        id: UID,
        total_stake: Balance<SUI>,
        diffculty: u8,
        player: address,
    }

    /// Function used to create a new game. The player must provide a guess and a Counter NFT.
    /// Stake is taken from the player's coin and added to the game's stake. The house's stake is also added to the game's stake.
    public fun start_game(diffculty: u8, coin: Coin<SUI>, house_data: &mut HouseData, ctx: &mut TxContext): ID {
        
        let (id,new_game) = internal_start_game(diffculty, coin, house_data, ctx);
        
        dof::add(house_data.borrow_mut(),id,new_game);
        id
    }


    public entry fun step(game_id: ID,index:u8, house_data: &mut HouseData, r: &Random, ctx:&mut TxContext){
        assert!(game_exists(house_data, game_id),EGameDoesNotExist);
        assert!(index < BoardWidth*BoardHeight,EOutOfBoard);
        let win:bool;
        let game: &mut Game  = borrow_mut_game(game_id, house_data);

        assert!(game.player == ctx.sender(),ENotGamePlayer);

        let mut generator = new_generator(r, ctx);
        let random = generator.generate_u8();
        if(game.diffculty==1){ // 1/2
            win = random < 127;
        }else if(game.diffculty==2){ // 1/3
            win = random < 85;
        }else if(game.diffculty==3){ // 1/4
            win = random < 64;

        }else {
            win=false;
        };
        
        // 游戏结束
        finishGame(game_id, house_data, win, index,random,ctx);
    }
    fun finishGame(game_id: ID, house_data: &mut HouseData,win:bool,index:u8,random:u8,ctx:&mut TxContext){
        let Game {
            id,
            total_stake,
            player,
            diffculty:_,
        } = dof::remove<ID, Game>(house_data.borrow_mut(), game_id);
        object::delete(id);
        if(win) {
            transfer::public_transfer(total_stake.into_coin(ctx), player);
            emit(EGameWin{
                game_id: game_id,
                player: player,
                index,
                random,
            })
        } else {
            house_data.borrow_balance_mut().join(total_stake);
            emit(EGameLoss{
                game_id: game_id,
                player:player,
                index,
                random,
            });
        }
   }
   
    /// Returns the player's address.
    public fun player(game: &Game): address {
        game.player
    }

    public fun game_exists(house_data: &HouseData, game_id:ID):bool{
        dof::exists_(house_data.borrow(), game_id)
    }
    /// Helper function to check that a game exists and return a reference to the game Object.
    /// Can be used in combination with any accessor to retrieve the desired game field.
    public fun borrow_game(game_id: ID, house_data: &HouseData): & Game {
        assert!(game_exists(house_data, game_id), EGameDoesNotExist);
        dof::borrow(house_data.borrow(), game_id)
    }

     public fun borrow_mut_game(game_id: ID, house_data: &mut HouseData): &mut Game {
        assert!(game_exists(house_data, game_id), EGameDoesNotExist);
        dof::borrow_mut(house_data.borrow_mut(), game_id)
    }

    // --------------- Internal Helper functions ---------------

    /// Internal helper function used to create a new game.
    /// The player must provide a guess and a Counter NFT.
    /// Stake is taken from the player's coin and added to the game's stake.
    /// The house's stake is also added to the game's stake.
    fun internal_start_game(diffculty: u8, coin: Coin<SUI>, house_data: &mut HouseData, ctx: &mut TxContext): (ID, Game) {
        
        let user_stake = coin.value();
        assert!(diffculty==1||diffculty==2||diffculty==3, EGameDiffcultyNotValid);

        // Ensure that the stake is not higher than the max stake.
        assert!(user_stake <= house_data.max_stake(), EStakeTooHigh);
        // Ensure that the stake is not lower than the min stake.
        assert!(user_stake >= house_data.min_stake(), EStakeTooLow);
        // Ensure that the house has enough balance to play for this game.
        assert!(house_data.balance() >= user_stake, EInsufficientHouseBalance);

       
        let mut total_stake = house_data.borrow_balance_mut().split(user_stake);
        coin::put(&mut total_stake,coin);
        
        let id = object::new(ctx);
        let game_id = id.to_inner();

        let new_game = Game {
            id,
            total_stake,
            diffculty,
            player: ctx.sender(),
        };

        emit(ENewGame {
            game_id,
            player: ctx.sender(),
            diffculty,
            user_stake,
        });

        (game_id, new_game)
    }
   
}

