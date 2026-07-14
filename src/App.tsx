import { useList } from './hooks/useList'
import { usePwaUpdate } from './hooks/usePwaUpdate'
import { Welcome } from './components/Welcome'
import { ListView } from './components/ListView'
import { UpdateBanner } from './components/UpdateBanner'
import { ViewportProvider } from './components/ViewportProvider'

export default function App() {
  const list = useList()
  const pwa = usePwaUpdate()

  let content

  if (!list.configured) {
    content = <SetupRequired />
  } else if (!list.session) {
    content = (
      <Welcome
        loading={list.loading}
        error={list.error}
        onCreate={list.createList}
        onJoin={list.joinList}
        onClearError={list.clearError}
      />
    )
  } else {
    content = (
      <ListView
        session={list.session}
        onLeave={list.leaveList}
        onUpdateListName={list.updateListName}
        onUpdateDisplayName={list.updateDisplayName}
        onCheckForUpdate={pwa.checkForUpdate}
        updateAvailable={pwa.needRefresh}
      />
    )
  }

  return (
    <ViewportProvider>
      <UpdateBanner
        visible={pwa.needRefresh}
        onRefresh={pwa.refresh}
        onDismiss={pwa.dismiss}
      />
      {content}
    </ViewportProvider>
  )
}

function SetupRequired() {
  return (
    <div className="safe-top safe-bottom flex min-h-vv h-vv flex-col items-center justify-center bg-cream px-5 dark:bg-surface">
      <div className="max-w-sm text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="mt-3 text-2xl font-semibold text-ink dark:text-ink-dark">
          Almost ready!
        </h1>
        <p className="mt-2 text-sm text-warm-gray dark:text-warm-gray-light">
          Copy <code className="rounded bg-cream-dark px-1.5 py-0.5 text-meta dark:bg-surface-raised">.env.example</code> to{' '}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-meta dark:bg-surface-raised">.env.local</code> and add your Supabase credentials.
        </p>
        <p className="mt-3 text-meta text-warm-gray-light">
          Then run the migration in{' '}
          <code className="text-meta">supabase/migrations/001_initial_schema.sql</code>
        </p>
      </div>
    </div>
  )
}
