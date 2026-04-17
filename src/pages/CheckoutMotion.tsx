import { useMemo, useState } from 'react'
import { ShipTo } from '../components/ShipTo'
import { Method } from '../components/Method'
import { Payment } from '../components/Payment'

export function CheckoutMotion() {
  // Default corresponds to "Expand" frame. Clicking amount toggles to "Collapsed".
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [shippingPrice, setShippingPrice] = useState<number>(0)
  const subtotal = 50.0
  const tax = 0
  const total = useMemo(() => subtotal + shippingPrice + tax, [subtotal, shippingPrice, tax])

  return (
    <div className="container col" style={{ gap: 24 }}>
      <header className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="title" style={{ fontSize: 20, margin: 0 }}>Checkout</h1>
        <button className="summary-bill" onClick={() => setCollapsed(v => !v)} aria-pressed={collapsed}>
          <span className="muted">Total</span>
          <strong>${total.toFixed(2)}</strong>
        </button>
      </header>

      <main className="row" style={{ alignItems: 'flex-start' }}>
        <section className="col" style={{ flex: 2 }}>
          <ShipTo />
          <Method onChange={setShippingPrice} />
          <Payment />
        </section>

        <aside
          className="card col"
          style={{
            flex: 1,
            padding: 24,
            position: 'sticky',
            top: 24,
            height: collapsed ? 72 : 'auto',
            overflow: 'hidden',
            transition: 'height var(--dur-slow) var(--ease-in-out), box-shadow var(--dur-med) var(--ease-in-out)'
          }}
          aria-label="Order summary"
        >
          <h2 className="title" style={{ fontSize: 16, margin: 0 }}>Order summary</h2>
          {!collapsed && (
            <>
              <div className="col" style={{ gap: 8 }}>
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="Shipping" value={shippingPrice === 0 ? 'Free' : `$${shippingPrice.toFixed(2)}`} />
                <Row label="Tax" value={`$${tax.toFixed(2)}`} />
              </div>
              <hr style={{ border: 0, borderTop: '1px solid var(--color-border)' }} />
            </>
          )}
          <Row label={<strong>Total</strong>} value={<strong>${total.toFixed(2)}</strong>} />
        </aside>
      </main>
    </div>
  )
}

function Row({ label, value }: { label: React.ReactNode, value: React.ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}


