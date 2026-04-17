import React from 'react'

export function OrderSummaryGuestEmbed({ onPayNow }: { onPayNow: () => void }) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)

  React.useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc) return
        // Find the "Pay now" button by text within span
        const btns = Array.from(doc.querySelectorAll('button'))
        const payBtn = btns.find(b => b.textContent?.trim().includes('Pay now'))
        if (payBtn) {
          payBtn.addEventListener('click', (e) => {
            e.preventDefault()
            onPayNow()
          })
        }
        // Remove page shadow background if needed
        doc.body.style.background = 'transparent'
      } catch {
        // cross-origin or other issues; ignore
      }
    }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [onPayNow])

  return (
    <iframe
      ref={iframeRef}
      title="Order Summary Guest"
      src="/order-summary/out/index.html"
      className="os-embed"
    />
  )
}


