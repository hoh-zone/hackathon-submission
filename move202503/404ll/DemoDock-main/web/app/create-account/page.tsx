"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, User } from "lucide-react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import {
  createProfile,
  getProfileByUser,
} from "@/contracts/query"

export default function CreateAccountPage() {
  const router = useRouter()
  const account = useCurrentAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { handleSignAndExecuteTransaction: createProfileHandler } =
    useBetterSignAndExecuteTransaction({ tx: createProfile })

  const handleCreateProfile = async (name: string) => {
    if (!account?.address) {
      alert("Wallet not connected")
      return
    }

    setIsSubmitting(true)

    createProfileHandler({ name })
      .onSuccess(async (result) => {
        console.log("Profile created:", result)

        // 查询 Profile 是否写入链上
        const profile = await getProfileByUser(account.address)
        console.log("Fetched profile:", profile)

        setShowSuccess(true)

        // 自动跳转到主页或 Demo 创建页（可改）
        setTimeout(() => {
          router.push("/explore")
        }, 3000)
      })
      .onError((err) => {
        console.error("Create profile failed:", err)
        alert("Profile creation failed. Please try again.")
      })
      .execute()
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Set up your profile to start sharing projects on DemoDock</CardDescription>
        </CardHeader>

        {showSuccess ? (
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Account Created!</AlertTitle>
              <AlertDescription>
                Your account has been created successfully. Redirecting to home page...
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const username = formData.get("username") as string
              handleCreateProfile(username)
            }}
          >
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
