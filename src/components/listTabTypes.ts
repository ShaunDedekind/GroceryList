import type { GroceryItem } from '../types'

export interface DisplayCategory {
  id: string
  label: string
  emoji: string
  visible?: boolean
}

export interface ListTabContentProps {
  session: {
    listId: string
    listCode: string
    listName: string
    displayName: string
  }
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  mainRef?: React.RefObject<HTMLElement | null>
  scrollRestored?: boolean
}
