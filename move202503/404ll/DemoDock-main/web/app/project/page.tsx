"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Download,
  Eye,
  FileText,
  Github,
  Heart,
  Key,
  Lock,
  Share,
  Shield,
  Unlock,
  Video,
} from "lucide-react"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { mockProjects } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

export default function ProjectPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 获取用户项目
  useEffect(() => {
    if (!account) {
      // 如果没有连接钱包，重定向到首页
      router.push('/');
      return;
    }

    // 模拟从区块链获取用户项目
    // 实际应用中应该调用合约方法获取用户项目
    const fetchUserProjects = () => {
      setIsLoading(true);
      // 模拟API调用延迟
      setTimeout(() => {
        // 假设用户拥有的项目是mockProjects中的前两个
        const projects = mockProjects.slice(0, 2);
        setUserProjects(projects);
        
        if (projects.length > 0) {
          setSelectedProject(projects[0]);
          setHasAccess(!projects[0].isPrivate);
        }
        
        setIsLoading(false);
      }, 1000);
    };

    fetchUserProjects();
  }, [account, router]);

  const handleRequestAccess = () => {
    setIsRequesting(true);
    // 模拟请求过程
    setTimeout(() => {
      setIsRequesting(false);
      setAccessRequested(true);
    }, 2000);
  };

  // 如果正在加载或没有选中的项目，显示加载状态
  if (isLoading || !selectedProject) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">正在加载您的项目...</h2>
          <p className="text-muted-foreground">请稍候，我们正在从区块链获取您的项目数据</p>
        </div>
      </div>
    );
  }

  // 如果没有项目，显示创建项目提示
  if (userProjects.length === 0) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">您还没有创建任何项目</h2>
          <p className="text-muted-foreground mb-6">开始创建您的第一个项目，展示您的创意</p>
          <Button asChild>
            <Link href="/create">创建新项目</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回探索页面
          </Link>
        </Button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{selectedProject.title}</h1>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedProject.author.avatar || "/placeholder.svg"} alt={selectedProject.author.name} />
                    <AvatarFallback>{selectedProject.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{selectedProject.author.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                点赞
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">{selectedProject.likes}</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share className="h-4 w-4" />
                分享
              </Button>
              {selectedProject.githubUrl && (
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedProject.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src={selectedProject.coverImage || "/placeholder.svg"} alt={selectedProject.title} fill className="object-cover" />
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">关于此项目</h2>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                  <p className="mt-4 text-muted-foreground">
                    这是您创建的项目详情页面。您可以在这里查看和管理项目内容，包括文件、演示和演示文稿。
                  </p>
                </CardContent>
              </Card>

              {hasAccess ? (
                <Card>
                  <CardContent className="p-6">
                    <Tabs defaultValue="files">
                      <TabsList className="mb-4">
                        <TabsTrigger value="files">文件</TabsTrigger>
                        <TabsTrigger value="demo">演示</TabsTrigger>
                        <TabsTrigger value="presentation">演示文稿</TabsTrigger>
                      </TabsList>
                      <TabsContent value="files" className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">项目源代码</p>
                              <p className="text-xs text-muted-foreground">ZIP - 2.4 MB</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="gap-2">
                            <Download className="h-4 w-4" />
                            下载
                          </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">文档</p>
                              <p className="text-xs text-muted-foreground">PDF - 1.2 MB</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="gap-2">
                            <Download className="h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="demo">
                        <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <p className="ml-2 text-muted-foreground">演示视频将在此处播放</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="presentation">
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <p className="ml-2 text-muted-foreground">演示文稿将在此处显示</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">此内容已加密</h3>
                    <p className="text-muted-foreground">
                      您需要向项目所有者请求访问权限才能查看完整内容
                    </p>
                    {accessRequested ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>已请求访问</AlertTitle>
                        <AlertDescription>
                          您的请求已发送给项目所有者。授予访问权限后，您将收到通知。
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button onClick={handleRequestAccess} disabled={isRequesting} className="gap-2">
                        {isRequesting ? (
                          <>请求中...</>
                        ) : (
                          <>
                            <Key className="h-4 w-4" />
                            请求访问
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">访问信息</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">访问类型</span>
                      </div>
                      <Badge variant={selectedProject.isPrivate ? "outline" : "secondary"}>
                        {selectedProject.isPrivate ? "私有" : "公开"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">浏览量</span>
                      </div>
                      <span className="text-sm">{selectedProject.views}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">访问方式</span>
                      </div>
                      <span className="text-sm">手动批准</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">您的其他项目</h3>
                  <div className="space-y-4">
                    {userProjects
                      .filter((p) => p.id !== selectedProject.id)
                      .map((project) => (
                        <Link
                          key={project.id}
                          href={`/project?id=${project.id}`}
                          className="flex gap-3 rounded-lg hover:bg-muted p-2 transition-colors"
                        >
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={project.coverImage || "/placeholder.svg"}
                              alt={project.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium line-clamp-1">{project.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                          </div>
                        </Link>
                      ))}
                    
                    {userProjects.length === 1 && (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground mb-2">您目前只有一个项目</p>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/create">创建新项目</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
