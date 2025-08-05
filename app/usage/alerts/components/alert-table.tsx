'use client';

import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Filter, Search, Check, X, Trash2, RefreshCw } from 'lucide-react';
import { AlertTableRow, AlertStatus, AlertSeverity } from '@/lib/usage-types';
import { cn } from '@/lib/utils';

interface AlertTableProps {
  data: AlertTableRow[];
  columns: ColumnDef<AlertTableRow>[];
  loading?: boolean;
  onRefresh?: () => void;
  onAcknowledgeSelected?: (alertIds: string[]) => void;
  onResolveSelected?: (alertIds: string[]) => void;
  onDeleteSelected?: (alertIds: string[]) => void;
}

export default function AlertTable({
  data,
  columns,
  loading = false,
  onRefresh,
  onAcknowledgeSelected,
  onResolveSelected,
  onDeleteSelected,
}: AlertTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedAlertIds = selectedRows.map(row => row.original.id);

  // 应用状态过滤
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    if (status === 'all') {
      table.getColumn('status')?.setFilterValue(undefined);
    } else {
      table.getColumn('status')?.setFilterValue(status);
    }
  };

  // 应用严重程度过滤
  const handleSeverityFilter = (severity: string) => {
    setSeverityFilter(severity);
    if (severity === 'all') {
      table.getColumn('severity')?.setFilterValue(undefined);
    } else {
      table.getColumn('severity')?.setFilterValue(severity);
    }
  };

  // 批量操作处理
  const handleBatchAction = (action: 'acknowledge' | 'resolve' | 'delete') => {
    if (selectedAlertIds.length === 0) return;

    switch (action) {
      case 'acknowledge':
        onAcknowledgeSelected?.(selectedAlertIds);
        break;
      case 'resolve':
        onResolveSelected?.(selectedAlertIds);
        break;
      case 'delete':
        onDeleteSelected?.(selectedAlertIds);
        break;
    }

    // 清除选择
    setRowSelection({});
  };

  const getStatusStats = () => {
    const stats = {
      active: data.filter(item => item.status === AlertStatus.ACTIVE).length,
      acknowledged: data.filter(item => item.status === AlertStatus.ACKNOWLEDGED).length,
      resolved: data.filter(item => item.status === AlertStatus.RESOLVED).length,
      suppressed: data.filter(item => item.status === AlertStatus.SUPPRESSED).length,
    };
    return stats;
  };

  const statusStats = getStatusStats();

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索告警..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="pl-8 w-[300px]"
            />
          </div>
          
          {/* 状态过滤 */}
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃 ({statusStats.active})</SelectItem>
              <SelectItem value="acknowledged">已确认 ({statusStats.acknowledged})</SelectItem>
              <SelectItem value="resolved">已解决 ({statusStats.resolved})</SelectItem>
              <SelectItem value="suppressed">已抑制 ({statusStats.suppressed})</SelectItem>
            </SelectContent>
          </Select>

          {/* 严重程度过滤 */}
          <Select value={severityFilter} onValueChange={handleSeverityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="严重程度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等级</SelectItem>
              <SelectItem value="critical">严重</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>

          {/* 列显示控制 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                列显示 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center space-x-2">
          {/* 批量操作 */}
          {selectedAlertIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                已选择 {selectedAlertIds.length} 项
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction('acknowledge')}
              >
                <Check className="mr-2 h-4 w-4" />
                批量确认
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction('resolve')}
              >
                <X className="mr-2 h-4 w-4" />
                批量解决
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                批量删除
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>共 {data.length} 条告警</span>
          <span>活跃 {statusStats.active} 条</span>
          <span>已确认 {statusStats.acknowledged} 条</span>
          <span>已解决 {statusStats.resolved} 条</span>
        </div>
        <div>
          显示第 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} 条，共 {table.getFilteredRowModel().rows.length} 条
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无告警数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} 行已选择。
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}