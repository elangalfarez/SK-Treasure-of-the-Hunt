"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, User } from "lucide-react"
import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  playerName?: string
  progress?: number
  showBack?: boolean
  onBack?: () => void
  action?: ReactNode  // <<--- added
}

export default function Header({
  title,
  playerName,
  progress,
  showBack,
  onBack,
  action, // <<--- include it here
}: HeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary to-onyx-gray border-b border-gold/20 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {showBack && onBack && (
            <Button
              onClick={onBack}
              size="sm"
              variant="ghost"
              className="text-gold hover:text-gold/80 hover:bg-gold/10 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-gold">{title}</h1>
        </div>

        {/* Right side: render action (if any) and playerName */}
        <div className="flex items-center space-x-3">
          {action && <div>{action}</div>}
          {playerName && (
            <div className="flex items-center space-x-2 text-text-light">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{playerName}</span>
            </div>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Progress Keseluruhan</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </div>
  )
}
