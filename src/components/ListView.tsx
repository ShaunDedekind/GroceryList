import { useRef, useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Session, GroceryItem, ListSection } from '../types'
import { useActiveTab } from '../hooks/useActiveTab'
import { useSectionCounts } from '../hooks/useActiveTab'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useCategoryConfig } from '../hooks/useCategoryConfig'
import { updateListName as updateListNameRemote } from '../lib/supabase'
import { buildCategoryConfigFromResolved } from '../lib/categoryConfig'
import type { ResolvedCategory } from '../lib/categoryConfig'
import { GroceryTab } from './GroceryTab'
import { HomeTab } from './HomeTab'
import { TabBar } from './TabBar'
import { PartnerToast } from './PartnerToast'
import { AisleSectionsSettings } from './AisleSectionsSettings'

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
  const { groceryResolved, saveConfig } = useCategoryConfig(session.listId, 'grocery')

  const groceryMainRef = useRef<HTMLElement>(null)
  const homeMainRef = useRef<HTMLElement>(null)
  const scrollPositions = useRef<Record<ListSection, number>>({
    grocery: 0,
    home: 0,
  })

  const [partnerToast, setPartnerToast] = useState<{
    name: string
    text: string
    section: ListSection
  } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDoneGrocery, setShowDoneGrocery] = useState(false)
  const [showDoneHome, setShowDoneHome] = useState(false)
  const [editName, setEditName] = useState(session.listName)
  const [editDisplayName, setEditDisplayName] = useState(session.displayName)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const updateAvailableRef = useRef(updateAvailable)

  useBodyScrollLock(showSettings)

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

  const saveScrollPosition = useCallback((section: ListSection) => {
    const ref = section === 'home' ? homeMainRef : groceryMainRef
    if (ref.current) {
      scrollPositions.current[section] = ref.current.scrollTop
    }
  }, [])

  const handleTabChange = useCallback(
    (tab: ListSection) => {
      saveScrollPosition(activeTab)
      setActiveTab(tab)
      requestAnimationFrame(() => {
        const ref = tab === 'home' ? homeMainRef : groceryMainRef
        if (ref.current) {
          ref.current.scrollTop = scrollPositions.current[tab]
        }
      })
    },
    [activeTab, saveScrollPosition, setActiveTab],
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
    const name = editName.trim() || 'Our Grocery List'
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

  const handleSaveAisleSections = async (next: ResolvedCategory[]) => {
    await saveConfig(buildCategoryConfigFromResolved(next))
  }

  const subtitle =
    activeTab === 'home'
      ? counts.home === 0
        ? 'All caught up'
        : `${counts.home} to do`
      : counts.grocery === 0
        ? 'All done!'
        : `${counts.grocery} left`

  const tabLabel = activeTab === 'home' ? 'Home' : 'Shop'

  return (
    <div className="flex min-h-dvh flex-col bg-cream dark:bg-surface">
      <header className="safe-top sticky top-0 z-10 border-b border-cream-dark/80 bg-cream/90 backdrop-blur-lg dark:border-border-dark/80 dark:bg-surface/90">
        <div className="flex items-center gap-2 px-4 pb-2 pt-2">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={openSettings}
              className="truncate text-left text-title font-bold text-ink active:opacity-70 dark:text-ink-dark"
            >
              {session.listName}
            </button>
            <p className="truncate text-meta text-warm-gray dark:text-warm-gray-light">
              {tabLabel}
              {' · '}
              {subtitle}
              {' · '}
              {session.displayName}
            </p>
          </div>
          <button
            type="button"
            onClick={openSettings}
            aria-label="Settings"
            className="press-scale flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-dark text-warm-gray active:bg-cream-dark/80 dark:bg-surface-raised dark:text-warm-gray-light"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1.1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === 'grocery' ? (
          <GroceryTab
            session={session}
            showDone={showDoneGrocery}
            onShowDoneChange={setShowDoneGrocery}
            onRemoteInsert={handleRemoteInsert('grocery')}
            mainRef={groceryMainRef}
            onScroll={() => saveScrollPosition('grocery')}
          />
        ) : (
          <HomeTab
            session={session}
            showDone={showDoneHome}
            onShowDoneChange={setShowDoneHome}
            onRemoteInsert={handleRemoteInsert('home')}
            mainRef={homeMainRef}
            onScroll={() => saveScrollPosition('home')}
          />
        )}
      </div>

      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        groceryCount={counts.grocery}
        homeCount={counts.home}
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
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="safe-bottom max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-5 pb-6 pt-5 shadow-lg dark:bg-surface-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-cream-dark dark:bg-border-dark" />
            <h3 className="text-title font-semibold text-ink dark:text-ink-dark">
              Settings
            </h3>

            <label className="mt-4 block">
              <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
                List name
              </span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-cream-dark bg-cream/50 px-3 py-2.5 text-body outline-none focus:border-sage dark:border-border-dark dark:bg-surface dark:text-ink-dark"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
                Your name
              </span>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-cream-dark bg-cream/50 px-3 py-2.5 text-body outline-none focus:border-sage dark:border-border-dark dark:bg-surface dark:text-ink-dark"
              />
            </label>

            <AisleSectionsSettings
              categories={groceryResolved}
              onSave={handleSaveAisleSections}
            />

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!editDisplayName.trim()}
              className="press-scale mt-4 w-full rounded-2xl bg-sage py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:bg-sage-dark"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleCheckForUpdate}
              className="mt-2 w-full rounded-2xl py-2.5 text-sm font-medium text-sage active:bg-sage/10 dark:active:bg-sage/20"
            >
              Check for updates
            </button>
            {updateMessage && (
              <p className="mt-1.5 text-center text-meta text-warm-gray dark:text-warm-gray-light">
                {updateMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setShowSettings(false)
                onLeave()
              }}
              className="mt-2 w-full rounded-2xl py-2.5 text-sm font-medium text-red-500 active:bg-red-50 dark:active:bg-red-950/20"
            >
              Leave List
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
