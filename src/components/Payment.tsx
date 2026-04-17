import { useState } from 'react'
import { Section } from './Section'

type Card = { brand: 'Visa' | 'Mastercard' | 'Amex'; last4: string }

export function Payment() {
  const [open, setOpen] = useState<boolean>(true)
  const [card, setCard] = useState<Card>({ brand: 'Visa', last4: '4242' })

  const summary = `${card.brand} •••• ${card.last4}`

  return (
    <Section title="Payment" summary={summary} open={open} onToggle={() => setOpen(v => !v)}>
      <div className="col" style={{ gap: 12 }}>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <Select
            label="Brand"
            value={card.brand}
            options={['Visa', 'Mastercard', 'Amex']}
            onChange={v => setCard({ ...card, brand: v as Card['brand'] })}
          />
          <Input label="Card number" placeholder="0000 0000 0000 0000" />
          <Input label="Name on card" />
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <Input label="Expiry" placeholder="MM/YY" />
          <Input label="CVC" placeholder="123" />
          <Input label="ZIP" placeholder="94107" />
        </div>
      </div>
    </Section>
  )
}

function Input({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="col" style={{ gap: 6, minWidth: 200, flex: 1 }}>
      <span className="muted" style={{ fontSize: 12 }}>{label}</span>
      <input
        placeholder={placeholder}
        style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--color-border)' }}
      />
    </label>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="col" style={{ gap: 6, minWidth: 200, flex: 1 }}>
      <span className="muted" style={{ fontSize: 12 }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--color-border)' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}


