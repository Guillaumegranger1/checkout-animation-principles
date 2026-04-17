import { useState } from 'react'
import { Section } from './Section'

type Option = { id: string; label: string; eta: string; price: number }
const OPTIONS: Option[] = [
  { id: 'std', label: 'Standard', eta: '3–5 business days', price: 0 },
  { id: 'exp', label: 'Express', eta: '1–2 business days', price: 12 },
  { id: 'nxt', label: 'Next-day', eta: 'Tomorrow', price: 24 }
]

export function Method({ onChange }: { onChange?: (price: number) => void }) {
  const [open, setOpen] = useState<boolean>(true)
  const [selected, setSelected] = useState<Option>(OPTIONS[0])

  const summary = `${selected.label} • ${selected.eta}`

  function select(option: Option) {
    setSelected(option)
    onChange?.(option.price)
  }

  return (
    <Section title="Method" summary={summary} open={open} onToggle={() => setOpen(v => !v)}>
      <div className="col" style={{ gap: 8 }}>
        {OPTIONS.map(opt => (
          <label key={opt.id} className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <input
                type="radio"
                name="shipping-method"
                checked={selected.id === opt.id}
                onChange={() => select(opt)}
              />
              <div className="col" style={{ gap: 2 }}>
                <span>{opt.label}</span>
                <span className="muted" style={{ fontSize: 12 }}>{opt.eta}</span>
              </div>
            </div>
            <span>{opt.price === 0 ? 'Free' : `$${opt.price.toFixed(2)}`}</span>
          </label>
        ))}
      </div>
    </Section>
  )
}


