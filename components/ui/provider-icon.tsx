import {
  Chrome,
  Github,
  MessageCircle,
  User,
  Link,
} from "lucide-react"

interface ProviderIconProps {
  provider: string
  className?: string
}

export function ProviderIcon({ provider, className = "h-4 w-4" }: ProviderIconProps) {
  const iconMap = {
    'brand-google': Chrome,
    'brand-github': Github,
    'brand-telegram': MessageCircle,
    'user': User,
    'link': Link,
  }

  const IconComponent = iconMap[provider as keyof typeof iconMap] || Link

  return <IconComponent className={className} />
}