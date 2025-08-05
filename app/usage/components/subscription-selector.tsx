'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 模拟订阅数据类型
interface Subscription {
  id: string;
  user_name?: string;
  user_email?: string;
  plan_name: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

interface SubscriptionSelectorProps {
  value?: string;
  onValueChange?: (subscriptionId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// 模拟订阅数据
const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_001',
    user_name: '张三',
    user_email: 'zhangsan@example.com',
    plan_name: '专业版',
    status: 'active',
    created_at: '2024-01-15T08:30:00Z'
  },
  {
    id: 'sub_002',
    user_name: '李四',
    user_email: 'lisi@example.com',
    plan_name: '基础版',
    status: 'active',
    created_at: '2024-01-20T10:15:00Z'
  },
  {
    id: 'sub_003',
    user_name: '王五',
    user_email: 'wangwu@example.com',
    plan_name: '企业版',
    status: 'active',
    created_at: '2024-02-01T14:20:00Z'
  },
  {
    id: 'sub_004',
    user_email: 'test@example.com',
    plan_name: '试用版',
    status: 'inactive',
    created_at: '2024-02-10T09:45:00Z'
  },
  {
    id: 'sub_005',
    user_name: '赵六',
    user_email: 'zhaoliu@example.com',
    plan_name: '专业版',
    status: 'suspended',
    created_at: '2024-02-15T16:30:00Z'
  }
];

function SubscriptionItem({ subscription, isSelected }: { subscription: Subscription; isSelected: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'inactive': return '未激活';
      case 'suspended': return '已暂停';
      default: return status;
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {subscription.user_name || subscription.user_email}
            </p>
            <Badge variant="outline" className={cn("text-xs", getStatusColor(subscription.status))}>
              {getStatusText(subscription.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID: {subscription.id}</span>
            <span>•</span>
            <span>{subscription.plan_name}</span>
          </div>
        </div>
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </div>
  );
}

export default function SubscriptionSelector({
  value,
  onValueChange,
  placeholder = "选择订阅...",
  className,
  disabled = false
}: SubscriptionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 模拟加载订阅数据
  useEffect(() => {
    const loadSubscriptions = async () => {
      setLoading(true);
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubscriptions(mockSubscriptions);
      setLoading(false);
    };

    loadSubscriptions();
  }, []);

  // 过滤订阅
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const query = searchQuery.toLowerCase();
    return (
      subscription.id.toLowerCase().includes(query) ||
      subscription.user_name?.toLowerCase().includes(query) ||
      subscription.user_email?.toLowerCase().includes(query) ||
      subscription.plan_name.toLowerCase().includes(query)
    );
  });

  // 获取选中的订阅
  const selectedSubscription = subscriptions.find(sub => sub.id === value);

  const handleSelect = (subscriptionId: string) => {
    onValueChange?.(subscriptionId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedSubscription ? (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="truncate">
                {selectedSubscription.user_name || selectedSubscription.user_email}
              </span>
              <Badge variant="outline" className="text-xs">
                {selectedSubscription.id}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="搜索订阅..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                加载中...
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <CommandEmpty>未找到匹配的订阅</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredSubscriptions.map((subscription) => (
                  <CommandItem
                    key={subscription.id}
                    value={subscription.id}
                    onSelect={() => handleSelect(subscription.id)}
                    className="p-3"
                  >
                    <SubscriptionItem 
                      subscription={subscription} 
                      isSelected={value === subscription.id}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}