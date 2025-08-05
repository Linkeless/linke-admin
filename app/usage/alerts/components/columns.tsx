'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Check, X, Pause } from 'lucide-react';
import { AlertTableRow } from '@/lib/usage-types';
import { AlertStatusBadge, AlertSeverityBadge } from './alert-status-badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const alertColumns: ColumnDef<AlertTableRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "告警ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "subscription_id",
    header: "订阅信息",
    cell: ({ row }) => {
      const subscriptionId = row.getValue("subscription_id") as string;
      const userName = row.original.user_name;
      
      return (
        <div className="space-y-1">
          <div className="font-medium">
            {userName || `用户 ${subscriptionId.slice(-8)}`}
          </div>
          <div className="text-sm text-muted-foreground">
            ID: {subscriptionId}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "告警标题",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const alertType = row.original.alert_type;
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          <Badge variant="outline" className="text-xs">
            {alertType}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "severity",
    header: "严重程度",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string;
      return <AlertSeverityBadge severity={severity as any} />;
    },
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <AlertStatusBadge status={status as any} />;
    },
  },
  {
    accessorKey: "current_value",
    header: "当前值/阈值",
    cell: ({ row }) => {
      const currentValue = row.getValue("current_value") as number;
      const thresholdValue = row.original.threshold_value;
      
      return (
        <div className="text-right">
          <div className="font-medium">{currentValue.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">
            阈值: {thresholdValue.toFixed(1)}%
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "创建时间",
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      return (
        <div className="text-sm">
          {format(new Date(createdAt), 'MM-dd HH:mm', { locale: zhCN })}
        </div>
      );
    },
  },
  {
    accessorKey: "acknowledged_at",
    header: "确认时间",
    cell: ({ row }) => {
      const acknowledgedAt = row.original.acknowledged_at;
      return acknowledgedAt ? (
        <div className="text-sm">
          {format(new Date(acknowledgedAt), 'MM-dd HH:mm', { locale: zhCN })}
        </div>
      ) : (
        <span className="text-muted-foreground">未确认</span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const alert = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                // 查看详情
                window.location.href = `/usage/alerts/${alert.id}`;
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {alert.status === 'active' && (
              <DropdownMenuItem
                onClick={() => {
                  // TODO: 实现确认告警
                  console.log('Acknowledge alert:', alert.id);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                确认告警
              </DropdownMenuItem>
            )}
            {(alert.status === 'active' || alert.status === 'acknowledged') && (
              <DropdownMenuItem
                onClick={() => {
                  // TODO: 实现解决告警
                  console.log('Resolve alert:', alert.id);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                解决告警
              </DropdownMenuItem>
            )}
            {alert.status === 'active' && (
              <DropdownMenuItem
                onClick={() => {
                  // TODO: 实现抑制告警
                  console.log('Suppress alert:', alert.id);
                }}
              >
                <Pause className="mr-2 h-4 w-4" />
                抑制告警
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];