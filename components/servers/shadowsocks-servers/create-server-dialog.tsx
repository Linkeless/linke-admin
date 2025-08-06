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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { shadowsocksServerService } from "@/lib/shadowsocks-service"
import { 
  CreateShadowsocksServerRequest, 
  CIPHER_OPTIONS, 
  OBFS_OPTIONS,
  convertBooleanToShow
} from "@/lib/shadowsocks-types"

const formSchema = z.object({
  name: z.string().min(1, "服务器名称不能为空").max(255, "服务器名称不能超过255个字符"),
  host: z.string().min(1, "主机地址不能为空").max(255, "主机地址不能超过255个字符"),
  server_port: z.number().min(1, "端口必须大于0").max(65535, "端口不能超过65535"),
  port: z.number().min(1, "端口必须大于0").max(65535, "端口不能超过65535"),
  cipher: z.string().min(1, "请选择加密方式").max(255, "加密方式不能超过255个字符"),
  group_id: z.number().min(1, "请选择服务器组"),
  rate: z.number().min(0.1, "倍率必须大于等于0.1"),
  sort: z.number().optional(),
  parent_id: z.number().optional(),
  route_id: z.string().max(255, "路由ID不能超过255个字符").optional(),
  tags: z.string().max(255, "标签不能超过255个字符").optional(),
  obfs: z.string().max(11, "混淆方式不能超过11个字符").optional(),
  obfs_settings: z.string().max(255, "混淆设置不能超过255个字符").optional(),
  ips: z.string().max(255, "IP范围不能超过255个字符").optional(),
  excludes: z.string().optional(),
  is_show: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface CreateServerDialogProps {
  onServerCreated: () => void
}

export function CreateServerDialog({ onServerCreated }: CreateServerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      host: "",
      server_port: 443,
      port: 443,
      cipher: "aes-256-gcm",
      group_id: 1,
      rate: 1.0,
      sort: 0,
      parent_id: 0,
      route_id: "",
      tags: "",
      obfs: "none",
      obfs_settings: "",
      ips: "",
      excludes: "",
      is_show: true,
    },
  })

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      
      // 验证表单数据
      const validationErrors = shadowsocksServerService.validateServerConfig(data)
      if (validationErrors.length > 0) {
        alert(`表单验证失败：\n${validationErrors.join('\n')}`)
        return
      }

      const createData: CreateShadowsocksServerRequest = {
        name: data.name,
        host: data.host,
        server_port: data.server_port,
        port: data.port,
        cipher: data.cipher,
        group_id: data.group_id,
        rate: data.rate,
        sort: data.sort,
        parent_id: data.parent_id === 0 ? undefined : data.parent_id,
        route_id: data.route_id || undefined,
        tags: data.tags || undefined,
        obfs: data.obfs === 'none' ? undefined : data.obfs,
        obfs_settings: data.obfs_settings || undefined,
        ips: data.ips || undefined,
        excludes: data.excludes || undefined,
        show: convertBooleanToShow(data.is_show),
      }

      const response = await shadowsocksServerService.createServer(createData)
      
      if (response.code === 0) {
        form.reset()
        setOpen(false)
        onServerCreated()
      } else {
        throw new Error(response.message || '创建失败')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`创建服务器失败: ${errorMessage}`)
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建服务器
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建 Shadowsocks 服务器</DialogTitle>
          <DialogDescription>
            创建新的服务器配置，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            {/* 服务器名称 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服务器名称</FormLabel>
                  <FormControl>
                    <Input placeholder="美国节点01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 主机地址 */}
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主机地址</FormLabel>
                  <FormControl>
                    <Input placeholder="us01.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 服务器端口 */}
            <FormField
              control={form.control}
              name="server_port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服务器端口</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="443" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 端口 */}
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>端口</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="443" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 服务器组 */}
            <FormField
              control={form.control}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服务器组</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 倍率 */}
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>倍率</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      min="0.1"
                      placeholder="1.0" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 加密方式 */}
            <FormField
              control={form.control}
              name="cipher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>加密方式</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择加密方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CIPHER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 混淆方式 */}
            <FormField
              control={form.control}
              name="obfs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>混淆方式</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择混淆方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OBFS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 排序值 */}
            <FormField
              control={form.control}
              name="sort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序值</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 父服务器ID */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>父服务器ID</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0表示无父服务器" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value ? parseInt(value) || 0 : 0)
                      }}
                      value={field.value === 0 ? '' : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 标签 */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <Input placeholder="premium,fast,stable" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 显示服务器 */}
            <FormField
              control={form.control}
              name="is_show"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">显示服务器</FormLabel>
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