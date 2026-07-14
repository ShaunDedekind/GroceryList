import { useState } from 'react'
import { parseJoinCodeFromUrl, clearJoinParamFromUrl } from '../lib/joinUrl'
import { BrandMark, Icon } from './Icon'

interface WelcomeProps {
  loading: boolean
  error: string | null
  onCreate: (displayName: string, listName?: string) => void
  onJoin: (code: string, displayName: string) => void
  onClearError: () => void
}

type Mode = 'home' | 'create' | 'join'

function getInitialWelcomeState(): { mode: Mode; code: string; hadJoinLink: boolean } {
  const joinCode = parseJoinCodeFromUrl()
  if (joinCode) {
    return { mode: 'join', code: joinCode, hadJoinLink: true }
  }
  return { mode: 'home', code: '', hadJoinLink: false }
}

const initialWelcome = getInitialWelcomeState()
if (initialWelcome.hadJoinLink) {
  clearJoinParamFromUrl()
}

export function Welcome({ loading, error, onCreate, onJoin, onClearError }: WelcomeProps) {
  const [mode, setMode] = useState<Mode>(initialWelcome.mode)
  const [displayName, setDisplayName] = useState('')
  const [listName, setListName] = useState('Our Grocery List')
  const [code, setCode] = useState(initialWelcome.code)

  const switchMode = (next: Mode) => {
    onClearError()
    setMode(next)
  }

  if (mode === 'home') {
    return (
      <div className="safe-top flex min-h-vv h-vv flex-col bg-cream px-gutter dark:bg-surface">
        <div className="flex flex-1 flex-col justify-end pb-8">
          <BrandMark />
          <h1 className="mt-6 text-large-title font-semibold text-ink dark:text-ink-dark">
            Groceries
          </h1>
          <p className="mt-2 max-w-sm text-body text-warm-gray dark:text-warm-gray-light">
            Share a list with your partner. No account needed.
          </p>
        </div>

        <div className="safe-bottom space-y-3 pb-6">
          <button
            type="button"
            onClick={() => switchMode('create')}
            className="press-scale w-full rounded-[var(--radius-lg)] bg-sage py-3 text-footnote font-semibold text-white active:bg-sage-dark"
          >
            New list
          </button>
          <button
            type="button"
            onClick={() => switchMode('join')}
            className="press-scale w-full py-3 text-footnote font-semibold text-sage active:opacity-70 dark:text-sage-light"
          >
            Join with code
          </button>
        </div>
      </div>
    )
  }

  const isCreate = mode === 'create'

  return (
    <div className="flex min-h-vv h-vv flex-col bg-cream dark:bg-surface">
      <header className="safe-top flex items-center gap-2 px-gutter pt-3">
        <button
          type="button"
          onClick={() => switchMode('home')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-warm-gray active:bg-cream-dark dark:active:bg-surface-raised"
          aria-label="Go back"
        >
          <Icon name="back" size="md" />
        </button>
        <h2 className="text-title font-semibold text-ink dark:text-ink-dark">
          {isCreate ? 'New list' : 'Join with code'}
        </h2>
      </header>

      <form
        className="flex flex-1 flex-col px-gutter pt-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (isCreate) {
            onCreate(displayName, listName)
          } else {
            onJoin(code, displayName)
          }
        }}
      >
        <label className="block">
          <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
            Your name
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Simon"
            required
            autoFocus={isCreate}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:text-ink-dark"
          />
        </label>

        {isCreate ? (
          <label className="mt-4 block">
            <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
              List name
            </span>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Our Grocery List"
              className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:text-ink-dark"
            />
          </label>
        ) : (
          <label className="mt-4 block">
            <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
              List code
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              required
              maxLength={8}
              autoFocus={!isCreate && Boolean(code)}
              className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-center font-mono text-xl tracking-widest outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:text-ink-dark"
            />
          </label>
        )}

        {error && (
          <p className="mt-3 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
            {error}
          </p>
        )}

        <div className="safe-bottom mt-auto pb-6 pt-6">
          <button
            type="submit"
            disabled={loading || !displayName.trim() || (!isCreate && !code.trim())}
            className="press-scale w-full rounded-[var(--radius-lg)] bg-sage py-3 text-footnote font-semibold text-white disabled:opacity-50 active:bg-sage-dark"
          >
            {loading ? 'One moment…' : isCreate ? 'Create list' : 'Join list'}
          </button>
        </div>
      </form>
    </div>
  )
}
