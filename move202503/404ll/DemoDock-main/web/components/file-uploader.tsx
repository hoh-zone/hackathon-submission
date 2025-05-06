"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, X } from "lucide-react"

interface FileUploaderProps {
  accept?: string
  maxFiles?: number
}

export function FileUploader({ accept = "*", maxFiles = 5 }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const totalFiles = [...files, ...newFiles]

      if (totalFiles.length <= maxFiles) {
        setFiles(totalFiles)
      }

      // Reset input
      e.target.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const simulateUpload = () => {
    setUploading(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="rounded-full bg-muted p-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Drag files here or click to upload</p>
            <p className="text-xs text-muted-foreground">Upload up to {maxFiles} files (max 100MB each)</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
            Select Files
          </Button>
          <input id="file-upload" type="file" accept={accept} multiple className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium line-clamp-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>

          {uploading ? (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">Uploading... {progress}%</p>
            </div>
          ) : (
            <Button onClick={simulateUpload} className="w-full">
              Upload to Walrus
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
