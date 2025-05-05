import { isValidSuiAddress } from "@mysten/sui/utils";
import { networkConfig, suiClient } from "./index";
import { SuiObjectData, SuiObjectResponse, SuiParsedData } from "@mysten/sui/client";
import { SuiEncryptedVoteType, SuiResponseVotePool } from "@/types";



export type SuiReponseAllowlist = {
  id: { id: string },
  list: string[],
  name: string
}

type SuiResponseCap = {
  id: { id: string },
  allowlist_id: string,
}

export interface AllowlistWithCap {
  allowlist: SuiReponseAllowlist,
  capId: string
}

type VotePoolCreatedEvent = {
  creator: string,
  vote_pool: string
}


//TODO:加上cursor和翻页？
export const getVotePoolState = async (): Promise<VotePoolCreatedEvent[]> => {
  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: `${networkConfig.testnet.variables.packageID}::shadowvote::VotePoolCreated`,
    }
  });


  const events_woal = await suiClient.queryEvents({
    query: {
      MoveEventType: `${networkConfig.testnet.variables.packageID}::votepool_wo_al::VotePoolCreated`,
    }
  });

  const rawVotepools = [...events.data, ...events_woal.data];


  const votePoolState = rawVotepools.map((event) => {
    const parsedEvent = event.parsedJson as VotePoolCreatedEvent;
    return parsedEvent;
  });

  return votePoolState;
}


export const getMultiVotePools = async (vote_ids: string[]): Promise<SuiResponseVotePool[]> => {
  const rawData = await suiClient.multiGetObjects({
    ids: vote_ids,
    options: {
      showContent: true,
    },
  });

  const votePools = rawData.map((obj) => {
    const parsedVotePool = obj.data?.content as SuiParsedData;
    if (!('fields' in parsedVotePool) || !parsedVotePool) {
      throw new Error("Invalid vote pool data structure");
    }
    return parsedVotePool.fields as SuiResponseVotePool;
  });

  return votePools;

}

export const getAllowlists = async (owner: string) => {
  if (!isValidSuiAddress(owner)) {
    throw new Error("Invalid Sui address");
  }

  // load all caps
  const res = await suiClient.getOwnedObjects({
    owner,
    options: {
      showContent: true,
      showType: true,
    },
    filter: {
      StructType: `${networkConfig.testnet.variables.packageID}::allowlist::Cap`,
    },
  });

  //Store caps with their corresponding allowlist IDs
  const capsMap: Record<string, string> = {};

  // find the allowlist id
  const allowlistIds = res.data
    .map((obj) => {
      const objData = obj.data as SuiObjectData;
      const content = objData.content as SuiParsedData;
      if (content.dataType == "moveObject") {
        const fields = content.fields as SuiResponseCap;
        if (fields && ('allowlist_id' in fields)) {
          capsMap[fields.allowlist_id] = objData.objectId;
          return fields.allowlist_id;
        }
      }
    })
    .filter((id): id is string => id !== undefined);


  const rawAllowlist = await suiClient.multiGetObjects({
    ids: allowlistIds,
    options: {
      showContent: true,
    },
  });

  const allowlistsWithCapPromise = rawAllowlist.map(async (obj) => {
    const parsedAllowlist = obj.data?.content as SuiParsedData;

    if (!('fields' in parsedAllowlist) || !parsedAllowlist) {
      throw new Error("Invalid allowlist data structure");
    }
    const allowlist = parsedAllowlist.fields as SuiReponseAllowlist;

    const allowlistId = allowlist.id.id;
    const capId = capsMap[allowlistId];

    if (!capId) {
      throw new Error(`Cap not found for allowlist ${allowlistId}`);
    }

    const allowlistWithCap: AllowlistWithCap = {
      allowlist,
      capId
    };

    return allowlistWithCap;
  });

  const allowlistsWithCap = await Promise.all(allowlistsWithCapPromise);

  return allowlistsWithCap;

}

//用不上咧，先放着
export const getOwnedVotePool = async (address: string): Promise<SuiResponseVotePool[]> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  try {
    let cursor: string | null | undefined = null;
    let hasNextPage = true;
    let allObjects: SuiObjectResponse[] = [];

    while (hasNextPage) {
      const response = await suiClient.getOwnedObjects({
        owner: address,
        cursor,
        options: {
          showContent: true
        },
        filter: {
          StructType: `${networkConfig.testnet.variables.packageID}::shadowvote::VotePool`
        }
      });

      allObjects = allObjects.concat(response.data);
      hasNextPage = response.hasNextPage;
      cursor = response.nextCursor ?? null;
    }

    const votePoolsData = allObjects.map((obj) => {
      const parsedVotePool = obj.data?.content as SuiParsedData;
      if (!('fields' in parsedVotePool) || !parsedVotePool) {
        throw new Error("Invalid vote pool data structure");
      }
      return parsedVotePool.fields as SuiResponseVotePool;
    });

    return votePoolsData;
  } catch (error) {
    console.error("Error fetching vote pool:", error);
    throw error;
  }


}

export const getVotePoolById = async (voetId: string): Promise<[SuiResponseVotePool, boolean]> => {
  if (!isValidSuiAddress(voetId)) {
    throw new Error("Invalid Sui address");
  }

  const rawVotePoolData = await suiClient.getObject({
    id: voetId,
    options: {
      showContent: true,
      showType: true,
    }
  });

  const parsedVotePool = rawVotePoolData.data?.content as SuiParsedData;
  if (!('fields' in parsedVotePool) || !parsedVotePool) {
    throw new Error("Invalid vote pool data structure");
  }

  let is_allowlist: boolean = true;
  if (parsedVotePool.type.includes("::votepool_wo_al::VotePool_WOAl"))
    is_allowlist = false;

  return [parsedVotePool.fields as SuiResponseVotePool, is_allowlist];
}

export const queryState = async () => {
  const state = await suiClient.getObject({
    id: networkConfig.testnet.variables.stateID,
    options: {
      showContent: true
    }
  })

  return state;
}



export const queryVoteBox = async (voteBoxId: string): Promise<SuiEncryptedVoteType[]> => {
  const voteBox = await suiClient.getObject({
    id: voteBoxId,
    options: {
      showContent: true
    }
  })

  const parsedVoteBox = voteBox.data?.content as SuiParsedData;
  if (!('fields' in parsedVoteBox) || !parsedVoteBox || parsedVoteBox.dataType !== "moveObject") {
    throw new Error("Invalid vote box data structure");
  }

  const voteBoxDataFields = (parsedVoteBox.fields as unknown) as {
    id: { id: string },
    creator: string,
    votes: { fields: { voter: string, vote: Uint8Array } }[]
  };

  if (!voteBoxDataFields.votes || !Array.isArray(voteBoxDataFields.votes)) {
    throw new Error("Invalid vote box data structure");
  }

  const voteboxData = voteBoxDataFields.votes.map((vote) => {
    const parsedVote = vote.fields;
    const encryptedVote: SuiEncryptedVoteType = {
      voter: parsedVote.voter,
      vote: parsedVote.vote,
    }
    return encryptedVote;
  })

  return voteboxData;
}

export const findObjectTypeName = async (objectId: string) => {
  const objData = await suiClient.getObject({
    id: objectId,
    options: {
      showType: true,
      showContent: true
    }
  })

  const parsedObj = objData.data?.content as SuiParsedData;
  if (!(parsedObj.dataType == "moveObject") || !parsedObj) {
    throw new Error("Invalid object data structure");
  }

  return parsedObj.type;
}


