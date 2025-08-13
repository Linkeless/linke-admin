'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CreateReferralCampaignRequest, ReferralCampaignResponse, CAMPAIGN_TYPES, REWARD_TYPES } from '../../types'

const formSchema = z.object({
  name: z.string().min(1, '活动名称不能为空').max(100, '活动名称不能超过100个字符'),
  code: z.string().min(1, '活动代码不能为空').max(50, '活动代码不能超过50个字符'),
  description: z.string().optional(),
  campaign_type: z.enum(['seasonal', 'evergreen', 'limited', 'special'], {
    required_error: '请选择活动类型',
  }),
  
  // 时间设置
  starts_at: z.date().optional(),
  ends_at: z.date().optional(),
  
  // 推荐人奖励设置
  referrer_reward_type: z.enum(['fixed', 'percentage', 'tiered'], {
    required_error: '请选择奖励类型',
  }),
  referrer_reward_amount: z.number().min(0, '奖励金额必须大于等于0'),
  referrer_reward_currency: z.string().min(1, '请输入奖励货币'),
  referrer_reward_cap: z.number().optional(),
  
  // 被推荐人奖励设置
  referee_reward_type: z.enum(['fixed', 'percentage', 'discount']).optional(),
  referee_reward_amount: z.number().optional(),
  referee_reward_currency: z.string().optional(),
  
  // 限制设置
  max_referrals: z.number().optional(),
  min_referrals: z.number().optional(),
  requires_approval: z.boolean().default(false),
})

type FormData = z.infer<typeof formSchema>

interface CampaignFormProps {
  campaign?: ReferralCampaignResponse
  onSubmit: (data: CreateReferralCampaignRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function CampaignForm({ campaign, onSubmit, onCancel, loading = false }: CampaignFormProps) {
  const [hasRefereeReward, setHasRefereeReward] = useState(false)
  const [hasTimeLimit, setHasTimeLimit] = useState(false)
  const [hasReferralLimit, setHasReferralLimit] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: campaign?.name || '',
      code: campaign?.code || '',
      description: campaign?.description || '',
      campaign_type: campaign?.campaign_type || 'evergreen',
      referrer_reward_type: campaign?.referrer_reward_type || 'fixed',
      referrer_reward_amount: campaign?.referrer_reward_amount || 0,
      referrer_reward_currency: campaign?.referrer_reward_currency || 'CNY',
      referrer_reward_cap: campaign?.referrer_reward_cap,
      referee_reward_type: campaign?.referee_reward_type,
      referee_reward_amount: campaign?.referee_reward_amount,
      referee_reward_currency: campaign?.referee_reward_currency || 'CNY',
      max_referrals: campaign?.max_referrals,
      min_referrals: campaign?.min_referrals,
      requires_approval: campaign?.requires_approval || false,
    },
  })

  const handleSubmit = async (data: FormData) => {
    const submitData: CreateReferralCampaignRequest = {
      ...data,
      starts_at: data.starts_at?.toISOString(),
      ends_at: data.ends_at?.toISOString(),
    }
    
    await onSubmit(submitData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>设置推荐活动的基本信息和类型</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="输入活动名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动代码 *</FormLabel>
                    <FormControl>
                      <Input placeholder="输入活动代码" {...field} />
                    </FormControl>
                    <FormDescription>用于推荐链接的唯一标识符</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="输入活动描述（可选）" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="campaign_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动类型 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择活动类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 时间设置 */}
        <Card>
          <CardHeader>
            <CardTitle>时间设置</CardTitle>
            <CardDescription>设置活动的开始和结束时间（可选）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={hasTimeLimit}
                onCheckedChange={setHasTimeLimit}
              />
              <label className="text-sm font-medium">设置活动时间限制</label>
            </div>
            
            {hasTimeLimit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>开始时间</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: zhCN })
                              ) : (
                                <span>选择开始时间</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>结束时间</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: zhCN })
                              ) : (
                                <span>选择结束时间</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 推荐人奖励设置 */}
        <Card>
          <CardHeader>
            <CardTitle>推荐人奖励</CardTitle>
            <CardDescription>设置推荐人成功推荐后获得的奖励</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="referrer_reward_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>奖励类型 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择奖励类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REWARD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="referrer_reward_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>奖励金额 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="referrer_reward_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>货币类型 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择货币" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                        <SelectItem value="USD">美元 (USD)</SelectItem>
                        <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="referrer_reward_cap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>奖励上限</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="无限制" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormDescription>单个推荐人的总奖励上限</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 被推荐人奖励设置 */}
        <Card>
          <CardHeader>
            <CardTitle>被推荐人奖励</CardTitle>
            <CardDescription>设置被推荐人注册或购买后获得的奖励（可选）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={hasRefereeReward}
                onCheckedChange={setHasRefereeReward}
              />
              <label className="text-sm font-medium">为被推荐人设置奖励</label>
            </div>
            
            {hasRefereeReward && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="referee_reward_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>奖励类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择奖励类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">固定金额</SelectItem>
                          <SelectItem value="percentage">百分比折扣</SelectItem>
                          <SelectItem value="discount">固定折扣</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referee_reward_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>奖励金额</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="referee_reward_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>货币类型</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择货币" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                            <SelectItem value="USD">美元 (USD)</SelectItem>
                            <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 限制设置 */}
        <Card>
          <CardHeader>
            <CardTitle>限制设置</CardTitle>
            <CardDescription>设置推荐活动的各种限制条件（可选）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={hasReferralLimit}
                onCheckedChange={setHasReferralLimit}
              />
              <label className="text-sm font-medium">设置推荐数量限制</label>
            </div>
            
            {hasReferralLimit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_referrals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最小推荐数</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>达到最小数量才能获得奖励</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="max_referrals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最大推荐数</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="无限制" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>每个推荐人的最大推荐数量</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <Separator />
            
            <FormField
              control={form.control}
              name="requires_approval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">需要审核</FormLabel>
                    <FormDescription>
                      推荐记录需要管理员审核后才能获得奖励
                    </FormDescription>
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
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : campaign ? '更新活动' : '创建活动'}
          </Button>
        </div>
      </form>
    </Form>
  )
}