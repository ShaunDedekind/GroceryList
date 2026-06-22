import { useState } from 'react'

interface ShareSheetProps {
  code: string
  onClose: () => void
}

export function ShareSheet({ code, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)

  const formattedCode = code.match(/.{1,3}/g)?.join('-') ?? code

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = code
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our Grocery List',
          text: `Join our grocery list with code: ${code}`,
        })
        return
      } catch {
        // User cancelled or share failed
      }
    }
    handleCopy()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="safe-bottom w-full max-w-lg rounded-t-3xl bg-white px-6 pb-8 pt-6 dark:bg-[#2a2825]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-cream-dark dark:bg-[#3a3835]" />

        <h3 className="text-center text-lg font-semibold text-[#2c2825] dark:text-[#f0ebe3]">
          Share your list
        </h3>
        <p className="mt-2 text-center text-sm text-warm-gray dark:text-warm-gray-light">
          Send this code to your partner so they can join
        </p>

        <div className="mt-6 rounded-2xl bg-cream-dark/60 py-6 text-center dark:bg-[#1a1917]">
          <p className="font-mono text-4xl font-bold tracking-[0.2em] text-sage dark:text-sage-light">
            {formattedCode}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-2xl bg-sage py-4 text-lg font-semibold text-white active:bg-sage-dark"
          >
            {copied ? 'Copied!' : 'Share Code'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-2xl border border-cream-dark py-4 text-lg font-medium text-warm-gray active:bg-cream-dark/60 dark:border-[#3a3835] dark:text-warm-gray-light"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}
