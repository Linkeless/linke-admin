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
import { Switch } from "@/components/ui/switch"
import { Edit, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { subscriptionService } from "@/lib/subscription-service"
import { 
  UpdateSubscriptionRequest,
  UserSubscription,
} from "@/lib/subscription-types"
import { useUpdateUserSubscription } from "@/hooks/mutations/use-subscription-mutations"

const formSchema = z.object({
  end_date: z.string().optional(),
  auto_renew: z.boolean(),
  cancel_at_period_end: z.boolean(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditUserSubscriptionDialogProps {
  subscription: UserSubscription
  onSubscriptionUpdated: () => void
}

export function EditUserSubscriptionDialog({ subscription, onSubscriptionUpdated }: EditUserSubscriptionDialogProps) {
  const [open, setOpen] = useState(false)
  
  const updateSubscriptionMutation = useUpdateUserSubscription({
    onSuccess: () => {
      setOpen(false)
      onSubscriptionUpdated()
    },
    onError: (error) => {
      console.error('更新用户订阅失败:', error)
    }
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      end_date: subscription.end_date ? subscription.end_date.split('T')[0] : "",
      auto_renew: subscription.auto_renew,
      cancel_at_period_end: subscription.cancel_at_period_end,
      notes: "",
    },
  })

  const handleSubmit = async (data: FormData) => {
    const updateData: UpdateSubscriptionRequest = {
      end_date: data.end_date || undefined,
      auto_renew: data.auto_renew,
      cancel_at_period_end: data.cancel_at_period_end,
      notes: data.notes || undefined,
    }

    console.log('更新用户订阅数据:', updateData)
    updateSubscriptionMutation.mutate({ id: subscription.id, data: updateData })
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
          <DialogTitle>编辑用户订阅</DialogTitle>
          <DialogDescription>
            修改订阅设置，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            {/* 结束日期 */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>结束日期</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 自动续费 */}
            <FormField
              control={form.control}
              name="auto_renew"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">自动续费</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 周期结束时取消 */}
            <FormField
              control={form.control}
              name="cancel_at_period_end"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">周期结束时取消</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 备注 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Input placeholder="可选的备注信息" {...field} />
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
                disabled={updateSubscriptionMutation.isPending}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={updateSubscriptionMutation.isPending} 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updateSubscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}