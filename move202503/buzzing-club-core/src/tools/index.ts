import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { userPriaveKey } from "../config";
export const getSigner = () => {
  try {
    const signer = Ed25519Keypair.fromSecretKey(userPriaveKey);
    return signer;
  } catch (error) {
    const signer = Ed25519Keypair.deriveKeypair(userPriaveKey);
    return signer;
  }
};
