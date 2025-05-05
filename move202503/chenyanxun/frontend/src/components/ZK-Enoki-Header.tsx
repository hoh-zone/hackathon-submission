"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

import Link from "next/link";
import { defaultNetwork, suiClient } from "@/app/networkconfig";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  getExtendedEphemeralPublicKey,
} from "@mysten/sui/zklogin";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  ZKLOGIN_AUTH,
  ZKLOGIN_KEYPAIR,
  ZKLOGIN_MAX_EPOCH,
  ZKLOGIN_PROOF,
  ZKLOGIN_RANDOMNESS,
  ZKLOGIN_TOKEN,
  ZKLOGIN_ZKP,
} from "@/constant/zklogin";
import axios from "axios";
import { toast } from "sonner";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

export default function ZK_Enoki_Header() {
  const router = useRouter();
  // ephemeralKeyPair 临时密钥对
  // maxEpoch 期限
  // randomness 随机数
  // id_token Google Jwt
  const [idToken, setIdToken] = useState<string>("");
  // salt 用于生成address zkProof
  const [userSalt, setUserSalt] = useState<string | bigint>("");
  // 用户地址
  const [address, setAddress] = useState<string | null>(null);
  // zkProof 用于签名交易
  // 是否登录
  const [isLogin, setIsLogin] = useState(false);
  // 获取当前地址的sui余额
  const [suiBalance, setSuiBalance] = useState(0);
  const { successToast, errorToast } = useToast();
  /**
   * * zklogin handle
   * @description zklogin handle
   */
  const zkloginHandle = async () => {
    // 生成临时密钥对
    const ephemeralKeyPair = new Ed25519Keypair();
    localStorage.setItem(
      ZKLOGIN_KEYPAIR,
      ephemeralKeyPair.getSecretKey().toString()
    );
    // setEphemeralKeyPair(ephemeralKeyPair);
    const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      ephemeralKeyPair.getPublicKey()
    );
    const ZKNonce = await axios.post(
      ZKLOGIN_PROOF[defaultNetwork] + "/zklogin/nonce",
      {
        network: defaultNetwork,
        ephemeralPublicKey: extendedEphemeralPublicKey,
        additionalEpochs: 2,
      },
      {
        headers: {
          Authorization: "Bearer " + ZKLOGIN_AUTH,
        },
      }
    );
    console.log("====getZKNonce", ZKNonce);
    if (ZKNonce.status === 200) {
      const result = ZKNonce.data.data;
      localStorage.setItem("nonce", result.nonce);
      localStorage.setItem(ZKLOGIN_MAX_EPOCH, result.maxEpoch);
      // setMaxEpoch(result.maxEpoch);
      localStorage.setItem(ZKLOGIN_RANDOMNESS, result.randomness);
      // setRandomness(result.randomness);
      // google账户 登录
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "id_token",
        scope: "openid",
        nonce: result.nonce,
      });
      const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      window.location.replace(loginURL);
    } else {
      errorToast("error in get nonce");
    }
  };
  // 获取id_token
  useEffect(() => {
    // 获取 URL 中的哈希部分（即 # 后的部分）
    const hash = window.location.hash.substring(1);
    if (hash && hash.includes("id_token")) {
      // 提取 id_token 的值
      const id_token = hash
        ?.split("&")
        .find((param) => param.startsWith("id_token"))
        ?.split("=")[1];
      // 将 id_token 存储到 localStorage
      localStorage.setItem(ZKLOGIN_TOKEN, id_token || "");
      setIdToken(id_token || "");
    } else {
      const id_token = localStorage.getItem(ZKLOGIN_TOKEN);
      setIdToken(id_token || "");
    }
  }, []);
  // 根据id_token查询或生成salt
  useEffect(() => {
    if (idToken) {
      findSalt();
      async function findSalt() {
        const ZKUser = await axios.get(
          ZKLOGIN_PROOF[defaultNetwork] + "/zklogin",
          {
            headers: {
              "zklogin-jwt": idToken,
              Authorization: "Bearer " + ZKLOGIN_AUTH,
            },
          }
        );
        console.log("====ZKUser", ZKUser);
        if (ZKUser.status === 200) {
          const result = ZKUser.data.data;
          setUserSalt(result.salt);
          localStorage.setItem("salt", result.salt);
          setAddress(result.address);
          localStorage.setItem("address", result.address);
        } else {
          errorToast("error in get salt and address");
        }
      }
    }
  }, [idToken]);

  useEffect(() => {
    try {
      zkProofHandle();
    } catch (error) {
      setIsLogin(false);
      console.error("zkProofHandle error:", error);
    }
    // 验证当前是否在登录状态
    async function zkProofHandle() {
      const privateKey = localStorage.getItem(ZKLOGIN_KEYPAIR);
      const maxEpoch = localStorage.getItem(ZKLOGIN_MAX_EPOCH);
      // setMaxEpoch(maxEpoch ? Number(maxEpoch) : 0);
      const randomness = localStorage.getItem(ZKLOGIN_RANDOMNESS);
      // setRandomness(randomness || "");
      if (idToken && privateKey && maxEpoch && randomness) {
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(privateKey);
        // setEphemeralKeyPair(ephemeralKeyPair);
        // zk proof
        const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
          ephemeralKeyPair.getPublicKey()
        );
        const zkProofResult = await axios.post(
          ZKLOGIN_PROOF[defaultNetwork] + "/zklogin/zkp",
          {
            network: defaultNetwork,
            ephemeralPublicKey: extendedEphemeralPublicKey,
            maxEpoch: Number(maxEpoch),
            randomness: randomness,
          },
          {
            headers: {
              "zklogin-jwt": idToken,
              Authorization: "Bearer " + ZKLOGIN_AUTH,
            },
          }
        );
        console.log("zkProofResult===", zkProofResult);
        if (zkProofResult.status === 200) {
          const result = zkProofResult.data.data;
          setIsLogin(true);
          successToast("zkLogin success!");
          localStorage.setItem(ZKLOGIN_ZKP, JSON.stringify(result));
        } else {
          setIsLogin(false);
          errorToast("Error zkProof!");
        }
      }
    }
  }, [userSalt]);
  // 登录后获取当前地址的sui余额
  useEffect(() => {
    if (isLogin && address) {
      suiClient
        .getBalance({ owner: address })
        .then((res) => {
          const balance = Number(Number(res.totalBalance) / 1e9);
          setSuiBalance(balance);
        })
        .catch((error) => {
          console.error("Error fetching balance:", error);
        });
    }
  }, [isLogin]);
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        toast.success("Address copied to clipboard!", {
          style: { backgroundColor: "green", color: "white" },
          position: "top-center",
        });
      });
    }
  };
  const disConnect = () => {
    setIsLogin(false);
    setIdToken("");
    localStorage.removeItem(ZKLOGIN_TOKEN);
    localStorage.removeItem(ZKLOGIN_ZKP);
    router.push(`/`);
  };

  return (
    <header className="border-b border-gray-300 flex justify-between items-center h-20">
      <Link href="/">
        <div className="text-xl font-bold">My Application</div>
      </Link>
      {isLogin ? (
        <div className="flex items-center gap-4">
          <Link href="/home">
            <Button variant="default" className="cursor-pointer">
              My Space
            </Button>
          </Link>
          <Button
            variant="default"
            className="cursor-pointer"
            onClick={copyAddress}
          >
            {address ? `${address.slice(0, 5)}...${address.slice(-4)}` : ""}
          </Button>
          <span>Balance: {suiBalance} SUI</span>
          <span className="cursor-pointer" onClick={disConnect}>
            Disconnect
          </span>
        </div>
      ) : (
        <Button
          variant="default"
          className="cursor-pointer"
          onClick={zkloginHandle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Login with Google
        </Button>
      )}
    </header>
  );
}
