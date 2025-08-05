'use client'

import { Badge } from '@/components/ui/badge'
import { invoiceService } from '@/lib/invoice-service'
import { InvoiceStatus } from '@/lib/invoice-types'
import { 
  FileText, 
  Send, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock 
} from 'lucide-react'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  showIcon?: boolean
  className?: string
}

const statusIcons = {
  draft: FileText,
  sent: Send,
  viewed: Eye,
  paid: CheckCircle2,
  overdue: AlertCircle,
  void: XCircle,
  cancelled: Clock,
}

export function InvoiceStatusBadge({ 
  status, 
  showIcon = false, 
  className = '' 
}: InvoiceStatusBadgeProps) {
  const variant = invoiceService.getStatusVariant(status)
  const label = invoiceService.getStatusLabel(status)
  const Icon = statusIcons[status]

  return (
    <Badge variant={variant} className={className}>
      {showIcon && Icon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}