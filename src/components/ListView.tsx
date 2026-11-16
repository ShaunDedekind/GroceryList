import { useRef, useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Session, GroceryItem, ListSection } from '../types'
import { useActiveTab } from '../hooks/useActiveTab'
import { useSectionCounts } from '../hooks/useActiveTab'
import { updateListName as updateListNameRemote } from '../lib/supabase'
import { HomeTab } from './HomeTab'
import { HenryTab } from './HenryTab'
import { TabBar } from './TabBar'
import { PartnerToast } from './PartnerToast'
import { BottomSheet } from './BottomSheet'
import { InboxSheet } from './InboxSheet'

interface ListViewProps {
  session: Session
  onLeave: () => void
  onUpdateListName: (name: string) => void
  onUpdateDisplayName: (name: string) => void
  onCheckForUpdate: () => void
  updateAvailable: boolean
}

export function ListView({
  session,
  onLeave,
  onUpdateListName,
  onUpdateDisplayName,
  onCheckForUpdate,
  updateAvailable,
}: ListViewProps) {
  const { activeTab, setActiveTab } = useActiveTab(session.listId)
  const counts = useSectionCounts(session.listId)

  const [partnerToast, setPartnerToast] = useState<{
    name: string
    text: string
    section: ListSection
  } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [showDoneHome, setShowDoneHome] = useState(false)
  const [showDoneHenry, setShowDoneHenry] = useState(false)
  const [editName, setEditName] = useState(session.listName)
  const [editDisplayName, setEditDisplayName] = useState(session.displayName)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const updateAvailableRef = useRef(updateAvailable)

  useEffect(() => {
    updateAvailableRef.current = updateAvailable
  }, [updateAvailable])

  const handleRemoteInsert = useCallback(
    (section: ListSection) => (item: GroceryItem) => {
      setPartnerToast({
        name: item.added_by ?? 'Someone',
        text: item.text,
        section,
      })
    },
    [],
  )

  const openSettings = () => {
    setEditName(session.listName)
    setEditDisplayName(session.displayName)
    setUpdateMessage(null)
    setShowSettings(true)
  }

  const handleCheckForUpdate = () => {
    setUpdateMessage(null)
    onCheckForUpdate()
    window.setTimeout(() => {
      if (updateAvailableRef.current) {
        setUpdateMessage('Update available — tap Refresh above')
      } else {
        setUpdateMessage("You're on the latest version")
      }
    }, 1500)
  }

  const handleSaveSettings = async () => {
    const name = editName.trim() || 'Home OS'
    const displayName = editDisplayName.trim()
    if (!displayName) return

    try {
      await updateListNameRemote(session.listId, name)
      onUpdateListName(name)
    } catch {
      onUpdateListName(name)
    }
    onUpdateDisplayName(displayName)
    setShowSettings(false)
  }

  return (
    <div className="flex min-h-vv h-vv flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="flex min-h-0 flex-1 flex-col"
          hidden={activeTab !== 'home'}
        >
          <HomeTab
            session={session}
            showDone={showDoneHome}
            onShowDoneChange={setShowDoneHome}
            onRemoteInsert={handleRemoteInsert('home')}
            active={activeTab === 'home'}
            onOpenSettings={openSettings}
          />
        </div>
        <div
          className="flex min-h-0 flex-1 flex-col"
          hidden={activeTab !== 'henry'}
        >
          <HenryTab
            session={session}
            showDone={showDoneHenry}
            onShowDoneChange={setShowDoneHenry}
            onRemoteInsert={handleRemoteInsert('henry')}
            active={activeTab === 'henry'}
            onOpenSettings={openSettings}
          />
        </div>
      </div>

      <TabBar
        activeTab={activeTab === 'grocery' ? 'home' : activeTab}
        onTabChange={setActiveTab}
        homeCount={counts.home}
        henryCount={counts.henry}
      />

      <AnimatePresence>
        {partnerToast && (
          <PartnerToast
            key={`${partnerToast.name}-${partnerToast.text}`}
            name={partnerToast.name}
            text={partnerToast.text}
            onDismiss={() => setPartnerToast(null)}
          />
        )}
      </AnimatePresence>

      {showSettings && (
        <BottomSheet onClose={() => setShowSettings(false)} maxHeightClass="max-h-vv-92">
          <h3 className="text-headline font-semibold text-ink dark:text-ink-dark">
            Settings
          </h3>

          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] bg-cream-dark dark:bg-surface">
            <label className="flex min-h-row items-center gap-3 px-4">
              <span className="shrink-0 text-body text-ink dark:text-ink-dark">
                Home name
              </span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-right text-body text-warm-gray outline-none dark:text-warm-gray-light"
              />
            </label>
            <div className="ml-4 border-b border-separator" />
            <label className="flex min-h-row items-center gap-3 px-4">
              <span className="shrink-0 text-body text-ink dark:text-ink-dark">
                Your name
              </span>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-right text-body text-warm-gray outline-none dark:text-warm-gray-light"
              />
            </label>
            <div className="ml-4 border-b border-separator" />
            <button
              type="button"
              onClick={() => {
                setShowSettings(false)
                setShowInbox(true)
              }}
              className="flex min-h-11 w-full items-center px-4 text-left text-body text-ink active:opacity-70 dark:text-ink-dark"
            >
              Email inbox
            </button>
            <div className="ml-4 border-b border-separator" />
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!editDisplayName.trim()}
              className="flex min-h-11 w-full items-center px-4 text-left text-body font-semibold text-sage disabled:opacity-40"
            >
              Save
            </button>
            <div className="ml-4 border-b border-separator" />
            <button
              type="button"
              onClick={handleCheckForUpdate}
              className="flex min-h-11 w-full items-center px-4 text-left text-body text-ink active:opacity-70 dark:text-ink-dark"
            >
              Check for updates
            </button>
            {updateMessage && (
              <p className="px-4 pb-3 text-footnote text-warm-gray dark:text-warm-gray-light">
                {updateMessage}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSettings(false)
              onLeave()
            }}
            className="mt-6 flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-cream-dark text-body font-semibold text-error active:opacity-70 dark:bg-surface"
          >
            Leave Home
          </button>
        </BottomSheet>
      )}

      {showInbox && (
        <InboxSheet
          session={session}
          onClose={() => setShowInbox(false)}
        />
      )}
    </div>
  )
}
