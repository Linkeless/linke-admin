'use client'

import { useState } from "react"
import { Trash2, RotateCcw, Loader2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useBatchDeleteUsers, useBatchRestoreUsers } from "@/hooks/mutations/use-user-mutations"
import { userService } from "@/lib/user-service"
import { UserResponse } from "@/lib/user-types"

interface BatchActionsToolbarProps {
  selectedUsers: UserResponse[]
  onBatchComplete: () => void
  onClearSelection: () => void
}

export function BatchActionsToolbar({ 
  selectedUsers, 
  onBatchComplete, 
  onClearSelection 
}: BatchActionsToolbarProps) {
  // 使用React Query mutation hooks
  const batchDeleteMutation = useBatchDeleteUsers({
    onSuccess: (data) => {
      if (data.code === 0) {
        onBatchComplete()
        onClearSelection()
      }
    }
  })
  
  const batchRestoreMutation = useBatchRestoreUsers({
    onSuccess: (data) => {
      if (data.code === 0) {
        onBatchComplete()
        onClearSelection()
      }
    }
  })

  if (selectedUsers.length === 0) {
    return null
  }

  const deletedUsers = selectedUsers.filter(user => user.deleted_at)
  const activeUsers = selectedUsers.filter(user => !user.deleted_at)

  const handleBatchDelete = async () => {
    if (activeUsers.length === 0) return
    const userIds = activeUsers.map(user => user.id)
    batchDeleteMutation.mutate(userIds)
  }

  const handleBatchRestore = async () => {
    if (deletedUsers.length === 0) return
    const userIds = deletedUsers.map(user => user.id)
    batchRestoreMutation.mutate(userIds)
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 选择信息区域 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {selectedUsers.slice(0, 3).map((user) => (
                  <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={userService.getUserAvatarUrl(user)} />
                    <AvatarFallback className="text-xs">
                      {userService.formatUserDisplayName(user).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {selectedUsers.length > 3 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                    +{selectedUsers.length - 3}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  已选择 {selectedUsers.length} 个用户
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {activeUsers.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeUsers.length} 活跃
                    </Badge>
                  )}
                  {deletedUsers.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {deletedUsers.length} 已删除
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearSelection}
            >
              取消选择
            </Button>

        {/* 批量恢复按钮 */}
        {deletedUsers.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={batchRestoreMutation.isPending}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                {batchRestoreMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                恢复用户 ({deletedUsers.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-green-600" />
                  确认恢复用户
                </AlertDialogTitle>
                <AlertDialogDescription>
                  您即将恢复 <strong>{deletedUsers.length}</strong> 个已删除的用户账号。
                  恢复后，这些用户将重新获得系统访问权限。
                  <br /><br />
                  <strong>用户列表：</strong>
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {deletedUsers.map((user, index) => (
                      <div key={user.id}>
                        {index > 0 && <Separator />}
                        <div className="flex items-center gap-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userService.getUserAvatarUrl(user)} />
                            <AvatarFallback className="text-xs">
                              {userService.formatUserDisplayName(user).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {userService.formatUserDisplayName(user)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            ID: {user.id}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBatchRestore}
                  className="bg-green-600 hover:bg-green-700"
                >
                  确认恢复
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* 批量删除按钮 */}
        {activeUsers.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                disabled={batchDeleteMutation.isPending}
              >
                {batchDeleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                删除用户 ({activeUsers.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  确认删除用户
                </AlertDialogTitle>
                <AlertDialogDescription>
                  您即将删除 <strong>{activeUsers.length}</strong> 个用户账号。
                  这是软删除操作，用户数据将被保留，但用户将无法访问系统。
                  您稍后可以选择恢复这些用户。
                  <br /><br />
                  <strong>用户列表：</strong>
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {activeUsers.map((user, index) => (
                      <div key={user.id}>
                        {index > 0 && <Separator />}
                        <div className="flex items-center gap-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userService.getUserAvatarUrl(user)} />
                            <AvatarFallback className="text-xs">
                              {userService.formatUserDisplayName(user).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {userService.formatUserDisplayName(user)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {userService.getUserRoleBadgeConfig(user.role).label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ID: {user.id}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBatchDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}