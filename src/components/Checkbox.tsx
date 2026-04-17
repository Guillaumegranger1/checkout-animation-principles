import { useState } from 'react'

type CheckboxProps = {
  label: string
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
}

export function Checkbox({ label, defaultChecked = false, onChange }: CheckboxProps) {
  const [checked, setChecked] = useState(defaultChecked)

  function toggle() {
    const next = !checked
    setChecked(next)
    onChange?.(next)
  }

  return (
    <div
      className={`cb-root${checked ? ' cb-root--checked' : ''}`}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      {/* 18×18 square box */}
      <div className="cb-box" aria-hidden>
        {checked && (
          <span className="cb-check-wrap">
            <svg
              className="cb-check"
              viewBox="0 0 12 10"
              fill="none"
              aria-hidden
            >
              <path
                d="M1.5 5L4.5 8L10.5 1.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>

      <span className="cb-label">{label}</span>
    </div>
  )
}
