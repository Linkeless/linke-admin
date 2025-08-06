'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Save, TestTube } from 'lucide-react';
import { 
  AlertType, 
  AlertSeverity, 
  NotificationChannel, 
  UsageType, 
  AlertConfigFormData 
} from '@/lib/usage-types';
import { UsageService } from '@/lib/usage-service';
import { SubscriptionSelector } from '@/app/usage/components';

const formSchema = z.object({
  subscription_id: z.string().min(1, { message: "请选择订阅" }),
  usage_type: z.nativeEnum(UsageType, { message: "请选择使用量类型" }),
  threshold_percentage: z.number()
    .min(1, { message: "阈值必须大于0" })
    .max(100, { message: "阈值不能超过100" }),
  alert_type: z.nativeEnum(AlertType, { message: "请选择告警类型" }),
  severity: z.nativeEnum(AlertSeverity, { message: "请选择严重程度" }),
  notification_channels: z.array(z.nativeEnum(NotificationChannel))
    .min(1, { message: "请至少选择一个通知渠道" }),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface AlertConfigFormProps {
  initialData?: Partial<AlertConfigFormData>;
  onSubmit: (data: AlertConfigFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

// 使用量类型选项
const usageTypeOptions = [
  { value: UsageType.BANDWIDTH, label: '带宽' },
  { value: UsageType.STORAGE, label: '存储' },
  { value: UsageType.REQUESTS, label: '请求数' },
  { value: UsageType.CPU_TIME, label: 'CPU时间' },
  { value: UsageType.MEMORY, label: '内存' },
  { value: UsageType.CONNECTIONS, label: '连接数' },
  { value: UsageType.TRANSFER, label: '传输量' },
];

// 告警类型选项
const alertTypeOptions = [
  { value: AlertType.THRESHOLD, label: '阈值告警', description: '当使用量超过设定阈值时触发' },
  { value: AlertType.QUOTA_EXCEEDED, label: '配额超限', description: '当使用量超过配额时触发' },
  { value: AlertType.UNUSUAL_ACTIVITY, label: '异常活动', description: '检测到异常使用模式时触发' },
  { value: AlertType.PREDICTION, label: '预测告警', description: '基于趋势预测可能超限时触发' },
];

// 严重程度选项
const severityOptions = [
  { value: AlertSeverity.LOW, label: '低', color: 'bg-blue-100 text-blue-800' },
  { value: AlertSeverity.MEDIUM, label: '中', color: 'bg-yellow-100 text-yellow-800' },
  { value: AlertSeverity.HIGH, label: '高', color: 'bg-orange-100 text-orange-800' },
  { value: AlertSeverity.CRITICAL, label: '严重', color: 'bg-red-100 text-red-800' },
];

// 通知渠道选项
const notificationChannelOptions = [
  { value: NotificationChannel.EMAIL, label: '邮件通知', description: '发送邮件到用户邮箱' },
  { value: NotificationChannel.SMS, label: '短信通知', description: '发送短信到用户手机' },
  { value: NotificationChannel.WEBHOOK, label: 'Webhook', description: '发送HTTP请求到指定URL' },
  { value: NotificationChannel.IN_APP, label: '应用内通知', description: '在系统内显示通知' },
];

export default function AlertConfigForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false
}: AlertConfigFormProps) {
  const [testNotificationLoading, setTestNotificationLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subscription_id: initialData?.subscription_id || '',
      usage_type: initialData?.usage_type || UsageType.BANDWIDTH,
      threshold_percentage: initialData?.threshold_percentage || 80,
      alert_type: initialData?.alert_type || AlertType.THRESHOLD,
      severity: initialData?.severity || AlertSeverity.MEDIUM,
      notification_channels: initialData?.notification_channels || [NotificationChannel.EMAIL],
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleFormAction = async (formData: FormData) => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmit(values)
    }
  };

  const handleTestNotification = async () => {
    const formData = form.getValues();
    
    if (!formData.subscription_id || formData.notification_channels.length === 0) {
      return;
    }

    try {
      setTestNotificationLoading(true);
      
      // 测试每个选中的通知渠道
      for (const channel of formData.notification_channels) {
        await UsageService.testNotification({
          channel,
          recipient: 'test@example.com', // 这里应该从订阅信息中获取
          message: `这是一条测试告警通知。告警类型: ${formData.alert_type}，阈值: ${formData.threshold_percentage}%`
        });
      }
      
      alert('测试通知发送成功！');
    } catch (error) {
      console.error('Test notification error:', error);
      alert('测试通知发送失败，请检查配置。');
    } finally {
      setTestNotificationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {isEdit ? '编辑告警配置' : '创建告警配置'}
          </CardTitle>
          <CardDescription>
            配置使用量告警规则，当使用量达到指定条件时将触发通知
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form action={handleFormAction} className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本信息</h3>
                
                <FormField
                  control={form.control}
                  name="subscription_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>目标订阅</FormLabel>
                      <FormControl>
                        <SubscriptionSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="选择要监控的订阅..."
                          disabled={isEdit} // 编辑时不允许修改订阅
                        />
                      </FormControl>
                      <FormDescription>
                        选择要监控使用量的订阅账户
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usage_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>使用量类型</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择使用量类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usageTypeOptions.map((option) => (
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

                  <FormField
                    control={form.control}
                    name="threshold_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>阈值百分比</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          当使用量达到此百分比时触发告警
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* 告警设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">告警设置</h3>

                <FormField
                  control={form.control}
                  name="alert_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>告警类型</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          {alertTypeOptions.map((option) => (
                            <div
                              key={option.value}
                              className={`relative cursor-pointer rounded-lg border p-4 hover:bg-accent ${
                                field.value === option.value ? 'border-primary bg-accent' : ''
                              }`}
                              onClick={() => field.onChange(option.value)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`h-2 w-2 rounded-full ${
                                  field.value === option.value ? 'bg-primary' : 'bg-muted'
                                }`} />
                                <span className="font-medium">{option.label}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>严重程度</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {severityOptions.map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={field.value === option.value ? "default" : "outline"}
                              onClick={() => field.onChange(option.value)}
                              className="flex-1"
                            >
                              <Badge className={`mr-2 ${option.color}`}>
                                {option.label}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 通知设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">通知设置</h3>

                <FormField
                  control={form.control}
                  name="notification_channels"
                  render={() => (
                    <FormItem>
                      <FormLabel>通知渠道</FormLabel>
                      <FormDescription>
                        选择告警触发时的通知方式
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-3">
                        {notificationChannelOptions.map((item) => (
                          <FormField
                            key={item.value}
                            control={form.control}
                            name="notification_channels"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.value
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      {item.label}
                                    </FormLabel>
                                    <FormDescription>
                                      {item.description}
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">启用告警</FormLabel>
                          <FormDescription>
                            是否启用此告警配置
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
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={testNotificationLoading || !form.watch('subscription_id')}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testNotificationLoading ? '测试中...' : '测试通知'}
                </Button>

                <div className="flex items-center gap-2">
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      取消
                    </Button>
                  )}
                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? '保存中...' : (isEdit ? '更新配置' : '创建配置')}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}