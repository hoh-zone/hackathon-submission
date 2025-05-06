import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Github, Heart, Lock } from "lucide-react"
import { cn } from "@/utils"

interface Project {
  id: string
  title: string
  description: string
  author: {
    name: string
    avatar: string
  }
  coverImage: string
  tags: string[]
  isPrivate: boolean
  likes: number
  views: number
  createdAt: string
  githubUrl?: string
}

interface ProjectCardProps {
  project: Project
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`}>
      <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
        <div className="relative aspect-video w-full overflow-hidden">
          <Image src={project.coverImage || "/placeholder.svg"} alt={project.title} fill className="object-cover" />
          {project.isPrivate && (
            <div className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-1 backdrop-blur-sm">
              <Lock className="h-4 w-4" />
            </div>
          )}
        </div>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold line-clamp-1">{project.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="px-2 py-0 text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="px-2 py-0 text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.author.avatar || "/placeholder.svg"} alt={project.author.name} />
              <AvatarFallback>{project.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{project.author.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              <span>{project.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{project.views}</span>
            </div>
            {project.githubUrl && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Github className="h-3 w-3" />
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
