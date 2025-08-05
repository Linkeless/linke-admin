'use client';

import { Badge } from '@/components/ui/badge';
import { AlertStatus, AlertSeverity } from '@/lib/usage-types';
import { UsageService } from '@/lib/usage-service';
import { cn } from '@/lib/utils';

interface AlertStatusBadgeProps {
  status: AlertStatus;
  className?: string;
}

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

export function AlertStatusBadge({ status, className }: AlertStatusBadgeProps) {
  const getStatusConfig = (status: AlertStatus) => {
    switch (status) {
      case AlertStatus.ACTIVE:
        return {
          label: '活跃',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      case AlertStatus.ACKNOWLEDGED:
        return {
          label: '已确认',
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        };
      case AlertStatus.RESOLVED:
        return {
          label: '已解决',
          variant: 'outline' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200'
        };
      case AlertStatus.SUPPRESSED:
        return {
          label: '已抑制',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function AlertSeverityBadge({ severity, className }: AlertSeverityBadgeProps) {
  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return {
          label: '严重',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      case AlertSeverity.HIGH:
        return {
          label: '高',
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        };
      case AlertSeverity.MEDIUM:
        return {
          label: '中',
          variant: 'outline' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        };
      case AlertSeverity.LOW:
        return {
          label: '低',
          variant: 'outline' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
      default:
        return {
          label: severity,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export default AlertStatusBadge;