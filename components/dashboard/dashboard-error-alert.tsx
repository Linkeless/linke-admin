'use client'

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button" 
import { AlertCircle } from "lucide-react"

interface DashboardErrorAlertProps {
  error: string | null
  onRetry: () => void
}

export function DashboardErrorAlert({ error, onRetry }: DashboardErrorAlertProps) {
  if (!error) return null

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {error}
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={onRetry}
        >
          重试
        </Button>
      </AlertDescription>
    </Alert>
  )
}