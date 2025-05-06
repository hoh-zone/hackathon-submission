'use client'

import { ConnectButton } from '@mysten/dapp-kit'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import { useRouter } from "next/navigation"
import { ArrowRight, Database, Key, Lock, Ship, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// 导入查询函数
import { getProfileByUser } from '@/contracts/query'
import { CategorizedObjects } from '@/utils/assetsHelpers'
// 定义 FeatureCard 组件接口
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// 添加 FeatureCard 组件定义
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
      {icon}
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-center text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Home() {
  const account = useCurrentAccount();
  const [userObjects, setUserObjects] = useState<CategorizedObjects | null>(null);
  const router = useRouter()
  const [hasAccount, setHasAccount] = useState(false)
  const [isCheckingAccount, setIsCheckingAccount] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  // 检查用户账户状态
  useEffect(() => {
    async function checkUserProfile() {
      if (!account?.address) return;
      
      setIsCheckingAccount(true);
      
      try {
        // 实际查询区块链，检查用户是否有 Profile
        const profile = await getProfileByUser(account.address);
        const accountExists = !!profile;
        
        console.log("Profile check:", accountExists ? "Found profile" : "No profile found");
        setHasAccount(accountExists);
      } catch (error) {
        console.error("Error checking profile:", error);
        setHasAccount(false);
      } finally {
        setIsCheckingAccount(false);
      }
    }
    
    checkUserProfile();
  }, [account?.address, router]);

  // 处理"开始使用"按钮点击
  const handleGetStarted = async () => {
    if (!account) {
      // 显示连接钱包弹窗
      setShowConnectDialog(true);
      return;
    }
    
    // 如果正在检查账户状态，显示加载中
    if (isCheckingAccount) {
      return; // 可以添加加载指示器
    }
    
    // 重新检查用户账户状态（以防状态未更新）
    try {
      const profile = await getProfileByUser(account.address);
      const accountExists = !!profile;
      
      if (accountExists) {
        router.push("/explore");
      } else {
        router.push("/create-account");
      }
    } catch (error) {
      console.error("Error in handleGetStarted:", error);
      // 如果查询失败，假设用户没有账户
      router.push("/create-account");
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Where Projects Dock, and Ideas Rock
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A decentralized platform for Web3 developers to showcase and share their demo projects with secure
                  access control.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button 
                  onClick={handleGetStarted} 
                  size="lg" 
                  disabled={isCheckingAccount}
                >
                  {isCheckingAccount ? "Checking..." : "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* 右侧装饰区域保持不变 */}
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-[250px] w-[250px] md:h-[350px] md:w-[350px] items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-70 blur-3xl" />
                </div>
                <Ship className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 连接钱包弹窗 */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              请先连接您的钱包以继续使用DemoDock的功能。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <Wallet className="h-12 w-12 text-primary" />
            <ConnectButton />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

     {/* 特点部分 */}
     <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Built on Walrus distributed storage and Seal encryption for secure, decentralized project sharing
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            <FeatureCard
              icon={<Database className="h-12 w-12 text-primary" />}
              title="Decentralized Storage"
              description="Store your demos on Walrus distributed storage for permanent availability"
            />
            <FeatureCard
              icon={<Lock className="h-12 w-12 text-primary" />}
              title="Access Control"
              description="Set permissions and control who can access your project demos"
            />
            <FeatureCard
              icon={<Key className="h-12 w-12 text-primary" />}
              title="On-chain Verification"
              description="All access requests and approvals are recorded on-chain for transparency"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
