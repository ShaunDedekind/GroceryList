import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getJoinUrl } from '../lib/joinUrl'

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
        className="safe-bottom w-full max-w-lg rounded-t-3xl bg-white px-6 pb-8 pt-6 dark:bg-[#1e2a3a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-cream-dark dark:bg-[#2d3f54]" />

        <h3 className="text-center text-lg font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
          Share your list
        </h3>
        <p className="mt-2 text-center text-sm text-warm-gray dark:text-warm-gray-light">
          Scan the QR code or share the list code
        </p>

        <div className="mt-6 rounded-2xl bg-cream-dark/60 py-6 text-center dark:bg-[#141c27]">
          <p className="font-mono text-4xl font-bold tracking-[0.2em] text-sage dark:text-sage-light">
            {formattedCode}
          </p>
        </div>

        {qrDataUrl && (
          <div className="mt-4 flex flex-col items-center">
            <img
              src={qrDataUrl}
              alt="QR code to join this grocery list"
              className="rounded-xl bg-white p-2 dark:bg-[#141c27]"
              width={200}
              height={200}
            />
            <p className="mt-2 max-w-xs text-center text-xs text-warm-gray-light">
              Scan to open join flow on another phone
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleShare}
            className="press-scale w-full rounded-2xl bg-sage py-4 text-lg font-semibold text-white active:bg-sage-dark"
          >
            {copied ? 'Copied!' : 'Share Code'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="press-scale w-full rounded-2xl border border-cream-dark py-4 text-lg font-medium text-warm-gray active:bg-cream-dark/60 dark:border-[#2d3f54] dark:text-warm-gray-light"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}
