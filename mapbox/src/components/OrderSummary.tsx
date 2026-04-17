export default function OrderSummary() {
  return (
    <div className="order-summary">
      <span className="order-items">4 items</span>
      <div className="order-right">
        <div className="order-thumbnails">
          <div className="order-thumbnail" style={{ background: '#d4a574' }} />
          <div className="order-thumbnail" style={{ background: '#a8d5ba' }} />
          <div className="order-thumbnail" style={{ background: '#87ceeb' }} />
        </div>
        <span className="order-price">$76.00</span>
        <span style={{ color: '#9ca3af' }}>▾</span>
      </div>
    </div>
  )
}
