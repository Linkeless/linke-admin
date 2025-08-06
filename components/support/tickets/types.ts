import { TicketResponse } from '@/lib/ticket-types'

export interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketCreated: () => void
}

export interface EditTicketDialogProps {
  ticket: TicketResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketUpdated: () => void
}

export interface TicketMessagesDialogProps {
  ticket: TicketResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessageAdded: () => void
}