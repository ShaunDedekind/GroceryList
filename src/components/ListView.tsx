import { useRef, useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Session, GroceryItem, ListSection, CategoryId } from '../types'
import { useActiveTab } from '../hooks/useActiveTab'
import { useSectionCounts } from '../hooks/useActiveTab'
import { useCategoryConfig } from '../hooks/useCategoryConfig'
import { updateListName as updateListNameRemote } from '../lib/supabase'
import { buildCategoryConfigFromResolved } from '../lib/categoryConfig'
import type { ResolvedCategory } from '../lib/categoryConfig'
import { GroceryTab } from './GroceryTab'
import { HomeTab } from './HomeTab'
import { TabBar } from './TabBar'
import { PartnerToast } from './PartnerToast'
import { AisleSectionsSettings } from './AisleSectionsSettings'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'

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
  const { groceryResolved, visibleCategories, categoryIds, saveConfig } =
    useCategoryConfig(session.listId, 'grocery')

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
    <div className="flex min-h-vv h-vv flex-col bg-cream dark:bg-surface">
      <header className="safe-top sticky top-[var(--vv-offset-top,0px)] z-10 border-b border-separator bg-cream dark:bg-surface">
        <button
          type="button"
          onClick={openSettings}
          className="press-scale flex min-h-touch w-full items-center gap-2 px-gutter py-2 text-left active:opacity-80"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-headline font-semibold text-ink dark:text-ink-dark">
              {session.listName}
            </p>
            <p className="truncate text-footnote text-warm-gray dark:text-warm-gray-light">
              {tabLabel}
              {' · '}
              {subtitle}
              {' · '}
              {session.displayName}
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-cream-dark text-warm-gray dark:bg-surface-raised dark:text-warm-gray-light">
            <Icon name="settings" size="md" />
          </span>
        </button>
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
            resolved={groceryResolved}
            visibleCategories={visibleCategories as ResolvedCategory[]}
            categoryIds={categoryIds as CategoryId[]}
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
      <BottomSheet onClose={() => setShowSettings(false)} maxHeightClass="max-h-vv-92">
        <h3 className="text-title font-semibold text-ink dark:text-ink-dark">
          Settings
        </h3>

        <label className="mt-4 block">
          <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
            List name
          </span>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage dark:border-border-dark dark:text-ink-dark"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
            Your name
          </span>
          <input
            type="text"
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage dark:border-border-dark dark:text-ink-dark"
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
          className="press-scale mt-4 w-full rounded-[var(--radius-lg)] bg-sage py-2.5 text-footnote font-semibold text-white disabled:opacity-40 active:bg-sage-dark"
        >
          Save
        </button>

        <button
          type="button"
          onClick={handleCheckForUpdate}
          className="mt-2 w-full rounded-[var(--radius-lg)] py-2.5 text-footnote font-medium text-sage active:bg-sage/10 dark:active:bg-sage/20"
        >
          Check for updates
        </button>
        {updateMessage && (
          <p className="mt-1.5 text-center text-footnote text-warm-gray dark:text-warm-gray-light">
            {updateMessage}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setShowSettings(false)
            onLeave()
          }}
          className="mt-2 w-full rounded-[var(--radius-lg)] py-2.5 text-footnote font-medium text-error active:bg-error-banner"
        >
          Leave List
        </button>
      </BottomSheet>
      )}
    </div>
  )
}
