import { isValidSuiAddress } from "@mysten/sui/utils";
import { SuiObjectResponse, SuiParsedData } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { suiClient ,networkConfig,createBetterTxFactory,createBetterDevInspect} from "./index";
import { useSuiClient } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";

import { Demo, DemoPool, Profile, ProfileCreated, State } from "@/types";

export   const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;

export const getEncryptedObject=async(id:string,arrayBuffer:ArrayBuffer)=>{
  const packageId =networkConfig.testnet.variables.Package;
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });
  const { encryptedObject } = await sealClient.encrypt({
    threshold: 2,
    packageId,
    id,
    data: new Uint8Array(arrayBuffer),
  });

  return encryptedObject;
}

//query DemoPool
export const getDemoPool = async () => {
  const events = await suiClient.queryEvents({
    query:{
      MoveEventType: `${networkConfig.testnet.variables.Package}::demo::DemoCreated`,
    }
  });
  const pool: DemoPool = {
    id: networkConfig.testnet.variables.DemoPool,
    demos:[]
  }
  events.data.map((event) => {
    const eventContent = event.parsedJson as ProfileCreated;
    pool.demos.push(eventContent);
  });
  return pool;
}


//query demo
export const getdemoByid = async(demo_id:string)=>{
  if (!isValidSuiAddress(demo_id)) {
    throw new Error("Invalid Sui address");
  }
  const DemoContent = await suiClient.getObject({
    id: demo_id,
    options: {
      showContent: true,
    },
  });
  if (!DemoContent) {
    throw new Error("Demo not found");
  }
  const demoParseData = DemoContent.data?.content as SuiParsedData;
  if(!('fields' in demoParseData)){
    throw new Error("Demo not found");
  }
  const demo = demoParseData.fields as unknown as Demo;
  if(!demo) {
    throw new Error("Demo not found");
  }
  return demo;
}

//query all Demos
export const getAllDemo = async () => {
  const pool = await getDemoPool();
  const demoPromises = pool.demos.map(async (oneDemo)=>{
    const demo = getdemoByid(oneDemo.id);
    return demo
  })
  const demos = await Promise.all(demoPromises);
  return demos;
};

//query State
export const getState = async () => {
  const events = await suiClient.queryEvents({
    query:{
      MoveEventType: `${networkConfig.testnet.variables.Package}::profile::ProfileCreated`,
    }
  });
  const state : State = {
    id: networkConfig.testnet.variables.State,
    profiles: [],
  }
  events.data.map((event) => {
    const eventContent = event.parsedJson as ProfileCreated;
    state.profiles.push(eventContent);
  });
  return state;
}


//query all Profiles
export const getAllProfile = async () => {
  const state = await getState();
  const profilePromises = state.profiles.map(async (oneProfile) => {
    const profile = await getProfile(oneProfile.id);
    return profile;
  });

  const profiles = await Promise.all(profilePromises);
  return profiles;
};


//获取当前用户的所有Demo
export const getUserDemo = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  const profile = await getProfileByUser(address);
  const demoPromises = profile.demos.map(async (oneDemo) => {
    const demo = await getdemoByid(oneDemo);
    return demo;
  });
  const demos = await Promise.all(demoPromises);
  return demos;
};



///Profile

//通过Profile_id的获取Profile
export const getProfile = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  const profileContent = await suiClient.getObject({
    id: address,
    options: {
      showContent: true,
    },
  });
  if (!profileContent) {
    throw new Error("Profile not found");
  }
  const profileParseData = profileContent.data?.content as SuiParsedData;
  if(!('fields' in profileParseData)){
    throw new Error("Profile not found");
  }
  const profile = profileParseData.fields as unknown as Profile;
  if(!profile) {
    throw new Error("Profile not found");
  }
  return profile;
};


//通过用户地址获得Profile
export const getProfileByUser = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  
  const profile = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${networkConfig.testnet.variables.Package}::profile::Profile`,
    },
    options: {
      showContent: true,
    },
  });

  // 处理没有找到 Profile 的情况
  if (!profile.data || profile.data.length === 0) {
    throw new Error("No profile found for this address");
  }

  // 直接获取第一个对象（因为确定只有一个）
  const profileObj = profile.data[0];
  
  // 确保有内容
  if (!profileObj.data?.content || !("fields" in profileObj.data.content)) {
    throw new Error("Invalid profile data structure");
  }

  // 提取并返回 Profile 数据
  const profileContent = profileObj.data.content;
  const profileData = profileContent.fields as unknown as Profile;
  
  return profileData
}


//通过demo获取capId
export const getCapByDemoId = async (address: string,id: string) => {
      const res = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${networkConfig.testnet.variables.Package}::demo::Cap`,
        },
      });
      
      console.log("CapId",res.data);
      const capId = res.data
      .map((obj) => {
        const fields = (obj!.data!.content as { fields: any }).fields;
        return {
          id: fields?.id.id,
          demo_id: fields?.demo_id,
        };
      })
      .filter((item) => item.demo_id === id)
      .map((item) => item.id) as string[];
      console.log("CapId",capId);
      return capId[0];

};


//public fun create_profile(name: String, state: &mut State, ctx: &mut TxContext) {
//   let profile = Profile {
//     id: object::new(ctx),
//     name: name,
//     demos: vector::empty(),
// };

// let profile_id = profile.id.to_inner();
// let owner = ctx.sender();
// assert!(!table::contains(&state.profiles, owner), ERROR_PROFILE_EXISTS);
// table::add(&mut state.profiles, owner, profile_id);

// emit(ProfileCreated {
//     id: profile_id,
//     name: profile.name,
// });

// transfer::transfer(profile, ctx.sender());
// }

export const createProfile = createBetterTxFactory<{ name: string;}>((tx, networkVariables, { name }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "profile",
    function: "create_profile",
    arguments: [tx.pure.string(name), tx.object(networkVariables.State)]
});
  return tx;
});


///Admin Functions

// public fun add_admin(
//   _super_admin: &SuperAdminCap,
//   admin_list: &mut AdminList,
//   account: address,
// ) {
//   admin_list.admin.insert(account);
// }

export const addAdmin = createBetterTxFactory<{account: string;}>((tx, networkVariables, { account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "admin",
    function: "add_admin",
    arguments: [tx.object(networkVariables.AdminList), tx.pure.address(account)]
});
  return tx;
});

// public fun remove_admin(
//   _super_admin: &SuperAdminCap,
//   admin_list: &mut AdminList,
//   account: address,
// ) {
//   admin_list.admin.remove(&account);
// }

export const removeAdmin = createBetterTxFactory<{account: string;}>((tx, networkVariables, { account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "admin",
    function: "remove_admin",
    arguments: [tx.object(networkVariables.AdminList), tx.pure.address(account)]
});
  return tx;
});

///Demo Functions

// entry fun create_demo_entry(
//   name: String,
//   des: String,
//   pool: &mut DemoPool,
//   profile: &mut Profile,
//   ctx: &mut TxContext,
// ) {
//   transfer::transfer(create_demo(name, des, pool, profile, ctx), ctx.sender());
// }

export const createDemo = createBetterTxFactory<{ name: string; des: string,profile:string;}>((tx, networkVariables, { name, des,profile }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "create_demo_entry",
    arguments: [tx.pure.string(name), tx.pure.string(des), tx.object(networkVariables.DemoPool), tx.object(profile)]
});
  return tx;
});

// public fun publish(demo: &mut Demo, cap: &Cap, blob_id: String) {
//   assert!(cap.demo_id == object::id(demo), EInvalidCap);
//   df::add(&mut demo.id, blob_id, MARKER);
// }

export const publishDemo = createBetterTxFactory<{ demo: string; cap: string; blob_id: string;}>((tx, networkVariables, { demo, cap, blob_id }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "publish",
    arguments: [tx.object(demo), tx.object(cap), tx.pure.string(blob_id)]
});
  return tx;
});

// public fun add_visitor_by_user(demo: &mut Demo, cap: &Cap, account: address) {
//   assert!(cap.demo_id == object::id(demo), EInvalidCap);
//   assert!(!demo.visitor_list.contains(&account), EDuplicate);
//   demo.visitor_list.push_back(account);
// }
export const addVisitorByUser = createBetterTxFactory<{ demo: string; cap: string;account:string;}>((tx, networkVariables, { demo, cap,account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "add_visitor_by_user",
    arguments: [tx.object(demo), tx.object(cap), tx.pure.address(account)]
});
  return tx;
});

// public fun remove_visitor_by_user(demo: &mut Demo, cap: &Cap, account: address) {
//   assert!(cap.demo_id == object::id(demo), EInvalidCap);
//   demo.visitor_list = demo.visitor_list.filter!(|x| x != account);
// }
export const removeVisitorByUser = createBetterTxFactory<{ demo: string; cap: string; account: string; }>((tx, networkVariables, { demo, cap, account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "remove_visitor_by_user",
    arguments: [tx.object(demo), tx.object(cap), tx.pure.address(account)]
});
  return tx;
});

// public fun request_demo(demo: &mut Demo, des: String, ctx: &mut TxContext) {
//   let visitor = ctx.sender();
//   assert!(!demo.visitor_list.contains(&visitor), ERROR_PROFILE_EXISTS);
//   emit(DemoRequest {
//       des: des,
//       demo_id: demo.id.to_inner(),
//       visitor: visitor,
//   });
// }
export const requestDemo = createBetterTxFactory<{ demo: string; des: string;}>((tx, networkVariables, { demo, des }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "request_demo",
    arguments: [tx.object(demo), tx.pure.string(des)]
});
  return tx;
});

// public fun approve_internal(
//   caller: address,
//   demo: &Demo,
//   id: vector<u8>,
//   adminlist: &AdminList,
// ): bool {
//   let namespace = namespace(demo);
//   if (!is_prefix(namespace, id)) {
//       return false
//   };
//   let admin_list = get_admin_addresses(adminlist);
//   if (admin_list.contains(&caller)) {
//       return true
//   } else {
//       demo.visitor_list.contains(&caller)
//   }
// }
export const approveInternal = createBetterTxFactory<{ caller: string; demo: string; id: string;}>((tx, networkVariables, { caller, demo, id}) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "approve_internal",
    arguments: [tx.pure.address(caller), tx.object(demo), tx.pure.string(id), tx.object(networkVariables.AdminList)]
});
  return tx;
});

// public fun get_profile_by_addresss(state: &State, ctx: &TxContext): Option<ID> {
//   let address = ctx.sender();
//   if (table::contains(&state.profiles, address)) {
//       let profile_id = table::borrow(&state.profiles, address);
//       option::some(*profile_id)
//   } else {
//       option::none()
//   }
// }

export const getProfileByAddress = createBetterDevInspect<{ state: string; }, string | null>(
  (tx, networkVariables, { state }) => {
    tx.moveCall({
      package: networkVariables.Package,
      module: "profile",
      function: "get_profile_by_addresss",
      arguments: [tx.object(state)]
    });
    return tx;
  },
  (res) => {
    // 解析返回结果
    if (res.effects.status.status === "success") {
      const returnValues = res?.results?.[0]?.returnValues;
      if (returnValues && returnValues.length > 0) {
        // 检查是否有返回值，并且是否为 Option<ID> 类型
        const optionValue = returnValues[0];
        if (optionValue && typeof optionValue === 'object' && 'Some' in optionValue) {
          return optionValue.Some as string;
        }
      }
    }
    return null;
  }
);