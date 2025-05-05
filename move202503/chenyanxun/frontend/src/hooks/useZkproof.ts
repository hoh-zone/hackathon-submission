import { suiClient } from "@/app/networkconfig";
import {
  ZKLOGIN_KEYPAIR,
  ZKLOGIN_MAX_EPOCH,
  ZKLOGIN_ZKP,
} from "@/constant/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { useToast } from "./useToast";
import { getZkLoginSignature } from "@mysten/sui/zklogin";

export function useZkproof() {
  const { errorToast } = useToast();
  const privateKey = localStorage.getItem(ZKLOGIN_KEYPAIR);
  const maxEpoch = localStorage.getItem(ZKLOGIN_MAX_EPOCH);
  const zkproof = localStorage.getItem(ZKLOGIN_ZKP)
    ? JSON.parse(localStorage.getItem(ZKLOGIN_ZKP) as string)
    : null;
  const zktx = async (tx: Transaction, account: string) => {
    if (!privateKey) {
      errorToast("Private key is missing or invalid.");
      return;
    }
    tx.setSender(account);
    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(privateKey);
    const { bytes, signature: userSignature } = await tx.sign({
      client: suiClient,
      signer: ephemeralKeyPair as Ed25519Keypair,
    });

    const zkLoginSignature: ReturnType<typeof getZkLoginSignature> =
      getZkLoginSignature({
        inputs: {
          proofPoints: zkproof!.proofPoints,
          issBase64Details: zkproof!.issBase64Details,
          headerBase64: zkproof!.headerBase64,
          addressSeed: zkproof!.addressSeed,
        },
        maxEpoch: maxEpoch!,
        userSignature,
      });
    const executeRes = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: zkLoginSignature,
    });
    if (executeRes.digest) {
      const result = await suiClient.waitForTransaction({
        digest: executeRes.digest,
        options: { showEffects: true },
      });
      if (result.effects?.status.status === "success") {
        return result;
      } else {
        errorToast("error in transactin");
      }
    }
  };
  return {
    zktx,
  };
}
