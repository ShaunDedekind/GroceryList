/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('App smoke', () => {
  it('renders without crashing when Supabase is not configured', async () => {
    const container = document.createElement('div')
    container.id = 'root'
    document.body.appendChild(container)

    const { default: App } = await import('./App')

    await act(async () => {
      createRoot(container).render(<App />)
    })

    expect(container.textContent).toMatch(/Almost ready|Create|Join|Grocery|Shop|Home/i)
  })

  it('renders ListView shell when session exists', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    })

    store.set(
      'grocery-list-session',
      JSON.stringify({
        listId: '00000000-0000-0000-0000-000000000001',
        listCode: 'TEST01',
        listName: 'Test List',
        displayName: 'Tester',
      }),
    )

    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

    const container = document.createElement('div')
    document.body.appendChild(container)

    vi.resetModules()
    const { default: App } = await import('./App')

    let error: unknown
    try {
      await act(async () => {
        createRoot(container).render(<App />)
      })
    } catch (e) {
      error = e
    }

    if (error) {
      console.error('Render error:', error)
    }

    expect(error).toBeUndefined()
    expect(container.textContent?.length ?? 0).toBeGreaterThan(0)
    expect(container.textContent).toMatch(/Test List|Shop|Home/i)
  })
})
