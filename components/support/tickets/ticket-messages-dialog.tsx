'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  User, 
  Shield, 
  Bot, 
  MessageSquare, 
  Search,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

import { ticketService } from '@/lib/ticket-service'
import { TicketResponse, TicketMessageResponse, CreateTicketMessageRequest } from '@/lib/ticket-types'

interface TicketMessagesDialogProps {
  ticket: TicketResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessageAdded: () => void
}

export function TicketMessagesDialog({ 
  ticket, 
  open, 
  onOpenChange, 
  onMessageAdded 
}: TicketMessagesDialogProps) {
  const [messages, setMessages] = useState<TicketMessageResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInternalOnly, setShowInternalOnly] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到最新消息
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    })
  }

  const loadMessages = useCallback(async () => {
    if (!ticket) return
    
    try {
      setLoading(true)
      const response = await ticketService.getTicketMessages(ticket.id, {
        ticket_id: ticket.id,
        include_internal: true,
        limit: 100,
        offset: 0
      })
      
      if (response.code === 0 && response.data) {
        setMessages(response.data)
      }
    } catch (error) {
      console.error('加载工单消息失败:', error)
      toast.error("加载失败", {
        description: "无法加载工单消息，请重试"
      })
    } finally {
      setLoading(false)
    }
  }, [ticket])

  const handleSendMessage = useCallback(async () => {
    if (!ticket || !newMessage.trim() || sendingMessage) return
    
    try {
      setSendingMessage(true)
      
      const messageData: CreateTicketMessageRequest = {
        content: newMessage.trim(),
        message_type: 'admin',
        is_internal: isInternal,
      }

      const response = await ticketService.createTicketMessage(ticket.id, messageData)
      
      if (response.code === 0) {
        setNewMessage('')
        setIsInternal(false)
        await loadMessages()
        onMessageAdded()
        
        toast.success("消息已发送", {
          description: isInternal ? "内部消息已发送" : "回复已发送给用户"
        })
      } else {
        throw new Error(response.message || '发送消息失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error("发送失败", {
        description: error instanceof Error ? error.message : "发送消息失败，请重试"
      })
    } finally {
      setSendingMessage(false)
    }
  }, [ticket, newMessage, sendingMessage, isInternal, loadMessages, onMessageAdded])

  // 加载工单消息
  useEffect(() => {
    if (ticket && open) {
      loadMessages()
    }
  }, [ticket, open, loadMessages])

  // 消息加载后自动滚动
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return
      
      // Ctrl+Enter 发送消息
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault()
        handleSendMessage()
      }
      
      // ESC 关闭对话框
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleSendMessage, onOpenChange])

  // 自动调整文本框高度
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    adjustTextareaHeight()
  }

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'system':
        return <Bot className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getMessageTypeLabel = (messageType: string) => {
    switch (messageType) {
      case 'user':
        return '用户'
      case 'admin':
        return '管理员'
      case 'system':
        return '系统'
      default:
        return messageType
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("已复制", {
        description: "消息内容已复制到剪贴板"
      })
    } catch {
      toast.error("复制失败", {
        description: "无法复制到剪贴板"
      })
    }
  }

  // 过滤消息
  const filteredMessages = messages.filter(message => {
    if (showInternalOnly && !message.is_internal) return false
    if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // 按日期分组消息
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, TicketMessageResponse[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            工单对话
          </DialogTitle>
          <DialogDescription>
            工单号: {ticket?.ticket_no} - {ticket?.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* 工单基本信息 */}
          {ticket && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={ticketService.getStatusInfo(ticket.status).color}>
                      {ticketService.getStatusInfo(ticket.status).label}
                    </Badge>
                    <Badge variant="secondary" className={ticketService.getPriorityInfo(ticket.priority).color}>
                      {ticketService.getPriorityInfo(ticket.priority).label}
                    </Badge>
                    <Badge variant="outline">
                      {ticketService.getCategoryInfo(ticket.category).label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      创建于 {ticketService.formatRelativeTime(ticket.created_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMessages}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
              </CardContent>
            </Card>
          )}

          {/* 搜索和筛选 */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索消息..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showInternalOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInternalOnly(!showInternalOnly)}
              className="whitespace-nowrap"
            >
              {showInternalOnly ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              内部消息
            </Button>
          </div>

          {/* 消息列表 */}
          <ScrollArea className="flex-1 border rounded-md bg-gray-50/50">
            <div className="p-4 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <p>加载消息中...</p>
                  </div>
                </div>
              ) : Object.keys(groupedMessages).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? '未找到匹配的消息' : '暂无消息'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, dayMessages]) => (
                  <div key={date} className="space-y-4">
                    {/* 日期分隔符 */}
                    <div className="flex items-center justify-center">
                      <div className="bg-white px-3 py-1 rounded-full text-xs text-muted-foreground border shadow-sm">
                        {new Date(date).toLocaleDateString('zh-CN', { 
                          month: 'long', 
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </div>
                    </div>
                    
                    {/* 当天消息 */}
                    {dayMessages.map((message, index) => {
                      const isAdmin = message.message_type === 'admin'
                      const isSystem = message.message_type === 'system'
                      const showUserInfo = index === 0 || dayMessages[index - 1].message_type !== message.message_type
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${
                            message.is_internal ? 'opacity-75' : ''
                          }`}
                        >
                          <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                            {/* 用户信息 */}
                            {showUserInfo && (
                              <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {getMessageIcon(message.message_type)}
                                  <span className="font-medium">
                                    {message.user?.username || message.user?.email || `用户 ${message.user_id}`}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {getMessageTypeLabel(message.message_type)}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {/* 消息气泡 */}
                            <div
                              className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md group ${
                                isSystem
                                  ? 'bg-blue-50 border border-blue-200'
                                  : isAdmin
                                  ? message.is_internal
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
                                  : 'bg-white border'
                              }`}
                            >
                              {/* 内部消息标识 */}
                              {message.is_internal && (
                                <div className="flex items-center gap-1 text-xs mb-2 opacity-90">
                                  <EyeOff className="h-3 w-3" />
                                  <span>内部消息</span>
                                </div>
                              )}
                              
                              {/* 消息内容 */}
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </p>
                              
                              {/* 附件 */}
                              {message.attachments && (
                                <div className="mt-2 p-2 rounded bg-black/10 text-xs">
                                  📎 {message.attachments}
                                </div>
                              )}
                              
                              {/* 时间和操作 */}
                              <div className={`flex items-center justify-between mt-2 text-xs ${
                                isAdmin && !message.is_internal ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{ticketService.formatRelativeTime(message.created_at)}</span>
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-black/10"
                                    onClick={() => copyToClipboard(message.content)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* 发送消息 */}
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal" className="text-sm">
                  内部消息（仅管理员可见）
                </Label>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Ctrl+Enter 发送
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="输入回复消息..."
                  value={newMessage}
                  onChange={handleTextareaChange}
                  disabled={sendingMessage}
                  className="min-h-[80px] max-h-[120px] resize-none pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                      e.preventDefault()
                    }
                  }}
                />
                
                {/* 发送按钮 */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                >
                  {sendingMessage ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}