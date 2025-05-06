"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Ship, User } from "lucide-react"
import { cn } from "@/utils"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { ConnectButton } from '@mysten/dapp-kit'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const account = useCurrentAccount();
  const [hasAccount, setHasAccount] = useState(false)


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship className="h-6 w-6" />
          <Link href={account && hasAccount ? "/explore" : "/"} className="text-xl font-bold">
            DemoDock
          </Link>
        </div>

        {account && (
          <nav className="hidden md:flex gap-6">
            <Link
              href="/explore"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/explore" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Home
            </Link>
            <Link
              href="/project"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/projects" ? "text-primary" : "text-muted-foreground",
              )}
            >
              My Projects
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {account ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/create">Create</Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/project">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <ConnectButton />
            </>
          ) : (
            <ConnectButton />
          )}
        </div>
      </div>
    </header>
  )
}
