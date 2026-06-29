import { useState } from 'react'
import { parseJoinCodeFromUrl, clearJoinParamFromUrl } from '../lib/joinUrl'

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
      <div className="flex min-h-dvh flex-col bg-cream dark:bg-surface">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
          <span className="text-5xl">🛒</span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">
            Grocery List
          </h1>
          <p className="mt-2 max-w-xs text-center text-sm text-warm-gray dark:text-warm-gray-light">
            A shared list for you and your partner. No login — just share a code.
          </p>
        </div>

        <div className="safe-bottom space-y-2.5 px-5 pb-6">
          <button
            type="button"
            onClick={() => switchMode('create')}
            className="press-scale w-full rounded-2xl bg-sage py-3 text-sm font-semibold text-white active:bg-sage-dark"
          >
            Create a List
          </button>
          <button
            type="button"
            onClick={() => switchMode('join')}
            className="press-scale w-full rounded-2xl border-2 border-sage/30 bg-white py-3 text-sm font-semibold text-sage active:bg-sage/5 dark:border-sage/40 dark:bg-surface-raised dark:text-sage-light"
          >
            Join with Code
          </button>
        </div>
      </div>
    )
  }

  const isCreate = mode === 'create'

  return (
    <div className="flex min-h-dvh flex-col bg-cream dark:bg-surface">
      <header className="safe-top flex items-center gap-2 px-4 pt-3">
        <button
          type="button"
          onClick={() => switchMode('home')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-warm-gray active:bg-cream-dark dark:active:bg-surface-raised"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-title font-semibold text-ink dark:text-ink-dark">
          {isCreate ? 'Create a List' : 'Join a List'}
        </h2>
      </header>

      <form
        className="flex flex-1 flex-col px-5 pt-6"
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
          <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
            Your name
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Simon"
            required
            autoFocus={isCreate}
            className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-body outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:bg-surface-raised dark:text-ink-dark"
          />
        </label>

        {isCreate ? (
          <label className="mt-4 block">
            <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
              List name
            </span>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Our Grocery List"
              className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-body outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:bg-surface-raised dark:text-ink-dark"
            />
          </label>
        ) : (
          <label className="mt-4 block">
            <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
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
              className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-center font-mono text-xl tracking-widest outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:bg-surface-raised dark:text-ink-dark"
            />
          </label>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-meta text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="safe-bottom mt-auto pb-6 pt-6">
          <button
            type="submit"
            disabled={loading || !displayName.trim() || (!isCreate && !code.trim())}
            className="press-scale w-full rounded-2xl bg-sage py-3 text-sm font-semibold text-white disabled:opacity-50 active:bg-sage-dark"
          >
            {loading ? 'One moment…' : isCreate ? 'Create List' : 'Join List'}
          </button>
        </div>
      </form>
    </div>
  )
}
