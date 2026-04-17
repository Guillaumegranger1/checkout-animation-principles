import { useState } from 'react'

export type RadioOption = {
  id: string
  label: string
  description?: string
  price?: string
  badge?: string
}

type RadioGroupProps = {
  options: RadioOption[]
  defaultValue?: string
  onChange?: (id: string) => void
}

export function RadioGroup({ options, defaultValue, onChange }: RadioGroupProps) {
  const [selected, setSelected] = useState(defaultValue ?? options[0]?.id)

  function select(id: string) {
    setSelected(id)
    onChange?.(id)
  }

  return (
    <div className="rg-group" role="radiogroup">
      {options.map((opt) => {
        const isSelected = selected === opt.id
        return (
          <div
            key={opt.id}
            className={`rg-item${isSelected ? ' rg-item--selected' : ''}`}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => select(opt.id)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                select(opt.id)
              }
            }}
          >
            {/* Inner content — press-scale target */}
            <div className="rg-inner">
              {/* 18×18 radio indicator */}
              <div
                className={`rg-indicator${isSelected ? ' rg-indicator--selected' : ''}`}
                aria-hidden
              >
                {/* Inner dot — spring-animated via CSS keyframes */}
                {isSelected && <div className="rg-dot" key={opt.id} />}
              </div>

              {/* Label + description */}
              <div className="rg-text">
                <span className="rg-label">{opt.label}</span>
                {opt.description && (
                  <span className="rg-desc">{opt.description}</span>
                )}
              </div>

              {/* Price + badge */}
              {opt.price && (
                <div className="rg-price-col">
                  <span className="rg-price">{opt.price}</span>
                  {opt.badge && (
                    <span className="rg-badge">{opt.badge}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
