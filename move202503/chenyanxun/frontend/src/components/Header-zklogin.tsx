"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

import Link from "next/link";
import { defaultNetwork, suiClient } from "@/app/networkconfig";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateRandomness,
  generateNonce,
  jwtToAddress,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  genAddressSeed,
} from "@mysten/sui/zklogin";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  ZKLOGIN_KEYPAIR,
  ZKLOGIN_MAX_EPOCH,
  ZKLOGIN_PROOF,
  ZKLOGIN_RANDOMNESS,
  ZKLOGIN_TOKEN,
} from "@/constant/zklogin";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Transaction } from "@mysten/sui/transactions";
import axios from "axios";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { toast } from "sonner";
export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;
function Header() {
  // 临时密钥对
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
  // maxEpoch 期限
  const [maxEpoch, setMaxEpoch] = useState(0);
  // 随机数
  const [randomness, setRandomness] = useState("");
  // Google id_token
  const [idToken, setIdToken] = useState<string>("");
  // 解码后的jwt Google 信息
  const [decodedJwt, setDecodedJwt] = useState<JwtPayload>();
  // const [jwtString, setJwtString] = useState("");
  // salt 用于生成address zkProof
  const [userSalt, setUserSalt] = useState<string | bigint>("");
  // 是否新用户
  const [isNewUser, setIsNewUser] = useState(false);
  // 用户地址
  const [address, setAddress] = useState<string | null>(null);
  // zkProof 用于签名交易
  const [zkProof, setZkProof] = useState<PartialZkLoginSignature>();
  // 是否登录
  const [isLogin, setIsLogin] = useState(false);
  // 获取当前地址的sui余额
  const [suiBalance, setSuiBalance] = useState(0);
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
    setEphemeralKeyPair(ephemeralKeyPair);
    // 获取最新的 epoch 和 maxEpoch
    const { epoch } = await suiClient.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + 10;
    localStorage.setItem(ZKLOGIN_MAX_EPOCH, maxEpoch.toString());
    setMaxEpoch(maxEpoch);
    // 生成随机种子
    const randomness = generateRandomness();
    localStorage.setItem(ZKLOGIN_RANDOMNESS, randomness);
    setRandomness(randomness);
    // 生成 zklogin nonce
    const nonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );
    // google账户 登录
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "id_token",
      scope: "openid",
      nonce: nonce,
    });
    const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    window.location.replace(loginURL);
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
        const decodedJwt = jwtDecode(idToken) as JwtPayload;
        setDecodedJwt(decodedJwt);
        // 解码sub, 从数据库获取salt
        if (decodedJwt?.sub) {
          // 查询接口
          const res = await fetch(`/api/query/user/${decodedJwt.sub}`);
          const data = await res.json();
          console.log("data===", data);
          if (data?.status === 200 && data?.user.salt) {
            // 有结果，说明是注册过的用户
            const salt = data.user.salt;
            setUserSalt(salt);
            setIsNewUser(false);
          } else {
            // 没有结果，说明是新用户
            const salt = "0x" + (decodedJwt.sub ?? "").slice(0, 16);
            setUserSalt(salt);
            setIsNewUser(true);
          }
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
      setMaxEpoch(maxEpoch ? Number(maxEpoch) : 0);
      const randomness = localStorage.getItem(ZKLOGIN_RANDOMNESS);
      setRandomness(randomness || "");
      if (idToken && privateKey && maxEpoch && randomness) {
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(privateKey);
        setEphemeralKeyPair(ephemeralKeyPair);
        const zkLoginUserAddress = jwtToAddress(idToken, userSalt);
        setAddress(zkLoginUserAddress);
        console.log("zkLoginUserAddress===", zkLoginUserAddress);
        // zk proof
        const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
          ephemeralKeyPair.getPublicKey()
        );
        const zkProofResult = await axios.post(
          ZKLOGIN_PROOF[defaultNetwork],
          {
            jwt: idToken,
            extendedEphemeralPublicKey: extendedEphemeralPublicKey,
            maxEpoch: maxEpoch,
            jwtRandomness: randomness,
            salt: userSalt,
            keyClaimName: "sub",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setZkProof(zkProofResult.data as PartialZkLoginSignature);
        console.log("zkProofResult===", zkProofResult);
        if (zkProofResult.data?.proofPoints) {
          setIsLogin(true);
          toast.success("zkLogin success!", {
            style: { backgroundColor: "green", color: "white" },
            position: "top-center",
          });
          // 发送请求到后端，注册用户
          if (isNewUser) {
            fetch("/api/signup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                wallet: decodedJwt?.sub,
                salt: userSalt,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.status === 200) {
                  toast.success("User created successfully!", {
                    style: { backgroundColor: "green", color: "white" },
                    position: "top-center",
                  });
                } else {
                  // toast.error("User already exists!");
                }
              })
              .catch((error) => {
                console.error("Error creating user:", error);
                toast.error("Error creating user!", {
                  style: { backgroundColor: "red", color: "white" },
                  position: "top-center",
                });
              });
          }
        } else {
          setIsLogin(false);
          toast.error("Error zkProof!", {
            style: { backgroundColor: "red", color: "white" },
            position: "top-center",
          });
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
          const balance = Number((Number(res.totalBalance) / 1e9).toFixed(4));
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
  };

  const txHandle = async () => {
    console.log("zkLoginUserAddress==", address);
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [MIST_PER_SUI * 1n]);
    tx.transferObjects(
      [coin],
      "0xb262a0b348483ae2e8b42bbb1ed52841eadf9e3cb67240be125b16987550874b"
    );

    tx.setSender(address as string);
    const { bytes, signature: userSignature } = await tx.sign({
      client: suiClient,
      signer: ephemeralKeyPair as any,
    });

    const addressSeed: string = genAddressSeed(
      BigInt(userSalt),
      "sub",
      (decodedJwt as JwtPayload).sub || "",
      typeof decodedJwt?.aud === "string"
        ? decodedJwt.aud
        : decodedJwt?.aud?.[0] ?? ""
    ).toString();

    const zkLoginSignature: any = getZkLoginSignature({
      inputs: {
        proofPoints: zkProof?.proofPoints || { a: [], b: [[]], c: [] },
        issBase64Details: zkProof?.issBase64Details || { iss: "", details: "" },
        headerBase64: zkProof?.headerBase64 || "",
        addressSeed,
      },
      maxEpoch,
      userSignature,
    });
    const executeRes = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: zkLoginSignature,
    });
    console.log("executeRes===", executeRes);
  };

  return (
    <header className="border-b border-gray-300 flex justify-between items-center h-20">
      <Link href="/">
        <div className="text-xl font-bold">My Application</div>
      </Link>
      {isLogin ? (
        <div className="flex items-center gap-4">
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

export default Header;
