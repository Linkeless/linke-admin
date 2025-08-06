'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Trash2, 
  User, 
  FileText, 
  Calculator,
  Calendar,
  Building
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceLanguage,
  InvoiceTemplate
} from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { UserSelector } from './user-selector'

// 表单验证模式
const invoiceFormSchema = z.object({
  user_id: z.number().min(1, '请选择用户'),
  issue_date: z.string().min(1, '请选择开票日期'),
  due_date: z.string().min(1, '请选择到期日期'),
  currency: z.string().min(1, '请选择货币'),
  language: z.string().optional(),
  template_id: z.number().optional(),
  
  // 地址信息
  billing_address: z.object({
    company: z.string().optional(),
    address_line_1: z.string().optional(),
    address_line_2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  
  // 发票项目
  line_items: z.array(z.object({
    description: z.string().min(1, '请输入项目描述'),
    quantity: z.number().min(0.01, '数量必须大于0'),
    unit_price: z.number().min(0, '单价不能为负数'),
    discount_amount: z.number().min(0, '折扣金额不能为负数').optional(),
    tax_rate: z.number().min(0).max(100, '税率不能超过100%').optional(),
  })).min(1, '至少需要一个项目'),
  
  // 附加信息
  notes: z.string().optional(),
  terms: z.string().optional(),
  footer: z.string().optional(),
  
  // 关联信息
  order_id: z.number().optional(),
  subscription_id: z.number().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceFormSchema>

interface InvoiceFormProps {
  invoice?: Invoice
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function InvoiceForm({ invoice, onSubmit, onCancel, loading = false }: InvoiceFormProps) {
  const [languages, setLanguages] = useState<InvoiceLanguage[]>([])
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const isEdit = !!invoice

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      user_id: invoice?.user_id || 0,
      issue_date: invoice?.issue_date.split('T')[0] || new Date().toISOString().split('T')[0],
      due_date: invoice?.due_date.split('T')[0] || '',
      currency: invoice?.currency || 'CNY',
      language: invoice?.language || 'zh',
      template_id: invoice?.template_id || undefined,
      billing_address: invoice?.billing_address || {},
      line_items: invoice?.line_items?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate * 100 || 0, // 转换为百分比显示
      })) || [
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_amount: 0,
          tax_rate: 0,
        }
      ],
      notes: invoice?.notes || '',
      terms: invoice?.terms || '',
      footer: invoice?.footer || '',
      order_id: invoice?.order_id || undefined,
      subscription_id: invoice?.subscription_id || undefined,
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items'
  })

  // 加载语言和模板数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [languagesRes, templatesRes] = await Promise.all([
          invoiceService.getInvoiceLanguages(),
          invoiceService.getInvoiceTemplates()
        ])
        
        if (languagesRes.code === 0) {
          setLanguages(languagesRes.data)
        }
        
        if (templatesRes.code === 0) {
          setTemplates(templatesRes.data)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        toast.error('加载表单数据失败')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // 计算小计和总计
  const calculateTotals = () => {
    const lineItems = form.watch('line_items')
    let subtotal = 0
    let totalTax = 0
    let totalDiscount = 0

    lineItems.forEach(item => {
      const itemTotal = item.quantity * item.unit_price
      const discount = item.discount_amount || 0
      const taxableAmount = itemTotal - discount
      const tax = taxableAmount * ((item.tax_rate || 0) / 100)
      
      subtotal += itemTotal
      totalDiscount += discount
      totalTax += tax
    })

    const total = subtotal - totalDiscount + totalTax

    return {
      subtotal,
      totalDiscount,
      totalTax,
      total
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      const submitData = {
        ...data,
        line_items: data.line_items.map(item => ({
          ...item,
          tax_rate: (item.tax_rate || 0) / 100, // 转换回小数
          discount_amount: item.discount_amount || 0,
        }))
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('提交表单失败:', error)
      toast.error('提交表单失败，请稍后重试')
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

  const addLineItem = () => {
    append({
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      tax_rate: 0,
    })
  }

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  if (loadingData) {
    return <div className="flex items-center justify-center py-8">加载中...</div>
  }

  return (
    <Form {...form}>
      <form action={handleFormAction} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择用户 *</FormLabel>
                    <FormControl>
                      <UserSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="选择用户"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>货币 *</FormLabel>
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
                        <SelectItem value="JPY">日元 (JPY)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开票日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>到期日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {languages.length > 0 && (
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>语言</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择语言" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.native_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {templates.length > 0 && (
                <FormField
                  control={form.control}
                  name="template_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>模板</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择模板" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 计费地址 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              计费地址
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_address.company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公司名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入公司名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>国家/地区</FormLabel>
                    <FormControl>
                      <Input placeholder="输入国家/地区" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_address.address_line_1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>地址行1</FormLabel>
                    <FormControl>
                      <Input placeholder="输入详细地址" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_address.address_line_2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>地址行2</FormLabel>
                    <FormControl>
                      <Input placeholder="输入附加地址信息" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>城市</FormLabel>
                    <FormControl>
                      <Input placeholder="输入城市" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>省/州</FormLabel>
                    <FormControl>
                      <Input placeholder="输入省/州" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_address.postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮政编码</FormLabel>
                    <FormControl>
                      <Input placeholder="输入邮政编码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 发票项目 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                发票项目
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                添加项目
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">项目 {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name={`line_items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>描述 *</FormLabel>
                        <FormControl>
                          <Input placeholder="项目描述" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`line_items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>数量 *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="1"
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
                    name={`line_items.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>单价 *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
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
                    name={`line_items.${index}.tax_rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>税率 (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`line_items.${index}.discount_amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>折扣金额</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            {/* 金额汇总 */}
            <Separator />
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>小计:</span>
                  <span>{invoiceService.formatAmount(totals.subtotal, form.watch('currency'))}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>折扣:</span>
                    <span>-{invoiceService.formatAmount(totals.totalDiscount, form.watch('currency'))}</span>
                  </div>
                )}
                {totals.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>税费:</span>
                    <span>{invoiceService.formatAmount(totals.totalTax, form.watch('currency'))}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>总计:</span>
                  <span>{invoiceService.formatAmount(totals.total, form.watch('currency'))}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 附加信息 */}
        <Card>
          <CardHeader>
            <CardTitle>附加信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="添加备注信息..."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>条款</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="输入付款条款和条件..."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>关联订单ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="输入订单ID"
                        {...field}
                        value={field.value ? field.value.toString() : ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subscription_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>关联订阅ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="输入订阅ID"
                        {...field}
                        value={field.value ? field.value.toString() : ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : isEdit ? '更新发票' : '创建发票'}
          </Button>
        </div>
      </form>
    </Form>
  )
}