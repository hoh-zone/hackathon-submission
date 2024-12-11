module contract::member {
  use std::string::{String, utf8};
  use sui::url::{Url, new_unsafe};

  // 会员信息结构体
  public struct Member has store, copy {
    nickname: String,
    description: String,
    sex: String,
    avatar: String,
    index: u64,
  }

  // 会员nft结构体
  public struct MemberNft has key {
    id: UID,
    point: u8, // 积分
    name: String,
    nickname: String,
    description: String,
    sex: String,
    avatar: String,
    url: Url,
    index: u64,
  }

  public(package) fun get_member_struct (
    nickname: String,
    description: String,
    sex: String,
    avatar: String,
    index: u64,
  ): Member {
    Member {
      nickname,
      description,
      sex,
      avatar,
      index,
    }
  }

  // 会员专属nft
  public(package) fun create_member_nft (
    nickname: String,
    description: String,
    sex: String,
    avatar: String,
    index: u64,
    ctx: &mut TxContext
  ) {
    let mut name = utf8(b"SUI-HAI-MEMBER");
    name.append(nickname);
    name.append(utf8(b"#"));
    name.append(index.to_string());

    let nft = MemberNft {
      id: object::new(ctx),
      point: 0,
      name,
      nickname: nickname,
      description: description,
      sex: sex,
      avatar: avatar,
      url: new_unsafe(avatar.to_ascii()),
      index: index,
    };
    transfer::transfer(nft, tx_context::sender(ctx));
  }

  // 删除会员
  public entry fun delete_memeber_nft (
    nft: MemberNft,
    _: &mut TxContext 
  ) {
    let MemberNft {
      id,
      point: _,
      name: _,
      nickname: _,
      description: _,
      sex: _,
      avatar: _,
      url: _,
      index: _,
    } = nft;
    object::delete(id);
  }

  // 增加积分
  public(package) fun add_point (
    member: &mut MemberNft,
    point: u8,
  ) {
    member.point = member.point + point;
  }
}
