'use client'

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { CreateServerGroupRequest } from "@/lib/server-group-types"
import { useCreateServerGroup } from "@/hooks/mutations/use-server-mutations"
import { serverQueryUtils } from "@/hooks/queries/use-servers"

const formSchema = z.object({
  name: z.string().min(1, "服务器组名称不能为空").max(255, "服务器组名称不能超过255个字符"),
})

type FormData = z.infer<typeof formSchema>

interface CreateServerGroupDialogProps {
  onServerGroupCreated: () => void
}

export function CreateServerGroupDialog({ onServerGroupCreated }: CreateServerGroupDialogProps) {
  const [open, setOpen] = useState(false)
  
  // 使用 React Query mutation
  const createServerGroupMutation = useCreateServerGroup({
    onSuccess: (data) => {
      if (data.code === 0) {
        form.reset()
        setOpen(false)
        onServerGroupCreated()
      }
    }
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleSubmit = async (data: FormData) => {
    // 验证表单数据
    const validationErrors = serverQueryUtils.validateServerGroupConfig(data)
    if (validationErrors.length > 0) {
      alert(`表单验证失败：\n${validationErrors.join('\n')}`)
      return
    }

    const createData: CreateServerGroupRequest = {
      name: data.name.trim(),
    }

    // 使用 mutation 创建服务器组
    createServerGroupMutation.mutate(createData)
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建服务器组
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建服务器组</DialogTitle>
          <DialogDescription>
            创建新的服务器组，完成后点击保存。
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
                disabled={createServerGroupMutation.isPending}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={createServerGroupMutation.isPending} 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createServerGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}