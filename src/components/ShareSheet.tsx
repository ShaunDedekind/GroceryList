import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getJoinUrl } from '../lib/joinUrl'
import { BottomSheet } from './BottomSheet'

interface ShareSheetProps {
  code: string
  onClose: () => void
}

export function ShareSheet({ code, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const formattedCode = code.match(/.{1,3}/g)?.join('-') ?? code
  const joinUrl = getJoinUrl(code)

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#1c1917', light: '#00000000' },
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
    <BottomSheet onClose={onClose}>
      <h3 className="text-title font-semibold text-ink dark:text-ink-dark">
        Share your list
      </h3>
      <p className="mt-1.5 text-footnote text-warm-gray dark:text-warm-gray-light">
        Scan the QR code or share the list code
      </p>

      <div className="mt-4 rounded-[var(--radius-lg)] bg-grouped py-5 text-center dark:bg-surface">
        <p className="break-all px-3 font-mono text-3xl font-bold tracking-[0.15em] text-sage dark:text-sage-light">
          {formattedCode}
        </p>
      </div>

      {qrDataUrl && (
        <div className="mt-3 flex flex-col items-center">
          <img
            src={qrDataUrl}
            alt="QR code to join this grocery list"
            className="rounded-[var(--radius-md)] bg-cream p-2 dark:bg-surface"
            width={200}
            height={200}
          />
          <p className="mt-1.5 max-w-xs text-center text-footnote text-warm-gray-light">
            Scan to open join flow on another phone
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        <button
          type="button"
          onClick={handleShare}
          className="press-scale w-full rounded-[var(--radius-lg)] bg-sage py-2.5 text-footnote font-semibold text-white active:bg-sage-dark"
        >
          {copied ? 'Copied!' : 'Share Code'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="press-scale w-full rounded-[var(--radius-lg)] border border-separator py-2.5 text-footnote font-medium text-warm-gray active:bg-cream-dark dark:text-warm-gray-light"
        >
          Copy to Clipboard
        </button>
      </div>
    </BottomSheet>
  )
}
