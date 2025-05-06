'use client'
import React, { use, useEffect } from "react";
import {
  createProfile,
  getProfileByUser,
  createDemo,
  addVisitorByUser,
  removeVisitorByUser,
  getAllDemo,
  getAllProfile,
  getUserDemo,
  publishDemo,
  getCapByDemoId
} from "@/contracts/query"; 
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx';
import { ConnectButton, useCurrentAccount} from "@mysten/dapp-kit";
import { useState } from 'react'
import { Profile } from "@/types";

export default function TestSuiPage() {
  const account = useCurrentAccount();
  const [currentProfile, setCurrentProfile] = useState<Profile | undefined>(undefined);
  const {handleSignAndExecuteTransaction:createProfileHandler} = useBetterSignAndExecuteTransaction({tx:createProfile});
  const {handleSignAndExecuteTransaction:createDemoHandler} = useBetterSignAndExecuteTransaction({tx:createDemo});
  const {handleSignAndExecuteTransaction:publishWalrusHandler} = useBetterSignAndExecuteTransaction({tx:publishDemo});
  const {handleSignAndExecuteTransaction:addVisitorByUserHandler} = useBetterSignAndExecuteTransaction({tx:addVisitorByUser});
  const {handleSignAndExecuteTransaction:removeVisitorByUserHandler} = useBetterSignAndExecuteTransaction({tx:removeVisitorByUser});

  //测试通过
  const handleCreateProfile = async () => {
    createProfileHandler({ name: "Test" })
      .onSuccess(async (result) => {
        console.log("Profile created successfully:", result);
        
        // 等待交易确认并获取新创建的 Profile
        if (account?.address) {
          // 显示加载状态
          alert("Profile creating, please wait...");
          
          // 等待一会儿让区块链更新
          setTimeout(async () => {
            try {
              // 主动获取最新 Profile
              const profile = await getProfileByUser(account.address);
              setCurrentProfile(profile);
              console.log("Profile now available:", profile);
              alert("Profile ready! Now you can create a Demo.");
            } catch (error) {
              console.error("Error fetching profile after creation:", error);
            }
          }, 2000); // 等待2秒
        }
      })
      .execute();
  };

  const handleCreateDemo = async () => {
    if (!account?.address) return alert("Connect wallet first");
    console.log("Click create demo");
    if (!currentProfile) {
      console.error("No profile found");
      return;
    }
    createDemoHandler({
      name: "TestDemo",
      des: "A sample demo entry",
      profile: currentProfile?.id.id 
    }).onSuccess(async (result) => {
        console.log("Demo created successfully:", result);
        }).execute();
  };

   const publishHandler = async () => {
    if(!currentProfile) {
      console.error("No profile found");
      return;
    }
    const cap = await getCapByDemoId(account?.address ?? "0x0","0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526");
    publishWalrusHandler({
      demo: "0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526",
      cap: cap,
      blob_id: "1245785135478",
    }).onSuccess(async (result) => {
        console.log("Demo added to profile successfully:", result);
        }
      ).execute();
  };

  const handleAddVisitor = async () => {
    const cap = await getCapByDemoId(account?.address ?? "0x0","0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526");
    addVisitorByUserHandler({
      demo: "0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526",
      cap: cap,
      account:"0x9222bc4b61099ced2ab5719c6528567ff75dafbfa3cddf9e2078e5c733dd3294"
    }).onSuccess(async (result) => {
        console.log("Visitor added successfully:", result);
      }
    ).execute();
  };

  const handleRemoveVisitor = async () => {
    const cap = await getCapByDemoId(account?.address ?? "0x0","0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526");
    removeVisitorByUserHandler({
      demo: "0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526",
      cap: cap,
      account:"0x9222bc4b61099ced2ab5719c6528567ff75dafbfa3cddf9e2078e5c733dd3294"
    }).onSuccess(async (result) => {
        console.log("Visitor removed successfully:", result);
      }
    ).execute();
    
  };


  const handleQueryAllDemos = async () => {
    const demos = await getAllDemo();
    console.log("All Demos:", demos);
  };


  //测试通过
  const handleQueryAllProfiles = async () => {
    const profiles = await getAllProfile();
    console.log("All Profiles:", profiles);
  };

  const handleQueryUserDemos = async () => {
    if (!account?.address) return alert("Connect wallet first");
    const demos = await getUserDemo(account.address);
    console.log("User's Demos:", demos);
  };

  const handleQueryProfile = async () => {
    if (!account?.address) {
      console.error("Account address is undefined");
      return;
    }
    const profile = await getProfileByUser(account.address);
    setCurrentProfile(profile);
    console.log("Profile:", profile);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!account?.address) return;
      try {
        const profile = await getProfileByUser(account.address);
        setCurrentProfile(profile);
        console.log("Profile loaded automatically:", profile);
      } catch (error) {
        console.error("Failed to load profile automatically:", error);
      }
    };
    fetchProfile();
  }, [account?.address]); // 当账户地址变化时重新获取

  // 第二个 useEffect 负责打印更新后的数据
useEffect(() => {
    if (currentProfile) {
      console.log("Profile updated:", currentProfile);
    }
  }, [currentProfile]); // 依赖于 currentProfile

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">🧪 Sui Tx 测试页面</h1>

      <div className="grid grid-cols-2 gap-4">
        <ConnectButton className="col-span-2" />
        <button onClick={handleCreateProfile} className="btn">
           已经通过✅ Create Profile
        </button>
        <button onClick={handleCreateDemo} className="btn">
           已经通过✅  Create Demo
        </button>
        //上传到walrus的时候使用
        <button onClick={publishHandler} className="btn">
        已经通过✅ ➕ Add Demo to Profile
        </button> 

        <button onClick={handleAddVisitor} className="btn">
        已经通过✅ 👀 Add Visitor to Demo
        </button>
        <button onClick={handleRemoveVisitor} className="btn">
        已经通过✅ ❌ Remove Visitor from Demo
        </button>
        <button onClick={handleQueryAllDemos} className="btn">
        已经通过✅  Query All Demos
        </button>
        <button onClick={handleQueryAllProfiles} className="btn">
        已经通过✅ Query All Profiles
        </button>
        <button onClick={handleQueryUserDemos} className="btn">
        已经通过✅ Query My Demos
        </button>
        <button onClick={handleQueryProfile} className="btn">
        已经通过✅ Query Specific Profile
        </button>
        
      </div>
    </div>
  );
}
