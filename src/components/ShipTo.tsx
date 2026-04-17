import { useState } from 'react'
import { Section } from './Section'

export function ShipTo() {
  const [open, setOpen] = useState<boolean>(true)
  const [address, setAddress] = useState({
    name: 'Alex Doe',
    line1: '123 Market Street',
    city: 'San Francisco',
    zip: '94107',
    country: 'United States'
  })

  const summary = `${address.name}, ${address.city}`

  return (
    <Section title="Ship to" summary={summary} open={open} onToggle={() => setOpen(v => !v)}>
      <div className="col" style={{ gap: 12 }}>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <Input label="Name" value={address.name} onChange={v => setAddress({ ...address, name: v })} />
          <Input label="Address" value={address.line1} onChange={v => setAddress({ ...address, line1: v })} />
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <Input label="City" value={address.city} onChange={v => setAddress({ ...address, city: v })} />
          <Input label="ZIP" value={address.zip} onChange={v => setAddress({ ...address, zip: v })} />
          <Input label="Country" value={address.country} onChange={v => setAddress({ ...address, country: v })} />
        </div>
      </div>
    </Section>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="col" style={{ gap: 6, minWidth: 220, flex: 1 }}>
      <span className="muted" style={{ fontSize: 12 }}>{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--color-border)' }}
      />
    </label>
  )
}


