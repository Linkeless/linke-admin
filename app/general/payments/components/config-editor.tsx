'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, FileText, AlertTriangle } from 'lucide-react'

interface ConfigEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const CONFIG_TEMPLATES = {
  epay: {
    name: '易支付',
    config: {
      api_url: 'https://pay.example.com',
      pid: 'your_partner_id',
      key: 'your_secret_key',
      notify_url: 'https://your-domain.com/api/payments/epay/notify',
      return_url: 'https://your-domain.com/payments/success',
      submit_url: 'https://pay.example.com/submit.php',
      api_url_query: 'https://pay.example.com/api.php',
      sign_type: 'MD5'
    }
  },
  alipay: {
    name: '支付宝',
    config: {
      app_id: 'your_app_id',
      private_key: 'your_private_key',
      public_key: 'alipay_public_key',
      notify_url: 'https://your-domain.com/api/payments/alipay/notify',
      return_url: 'https://your-domain.com/payments/success',
      sandbox: false,
      sign_type: 'RSA2'
    }
  },
  wechat: {
    name: '微信支付',
    config: {
      app_id: 'your_app_id',
      mch_id: 'your_merchant_id',
      key: 'your_api_key',
      cert_path: '/path/to/cert.pem',
      key_path: '/path/to/key.pem',
      notify_url: 'https://your-domain.com/api/payments/wechat/notify',
      sign_type: 'MD5'
    }
  },
  stripe: {
    name: 'Stripe',
    config: {
      public_key: 'pk_test_your_public_key',
      secret_key: 'sk_test_your_secret_key',
      webhook_secret: 'whsec_your_webhook_secret',
      success_url: 'https://your-domain.com/payments/success',
      cancel_url: 'https://your-domain.com/payments/cancel',
      api_version: '2023-10-16'
    }
  },
  paypal: {
    name: 'PayPal',
    config: {
      client_id: 'your_client_id',
      client_secret: 'your_client_secret',
      sandbox: true,
      webhook_id: 'your_webhook_id',
      success_url: 'https://your-domain.com/payments/success',
      cancel_url: 'https://your-domain.com/payments/cancel',
      api_base_url: 'https://api.sandbox.paypal.com'
    }
  }
}

export function ConfigEditor({ value, onChange, placeholder, disabled }: ConfigEditorProps) {
  const [copied, setCopied] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const validateJSON = (jsonString: string) => {
    if (!jsonString.trim()) {
      setJsonError(null)
      return
    }

    try {
      JSON.parse(jsonString)
      setJsonError(null)
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : '无效的JSON格式')
    }
  }

  const handleValueChange = (newValue: string) => {
    onChange(newValue)
    validateJSON(newValue)
  }

  const handleTemplateSelect = (templateKey: string) => {
    const template = CONFIG_TEMPLATES[templateKey as keyof typeof CONFIG_TEMPLATES]
    if (template) {
      const formattedConfig = JSON.stringify(template.config, null, 2)
      handleValueChange(formattedConfig)
    }
  }

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(value)
      const formatted = JSON.stringify(parsed, null, 2)
      handleValueChange(formatted)
    } catch (error) {
      // 如果解析失败，不做任何操作
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 复制失败时不显示错误
    }
  }

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择模板" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONFIG_TEMPLATES).map(([key, template]) => (
                <SelectItem key={key} value={key}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={formatJSON}
            disabled={!value.trim() || !!jsonError}
          >
            <FileText className="w-4 h-4 mr-1" />
            格式化
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {jsonError ? (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              JSON错误
            </Badge>
          ) : value.trim() ? (
            <Badge variant="default" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              格式正确
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!value.trim()}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* JSON编辑器 */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`font-mono text-sm resize-none ${
            jsonError ? 'border-red-500 focus:border-red-500' : ''
          }`}
          rows={12}
        />
      </div>

      {/* 错误提示 */}
      {jsonError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            JSON格式错误: {jsonError}
          </AlertDescription>
        </Alert>
      )}

      {/* 帮助文本 */}
      {!jsonError && (
        <div className="text-sm text-muted-foreground space-y-2">
          <div>
            <p className="font-medium">配置说明：</p>
            <ul className="ml-4 space-y-1">
              <li>• 配置参数必须是有效的JSON格式</li>
              <li>• 可以选择上方的模板快速填入常用配置</li>
              <li>• 使用&quot;格式化&quot;按钮可以自动整理JSON格式</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">易支付(epay)对接说明：</p>
            <ul className="ml-4 space-y-1">
              <li>• api_url: 易支付平台接口地址</li>
              <li>• pid: 商户ID/合作伙伴ID</li>
              <li>• key: 商户密钥</li>
              <li>• submit_url: 支付提交地址（通常为 /submit.php）</li>
              <li>• api_url_query: 订单查询接口地址（通常为 /api.php）</li>
              <li>• sign_type: 签名方式（MD5/RSA）</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}