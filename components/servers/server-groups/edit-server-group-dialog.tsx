'use client'

import { useState, useEffect } from "react"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Edit, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { serverGroupService } from "@/lib/server-group-service"
import { ServerGroupResponse, UpdateServerGroupRequest } from "@/lib/server-group-types"

const formSchema = z.object({
  name: z.string().min(1, "服务器组名称不能为空").max(255, "服务器组名称不能超过255个字符"),
})

type FormData = z.infer<typeof formSchema>

interface EditServerGroupDialogProps {
  serverGroup: ServerGroupResponse
  onServerGroupUpdated: () => void
}

export function EditServerGroupDialog({ serverGroup, onServerGroupUpdated }: EditServerGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: serverGroup.name,
    },
  })

  // 当服务器组数据变化时重置表单
  useEffect(() => {
    form.reset({
      name: serverGroup.name,
    })
  }, [serverGroup, form])

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      
      // 验证表单数据
      const validationErrors = serverGroupService.validateServerGroupConfig(data)
      if (validationErrors.length > 0) {
        alert(`表单验证失败：\n${validationErrors.join('\n')}`)
        return
      }

      const updateData: UpdateServerGroupRequest = {
        name: data.name.trim(),
      }

      console.log('更新服务器组数据:', updateData)
      const response = await serverGroupService.updateServerGroup(serverGroup.id, updateData)
      
      if (response.code === 0) {
        console.log('服务器组更新成功:', response.data)
        setOpen(false)
        onServerGroupUpdated()
      } else {
        throw new Error(response.message || '更新失败')
      }
    } catch (error: unknown) {
      console.error('更新服务器组失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`更新服务器组失败: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFormAction = async (formData: FormData) => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmit(values)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑服务器组</DialogTitle>
          <DialogDescription>
            修改服务器组信息，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            {/* 服务器组名称 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服务器组名称</FormLabel>
                  <FormControl>
                    <Input placeholder="亚太地区" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}