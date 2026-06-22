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
      <div className="flex min-h-dvh flex-col bg-cream dark:bg-[#141c27]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <span className="text-6xl">🛒</span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#1e293b] dark:text-[#e2e8f0]">
            Grocery List
          </h1>
          <p className="mt-3 max-w-xs text-center text-warm-gray dark:text-warm-gray-light">
            A shared list for you and your partner. No login — just share a code.
          </p>
        </div>

        <div className="safe-bottom space-y-3 px-6 pb-8">
          <button
            type="button"
            onClick={() => switchMode('create')}
            className="press-scale w-full rounded-2xl bg-sage py-4 text-lg font-semibold text-white active:bg-sage-dark"
          >
            Create a List
          </button>
          <button
            type="button"
            onClick={() => switchMode('join')}
            className="press-scale w-full rounded-2xl border-2 border-sage/30 bg-white py-4 text-lg font-semibold text-sage active:bg-sage/5 dark:border-sage/40 dark:bg-[#1e2a3a] dark:text-sage-light"
          >
            Join with Code
          </button>
        </div>
      </div>
    )
  }

  const isCreate = mode === 'create'

  return (
    <div className="flex min-h-dvh flex-col bg-cream dark:bg-[#141c27]">
      <header className="safe-top flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          onClick={() => switchMode('home')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-warm-gray active:bg-cream-dark dark:active:bg-[#1e2a3a]"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
          {isCreate ? 'Create a List' : 'Join a List'}
        </h2>
      </header>

      <form
        className="flex flex-1 flex-col px-6 pt-8"
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
          <span className="text-sm font-medium text-warm-gray dark:text-warm-gray-light">
            Your name
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Simon"
            required
            autoFocus={isCreate}
            className="mt-2 w-full rounded-xl border border-cream-dark bg-white px-4 py-3.5 text-lg outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-[#2d3f54] dark:bg-[#1e2a3a] dark:text-[#e2e8f0]"
          />
        </label>

        {isCreate ? (
          <label className="mt-5 block">
            <span className="text-sm font-medium text-warm-gray dark:text-warm-gray-light">
              List name
            </span>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Our Grocery List"
              className="mt-2 w-full rounded-xl border border-cream-dark bg-white px-4 py-3.5 text-lg outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-[#2d3f54] dark:bg-[#1e2a3a] dark:text-[#e2e8f0]"
            />
          </label>
        ) : (
          <label className="mt-5 block">
            <span className="text-sm font-medium text-warm-gray dark:text-warm-gray-light">
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
              className="mt-2 w-full rounded-xl border border-cream-dark bg-white px-4 py-3.5 text-center font-mono text-2xl tracking-widest outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-[#2d3f54] dark:bg-[#1e2a3a] dark:text-[#e2e8f0]"
            />
          </label>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="safe-bottom mt-auto pb-8 pt-8">
          <button
            type="submit"
            disabled={loading || !displayName.trim() || (!isCreate && !code.trim())}
            className="press-scale w-full rounded-2xl bg-sage py-4 text-lg font-semibold text-white disabled:opacity-50 active:bg-sage-dark"
          >
            {loading ? 'One moment…' : isCreate ? 'Create List' : 'Join List'}
          </button>
        </div>
      </form>
    </div>
  )
}
