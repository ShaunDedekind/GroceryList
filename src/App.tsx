import { useList } from './hooks/useList'
import { Welcome } from './components/Welcome'
import { ListView } from './components/ListView'

export default function App() {
  const list = useList()

  if (!list.configured) {
    return <SetupRequired />
  }

  if (!list.session) {
    return (
      <Welcome
        loading={list.loading}
        error={list.error}
        onCreate={list.createList}
        onJoin={list.joinList}
        onClearError={list.clearError}
      />
    )
  }

  return (
    <ListView
      session={list.session}
      onLeave={list.leaveList}
      onUpdateListName={list.updateListName}
    />
  )
}

function SetupRequired() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 dark:bg-[#141c27]">
      <div className="max-w-sm text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="mt-4 text-2xl font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
          Almost ready!
        </h1>
        <p className="mt-3 text-warm-gray dark:text-warm-gray-light">
          Copy <code className="rounded bg-cream-dark px-1.5 py-0.5 text-sm dark:bg-[#1e2a3a]">.env.example</code> to{' '}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-sm dark:bg-[#1e2a3a]">.env.local</code> and add your Supabase credentials.
        </p>
        <p className="mt-4 text-sm text-warm-gray-light">
          Then run the migration in{' '}
          <code className="text-xs">supabase/migrations/001_initial_schema.sql</code>
        </p>
      </div>
    </div>
  )
}
