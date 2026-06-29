import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { getJoinUrl } from '../lib/joinUrl'

interface ShareSheetProps {
  code: string
  onClose: () => void
}

export function ShareSheet({ code, onClose }: ShareSheetProps) {
  useBodyScrollLock(true)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const formattedCode = code.match(/.{1,3}/g)?.join('-') ?? code
  const joinUrl = getJoinUrl(code)

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#00000000' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [joinUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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
          url: joinUrl,
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
        className="safe-bottom w-full max-w-lg rounded-t-3xl bg-white px-5 pb-6 pt-5 shadow-lg dark:bg-surface-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-cream-dark dark:bg-border-dark" />

        <h3 className="text-center text-title font-semibold text-ink dark:text-ink-dark">
          Share your list
        </h3>
        <p className="mt-1.5 text-center text-meta text-warm-gray dark:text-warm-gray-light">
          Scan the QR code or share the list code
        </p>

        <div className="mt-4 rounded-2xl bg-cream-dark/60 py-5 text-center dark:bg-surface">
          <p className="break-all px-3 font-mono text-3xl font-bold tracking-[0.15em] text-sage dark:text-sage-light">
            {formattedCode}
          </p>
        </div>

        {qrDataUrl && (
          <div className="mt-3 flex flex-col items-center">
            <img
              src={qrDataUrl}
              alt="QR code to join this grocery list"
              className="rounded-xl bg-white p-2 dark:bg-surface"
              width={200}
              height={200}
            />
            <p className="mt-1.5 max-w-xs text-center text-meta text-warm-gray-light">
              Scan to open join flow on another phone
            </p>
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="press-scale w-full rounded-2xl bg-sage py-2.5 text-sm font-semibold text-white active:bg-sage-dark"
          >
            {copied ? 'Copied!' : 'Share Code'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="press-scale w-full rounded-2xl border border-cream-dark py-2.5 text-sm font-medium text-warm-gray active:bg-cream-dark/60 dark:border-border-dark dark:text-warm-gray-light"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}
