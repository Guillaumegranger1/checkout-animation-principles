import React, { useState } from 'react'
import { Section } from './Section'

export function OrderSummaryGuest({
  onPayNow,
  isPaying = false,
  isLeaving = false,
  spinnerVariant = 'circle',
  spinnerTrail = false,
  spinnerMs = 350,
  spinnerEnabled = true,
  guestCheckout = false,
  thumbnails,
  bopis = false
}: {
  onPayNow: () => void
  isPaying?: boolean
  isLeaving?: boolean
  spinnerVariant?: 'circle' | 'concentric' | 'orbit' | 'arc' | 'sweep'
  spinnerTrail?: boolean
  spinnerMs?: number
  spinnerEnabled?: boolean
  guestCheckout?: boolean
  thumbnails?: { images: string[]; count: number }
  bopis?: boolean
}) {
  const restClass = `panel-rest ${isLeaving ? 'fade-out' : (isPaying ? 'dim' : '')}`
  const renderSpinner = () => {
    const core =
      spinnerVariant === 'concentric' ? (
        <span className="spinner-concentric" aria-hidden>
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="ring r3" />
        </span>
      ) : spinnerVariant === 'orbit' ? (
        <span className="spinner-orbit" aria-hidden>
          <svg className="inner one" viewBox="0 0 44 44" aria-hidden focusable="false">
            <circle className="orbit" cx="22" cy="22" r="18" pathLength="100" />
          </svg>
          <svg className="inner two" viewBox="0 0 44 44" aria-hidden focusable="false">
            <circle className="orbit" cx="22" cy="22" r="18" pathLength="100" />
          </svg>
          <svg className="inner three" viewBox="0 0 44 44" aria-hidden focusable="false">
            <circle className="orbit" cx="22" cy="22" r="18" pathLength="100" />
          </svg>
        </span>
      ) : spinnerVariant === 'arc' ? (
        <span className="spinner-arc" aria-hidden>
          <svg viewBox="0 0 66 66" aria-hidden focusable="false">
            <circle className="path" cx="33" cy="33" r="26" pathLength="100" />
          </svg>
        </span>
      ) : spinnerVariant === 'sweep' ? (
        <span className="spinner-conic" aria-hidden />
      ) : (
        <span className="btn-spinner" aria-hidden />
      )
    return (
      <span className="spin-wrap">
        {spinnerTrail ? <span className="trail" aria-hidden>{core}</span> : null}
        {core}
      </span>
    )
  }
  return (
    <div className="paynow-panel">
      {/* Header */}
      {!guestCheckout ? (
        <header className={`os-header ${restClass}`}>
          <div />
          <div className="os-header-title">Plain Goods</div>
          <img src="/images/bag.svg" className="os-bag" width="20" height="20" aria-hidden alt="" />
        </header>
      ) : null}

      {/* Top row: shop logo + email pill */}
      {!guestCheckout ? (
        <div className={`os-top-row ${restClass}`}>
          <img src="/images/logo-shop.svg" alt="Shop" className="os-shop-logo" />
          <div className="os-email-pill">jordan.chen@shopify.com</div>
        </div>
      ) : null}

      {/* Removed email input per request */}

      {/* Removed marketing opt-in per request */}

      {/* Ship / Pickup */}
      {!guestCheckout ? (
        <div className={`toggle-group ${restClass}`}>
          <div
            className="toggle-highlight"
            style={{
              left: '4px'
            }}
          />
          <button type="button" className="toggle-card selected">
            <div className="toggle-row">
              <span className="toggle-title">Ship</span>
            </div>
          </button>
          <button type="button" className="toggle-card">
            <div className="toggle-row">
              <span className="toggle-title">Pickup</span>
            </div>
          </button>
        </div>
      ) : null}

      {/* Summary Card replaced with Rollups Sections */}
      {!guestCheckout ? (
        <div className={restClass}>
          <RollupsSummary bopis={bopis} />
        </div>
      ) : null}

      {/* Payment methods (Shop disabled only) */}
      {guestCheckout ? (
        <div className={`pm-block ${restClass}`}>
          <div className="form-subtitle pm-title">Payment method</div>
          <div className="pm-card-form" aria-live="polite">
              <div className="pm-form-row">
                <div className="pm-form-col">
                  <div className="pm-form-label">Card number</div>
                  <div className="pm-form-value">424242424242</div>
                </div>
              </div>
              <div className="pm-form-row two">
                <div className="pm-form-col">
                  <div className="pm-form-label">Expiry date</div>
                  <div className="pm-form-value">1234</div>
                </div>
                <div className="pm-form-col">
                  <div className="pm-form-label">CVV</div>
                  <div className="pm-form-value">222</div>
                </div>
              </div>
              <div className="pm-form-row">
                <div className="pm-form-col">
                  <div className="pm-form-label">Name on card</div>
                  <div className="pm-form-value">Jordan Chen</div>
                </div>
              </div>
          </div>
        </div>
      ) : null}

      {/* Save info (Shop disabled only) */}
      {guestCheckout ? (
        <div className={`saveinfo-block ${restClass}`}>
          <div className="form-subtitle saveinfo-subtitle">Save information for a faster checkout</div>
          <div className="form-card saveinfo-card">
            <div className="field">
              <div className="input icon-left saveinfo-field">
                <input
                  className="input-plain saveinfo-input"
                  type="text"
                  placeholder="Mobile phone (optional)"
                  aria-label="Mobile phone (optional)"
                />
              </div>
            </div>
          </div>
          <div className="saveinfo-legal">
            By providing your phone number, you agree to create a Shop account subject to Shop’s
            {' '}<a href="https://shop.app/terms" target="_blank" rel="noreferrer">Terms</a> and{' '}
            <a href="https://shop.app/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
          </div>
        </div>
      ) : null}

      {/* Discount code */}
      <div className={`discount-block ${restClass}`}>
        <div className="form-subtitle discount-subtitle">Discounts or gift cards</div>
        <div className="form-card discount-card">
          <div className="field">
            <div className="input icon-left discount-field">
              <input className="input-plain discount-input" type="text" placeholder="Discount or gift card" aria-label="Discount or gift card" />
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails + price */}
      {(() => {
        const fallback = ['/images/image1.png', '/images/image2.png', '/images/image3.png']
        const imgs = thumbnails ? thumbnails.images.slice(0, 3) : fallback
        const count = thumbnails ? thumbnails.count : 3
        const overflow = count > 3 ? count - 2 : 0
        return (
          <div
            className={`os-thumb-row ${restClass}`}
            style={{ ['--thumb-count' as any]: Math.min(count, 3) }}
          >
            {imgs.map((src, i) => {
              const showBadge = overflow > 0 && i === 2
              return (
                <div key={i} className={`os-thumb${showBadge ? ' badge' : ''}`}>
                  <img src={src} alt="" />
                  {showBadge && <span className="qty">+{overflow}</span>}
                </div>
              )
            })}
            <div className="os-price">
              <span className="chip">CAD</span>
              <span className="amount">$61.02</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M1.42843 3.39258L4.74732 6.71147C4.8868 6.85094 5.11293 6.85094 5.2524 6.71147L8.57129 3.39258" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )
      })()}

      {/* Pay now (reuse Sheets button styling) */}
      <button
        type="button"
        className={`sheet-pay-btn ${guestCheckout ? 'guest' : ''} ${isLeaving ? 'leaving' : ''}`}
        onClick={onPayNow}
        disabled={isPaying}
        style={{ ['--spinner-ms' as any]: `${spinnerMs}ms` }}
      >
        {isPaying && !isLeaving && spinnerEnabled ? renderSpinner() : 'Pay now'}
      </button>
      <div className={`os-secure ${restClass}`}>
        <div className="os-secure-left">
          <svg className="os-secure-lock" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="10" width="16" height="10" rx="2" stroke="#000" strokeWidth="2"/>
            <path d="M8 10V8C8 5.791 9.791 4 12 4s4 1.791 4 4v2" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Secure and encrypted</span>
        </div>
        <span className="os-secure-right">Terms and conditions</span>
      </div>
    </div>
  )
}

function RollupsSummary({ bopis = false }: { bopis?: boolean }) {
  const [openMap, setOpen] = useState<Record<number, boolean>>({})
  const [selectedAddress, setSelectedAddress] = useState<number>(0)
  const [selectedMethod, setSelectedMethod] = useState<number>(0)
  const [selectedPayment, setSelectedPayment] = useState<number>(0)
  const toggle = (idx: number) => setOpen(prev => ({ ...prev, [idx]: !prev[idx] }))
  return (
    <div className="rollups-card" style={{ marginTop: 0 }}>
      <Section
        title={bopis ? "Pick up" : "Ship to"}
        summary={
          <div className="col" style={{ gap: 6 }}>
            <div className="value-main">Jordan Chen</div>
            <div className="value-sub">{bopis ? "1250 Montcalm, Montreal, QC, H2L 3G7" : "151 O’Connor St, Ottawa, ON, K2P 2L8, CA"}</div>
          </div>
        }
        open={!!openMap[0]}
        onToggle={() => toggle(0)}
      >
        <div className="address-list" role="radiogroup" aria-label="Shipping addresses">
          <div
            className={`address-option ${selectedAddress === 0 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedAddress === 0}
            tabIndex={0}
            onClick={() => setSelectedAddress(0)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 6 }}>
              <div className="address-name">Jordan Chen</div>
              <div className="address-lines">315 Oxford St, Ottawa, ON, K2P 2L8, CA</div>
            </div>
            <div className="address-right">
              <span className="pill-default-small">Default</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="more-dots" aria-hidden>
                <circle cx="12" cy="5" r="2" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="19" r="2" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div
            className={`address-option ${selectedAddress === 1 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedAddress === 1}
            tabIndex={0}
            onClick={() => setSelectedAddress(1)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 6 }}>
              <div className="address-name">Jordan Chen</div>
              <div className="address-lines">620 King Street West, Toronto ON M5V 1M6, CA</div>
            </div>
            <div className="address-right" />
          </div>
        </div>
      </Section>

      <Section
        title="Method"
        summary={
          <div className="col" style={{ gap: 6 }}>
            <div className="value-main">{selectedMethod === 0 ? 'FedEx Ground · FREE' : 'USPS Priority'}</div>
            <div className="value-sub">{selectedMethod === 0 ? '1 to 2 weeks' : '1 to 3 business days'}</div>
          </div>
        }
        open={!!openMap[1]}
        onToggle={() => toggle(1)}
      >
        <div className="address-list" role="radiogroup" aria-label="Shipping methods">
          <div
            className={`address-option ${selectedMethod === 0 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedMethod === 0}
            tabIndex={0}
            onClick={() => setSelectedMethod(0)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 6 }}>
              <div className="address-name">FedEx&nbsp;Ground</div>
              <div className="value-sub">1 to 2 weeks</div>
            </div>
            <div className="method-right">
              <div className="method-price">$10.00</div>
              <span className="pill-default-small">Lowest price</span>
            </div>
          </div>
          <div
            className={`address-option ${selectedMethod === 1 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedMethod === 1}
            tabIndex={0}
            onClick={() => setSelectedMethod(1)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 6 }}>
              <div className="address-name">USPS&nbsp;Priority</div>
              <div className="value-sub">1 to 3 business days</div>
            </div>
            <div className="method-right">
              <div className="method-price">$20.00</div>
              <span className="pill-default-small">Fastest</span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Payment"
        summary={
          selectedPayment === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div className="value-main" style={{ whiteSpace: 'nowrap' }}>Visa ···· 4242</div>
              <span className="visa-pill" aria-hidden>
                <img src="/images/visa.png" alt="Visa" />
              </span>
            </div>
          ) : selectedPayment === 1 ? (
            <div className="value-main" style={{ whiteSpace: 'nowrap' }}>American Express ···· 1006</div>
          ) : (
            <div className="value-main" style={{ whiteSpace: 'nowrap' }}>Apple&nbsp;Pay</div>
          )
        }
        open={!!openMap[2]}
        onToggle={() => toggle(2)}
      >
        <div className="address-list" role="radiogroup" aria-label="Payment methods">
          <div
            className={`address-option ${selectedPayment === 0 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedPayment === 0}
            tabIndex={0}
            onClick={() => setSelectedPayment(0)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 6 }}>
              <div className="address-name" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>Visa ···· 4242</span>
                <span className="visa-pill" aria-hidden><img src="/images/visa.png" alt="Visa" /></span>
              </div>
              <div className="value-sub">Jordan&nbsp;Chen, Exp.&nbsp;01/26</div>
            </div>
            <div className="address-right">
              <span className="pill-default-small">Default</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="more-dots" aria-hidden>
                <circle cx="12" cy="5" r="2" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="19" r="2" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div
            className={`address-option payment-compact ${selectedPayment === 1 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedPayment === 1}
            tabIndex={0}
            onClick={() => setSelectedPayment(1)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 0 }}>
              <div className="address-name" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>American&nbsp;Express&nbsp;·&nbsp;1006</span>
                <span className="visa-pill" aria-hidden><img src="/images/american_express.png" alt="AMEX" /></span>
              </div>
            </div>
            <div className="address-right" />
          </div>
          <div
            className={`address-option payment-compact ${selectedPayment === 2 ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedPayment === 2}
            tabIndex={0}
            onClick={() => setSelectedPayment(2)}
          >
            <div className="radio" />
            <div className="col" style={{ gap: 0 }}>
              <div className="address-name" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>Apple&nbsp;Pay</span>
                <span className="visa-pill" aria-hidden><img src="/images/apple_pay.png" alt="Apple Pay" /></span>
              </div>
            </div>
            <div className="address-right" />
          </div>
        </div>
      </Section>
    </div>
  )
}


