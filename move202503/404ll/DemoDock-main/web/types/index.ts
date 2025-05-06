// public struct Demo has key {
//     id: UID,
//     name: String,
//     des: String,
//     visitor_list: vector<address>,
// }
export interface Demo {
    id:{id:string};
    name:string;
    des:string;
    visitor_list:string[];
}

// public struct Profile has key {
//     id: UID,
//     name: String,
//     demos: vector<ID>,
// }
export interface Profile {
    id:{id:string};
    name:string;
    demos:string[];
}

export interface DisplayProfile {
    id:{id:string};
    name:string;
    demos:Demo[];
}

// public struct State has key {
//     id: UID,
//     profiles: Table<address, ID>,
// }

export interface State {
    id:string;
    profiles:ProfileCreated[];
}

// public struct ProfileCreated has copy, drop {
//     owner: address,
//     id: ID,
// }

export interface ProfileCreated {
    owner:string;
    id:string;
}

// public struct DemoCreated has copy, drop {
//     id: ID,
//     owner: address,
// }

export interface DemoCreated {
    id:string;
    owner:string;
}

// public struct DemoPool has key {
//     id: UID,
//     demos: Table<ID, address>,<demo_id,owner>
// }

export interface DemoPool {
    id:string;
    demos:DemoCreated[];
}

// public struct DemoRequest has copy, drop {
//     des: String,
//     demo_id: ID,
//     visitor: address,
// }
export interface DemoRequest {
    des:string;
    demo_id:string;
    visitor:string;
}
