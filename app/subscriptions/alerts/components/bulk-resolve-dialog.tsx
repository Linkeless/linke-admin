"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle } from "lucide-react"

interface BulkResolveDialogProps {
  selectedCount: number
  alertIds: number[]
  onResolve: (alertIds: number[], note?: string) => Promise<void>
}

export function BulkResolveDialog({ 
  selectedCount, 
  alertIds, 
  onResolve 
}: BulkResolveDialogProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (alertIds.length === 0) return

    setIsSubmitting(true)
    try {
      await onResolve(alertIds, note.trim() || undefined)
      setOpen(false)
      setNote("")
    } catch (error) {
      console.error('批量解决告警失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={selectedCount === 0}>
          <CheckCircle className="mr-2 h-4 w-4" />
          批量解决 ({selectedCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>批量解决告警</DialogTitle>
          <DialogDescription>
            您将解决 {selectedCount} 个告警。此操作不可撤销，请确认是否继续。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="resolution-note">
              解决说明 (可选)
            </Label>
            <Textarea
              id="resolution-note"
              placeholder="请输入解决这些告警的说明..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "处理中..." : "确认解决"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}