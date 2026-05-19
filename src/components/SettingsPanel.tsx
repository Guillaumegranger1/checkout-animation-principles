import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Cubic = [number, number, number, number]

function CopyButton({ getText }: { getText: () => string }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isShown, setIsShown] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const holdTimer = useRef<number | null>(null)
  const fadeTimer = useRef<number | null>(null)
  const FADE_MS = 160
  const HOLD_MS = 1400
  const btnRef = useRef<HTMLButtonElement>(null)
  const updatePos = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.top, left: r.right + 10 })
  }
  const onClick = () => {
    const text = (getText?.() || '').trim()
    if (text) {
      navigator.clipboard?.writeText(text)
      setCopied(true)
      setIsShown(true)
      updatePos()
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
      holdTimer.current = window.setTimeout(() => {
        // start fade-out
        setIsShown(false)
        // keep "Copied" heading during fade-out
        fadeTimer.current = window.setTimeout(() => {
          setCopied(false)
        }, FADE_MS)
      }, HOLD_MS)
    }
  }
  useEffect(() => {
    if (!(hovered || isShown)) return
    updatePos()
    const onScroll = () => updatePos()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    // also listen on nearest '.panel-body' scroll container
    let scroller: HTMLElement | null = null
    try {
      let p = btnRef.current?.parentElement
      while (p && !p.classList.contains('panel-body')) p = p.parentElement as HTMLElement | null
      scroller = p ?? null
      scroller?.addEventListener('scroll', onScroll, { passive: true } as any)
    } catch {}
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      scroller?.removeEventListener('scroll', onScroll as any)
    }
  }, [hovered, isShown])
  useEffect(() => {
    return () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
    }
  }, [])
  const text = (getText?.() || '').trim()
  const showTooltip = hovered || isShown
  return (
    <div className="copy-btn-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button ref={btnRef} className="icon-btn" title="Copy easing" onClick={onClick}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
      {showTooltip
        ? createPortal(
            <div
              className={`copy-tooltip portal ${showTooltip ? 'show' : ''} ${copied ? 'copied' : ''}`}
              role="status"
              aria-live="polite"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="copy-tt-head">
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden style={{ marginRight: 6 }}>
                      <path d="M16.5 6.5L8.25 14.5L3.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>Copy:</>
                )}
              </div>
              <div className="copy-tt-body">
                <code>{text || '-'}</code>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false)
  const iconRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  useEffect(() => {
    if (!hovered) return
    const el = iconRef.current
    if (!el) return
    const update = () => {
      const r = el.getBoundingClientRect()
      setPos({ top: r.top + r.height / 2, left: r.right + 10 })
    }
    update()
    const onScroll = () => update()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    let scroller: HTMLElement | null = null
    try {
      let p = el.parentElement
      while (p && !p.classList.contains('panel-body')) p = p.parentElement as HTMLElement | null
      scroller = p ?? null
      scroller?.addEventListener('scroll', onScroll, { passive: true } as any)
    } catch {}
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      scroller?.removeEventListener('scroll', onScroll as any)
    }
  }, [hovered])
  return (
    <>
      <span
        ref={iconRef}
        className="info-icon"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-hidden
      />
      {hovered
        ? createPortal(
            <div
              className="copy-tooltip portal show"
              role="status"
              aria-live="polite"
              style={{ top: pos.top, left: pos.left, position: 'fixed' as const }}
            >
              <div className="copy-tt-body" style={{ maxWidth: 300, whiteSpace: 'normal' }}>
                {text}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}

type SettingsPanelProps = {
  title: string
  isRollups: boolean
  isTokens?: boolean
  isToggles?: boolean
  isSheets?: boolean
  isPayNow?: boolean
  isSpinner?: boolean
  isMicro?: boolean
  microPressTransitions?: boolean
  setMicroPressTransitions?: Dispatch<SetStateAction<boolean>>
  microChoiceUnit?: 'px' | '%'
  setMicroChoiceUnit?: Dispatch<SetStateAction<'px' | '%'>>
  microChoiceGap?: number
  setMicroChoiceGap?: Dispatch<SetStateAction<number>>
  microCheckmark?: 'spring' | 'draw'
  setMicroCheckmark?: Dispatch<SetStateAction<'spring' | 'draw'>>
  microScreenWidth?: number
  setMicroScreenWidth?: Dispatch<SetStateAction<number>>
  expandMs: number
  setExpandMs: Dispatch<SetStateAction<number>>
  expandCubic: Cubic
  setExpandCubic: Dispatch<SetStateAction<Cubic>>
  collapseMs: number
  setCollapseMs: Dispatch<SetStateAction<number>>
  collapseCubic: Cubic
  setCollapseCubic: Dispatch<SetStateAction<Cubic>>
  toggleMs?: number
  setToggleMs?: Dispatch<SetStateAction<number>>
  toggleCubic?: Cubic
  setToggleCubic?: Dispatch<SetStateAction<Cubic>>
  sheetOpenMs?: number
  setSheetOpenMs?: Dispatch<SetStateAction<number>>
  sheetOpenCubic?: Cubic
  setSheetOpenCubic?: Dispatch<SetStateAction<Cubic>>
  sheetMass?: number
  setSheetMass?: Dispatch<SetStateAction<number>>
  sheetStiffness?: number
  setSheetStiffness?: Dispatch<SetStateAction<number>>
  sheetDamping?: number
  setSheetDamping?: Dispatch<SetStateAction<number>>
  sheetOpenEasing?: string
  sheetCloseMs?: number
  setSheetCloseMs?: Dispatch<SetStateAction<number>>
  sheetCloseCubic?: Cubic
  setSheetCloseCubic?: Dispatch<SetStateAction<Cubic>>
  /** Sheets Close mode + easing for copy */
  sheetCloseMode?: 'spring' | 'bezier'
  setSheetCloseMode?: Dispatch<SetStateAction<'spring' | 'bezier'>>
  sheetCloseEasing?: string
  onSpringChange?: () => void
  // Pay now thumbnails morph (spring) + pause duration
  thumbMs?: number
  setThumbMs?: Dispatch<SetStateAction<number>>
  thumbMass?: number
  setThumbMass?: Dispatch<SetStateAction<number>>
  thumbStiffness?: number
  setThumbStiffness?: Dispatch<SetStateAction<number>>
  thumbDamping?: number
  setThumbDamping?: Dispatch<SetStateAction<number>>
  thumbEasing?: string
  thumbMode?: 'spring' | 'bezier'
  setThumbMode?: Dispatch<SetStateAction<'spring' | 'bezier'>>
  thumbCubic?: Cubic
  setThumbCubic?: Dispatch<SetStateAction<Cubic>>
  expandSpring?: { mass: number; stiffness: number; damping: number }
  setExpandSpring?: Dispatch<SetStateAction<{ mass: number; stiffness: number; damping: number }>>
  collapseSpring?: { mass: number; stiffness: number; damping: number }
  setCollapseSpring?: Dispatch<SetStateAction<{ mass: number; stiffness: number; damping: number }>>
  toggleSpring?: { mass: number; stiffness: number; damping: number }
  setToggleSpring?: Dispatch<SetStateAction<{ mass: number; stiffness: number; damping: number }>>
  pauseMs?: number
  setPauseMs?: Dispatch<SetStateAction<number>>
  spinnerMs?: number
  setSpinnerMs?: Dispatch<SetStateAction<number>>
  // Success screen stagger controls
  stgMs?: number
  setStgMs?: Dispatch<SetStateAction<number>>
  stgFirst?: number
  setStgFirst?: Dispatch<SetStateAction<number>>
  stgStep?: number
  setStgStep?: Dispatch<SetStateAction<number>>
  stgOffset?: number
  setStgOffset?: Dispatch<SetStateAction<number>>
  stgBlur?: number
  setStgBlur?: Dispatch<SetStateAction<number>>
  stgExitEnabled?: boolean
  setStgExitEnabled?: Dispatch<SetStateAction<boolean>>
  reduceMotion?: boolean
  setReduceMotion?: Dispatch<SetStateAction<boolean>>
  numberOfItems?: '1' | '2' | '3' | '4' | '5+'
  setNumberOfItems?: Dispatch<SetStateAction<'1' | '2' | '3' | '4' | '5+'>>
  /** Pay now: Digital product toggle */
  digitalProduct?: boolean
  setDigitalProduct?: Dispatch<SetStateAction<boolean>>
  /** Pay now: BOPIS toggle */
  bopis?: boolean
  setBopis?: Dispatch<SetStateAction<boolean>>
  /** Pay now: Selected product */
  selectedProduct?: '1-item' | '2-items' | '3-items' | '4-items' | '5-items' | 'shoe' | 'flute' | 'tire' | 'tennis'
  setSelectedProduct?: Dispatch<SetStateAction<'1-item' | '2-items' | '3-items' | '4-items' | '5-items' | 'shoe' | 'flute' | 'tire' | 'tennis'>>
  /** Pay now: Map style (light preset or full style URL) */
  mapStyle?: string
  setMapStyle?: Dispatch<SetStateAction<string>>
  /** Pay now: Static map (skip camera animation) */
  staticMap?: boolean
  setStaticMap?: Dispatch<SetStateAction<boolean>>
  /** Pay now: callback when address is geocoded to coordinates */
  onMapCenterChange?: (center: [number, number] | undefined) => void
  /** Pay now: callback with short address label when geocoded (e.g. "11 W 53rd St") */
  onMapAddressChange?: (label: string | undefined) => void
  /** Dark mode toggle */
  darkMode?: boolean
  setDarkMode?: Dispatch<SetStateAction<boolean>>
  /** Pay now: Guest checkout toggle */
  guestCheckout?: boolean
  setGuestCheckout?: Dispatch<SetStateAction<boolean>>
  /** Pay now: Shop percentile (P50/P90) */
  shopPercentile?: 'p50' | 'p90'
  setShopPercentile?: Dispatch<SetStateAction<'p50' | 'p90'>>
  // Spinner page options
  spinnerTrail?: boolean
  setSpinnerTrail?: Dispatch<SetStateAction<boolean>>
  spinnerTrailOffset?: number
  setSpinnerTrailOffset?: Dispatch<SetStateAction<number>>
  // Pay now spinner variant
  paySpinner?: 'circle' | 'concentric' | 'orbit' | 'arc' | 'sweep'
  setPaySpinner?: Dispatch<SetStateAction<'circle' | 'concentric' | 'orbit' | 'arc' | 'sweep'>>
  paySpinnerMs?: number
  setPaySpinnerMs?: Dispatch<SetStateAction<number>>
  spinnerEnabled?: boolean
  setSpinnerEnabled?: Dispatch<SetStateAction<boolean>>
  onGoToSpinner?: () => void
  expandMode?: 'spring' | 'bezier'
  setExpandMode?: Dispatch<SetStateAction<'spring' | 'bezier'>>
  collapseMode?: 'spring' | 'bezier'
  setCollapseMode?: Dispatch<SetStateAction<'spring' | 'bezier'>>
  togMode?: 'spring' | 'bezier'
  setTogMode?: Dispatch<SetStateAction<'spring' | 'bezier'>>
  sheetMode?: 'spring' | 'bezier'
  setSheetMode?: Dispatch<SetStateAction<'spring' | 'bezier'>>
  onReset: () => void
}

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    title, isRollups, isTokens, isToggles, isSheets, isPayNow, isSpinner,
    expandMs, setExpandMs, expandCubic, setExpandCubic,
    collapseMs, setCollapseMs, collapseCubic, setCollapseCubic,
    toggleMs, setToggleMs, toggleCubic, setToggleCubic,
    sheetOpenMs, setSheetOpenMs, sheetOpenCubic, setSheetOpenCubic,
    sheetMass, setSheetMass, sheetStiffness, setSheetStiffness,
    sheetDamping, setSheetDamping,
    sheetOpenEasing,
    sheetCloseMs, setSheetCloseMs, sheetCloseCubic, setSheetCloseCubic, sheetCloseMode, setSheetCloseMode, sheetCloseEasing,
    onSpringChange,
    thumbMs, setThumbMs, thumbMass, setThumbMass, thumbStiffness, setThumbStiffness, thumbDamping, setThumbDamping, thumbEasing,
    thumbMode, setThumbMode, thumbCubic, setThumbCubic,
    pauseMs, setPauseMs, spinnerMs, setSpinnerMs,
    stgMs, setStgMs, stgFirst, setStgFirst, stgStep, setStgStep, stgOffset, setStgOffset, stgBlur, setStgBlur, stgExitEnabled, setStgExitEnabled,
    onReset
  } = props
  const [addressInput, setAddressInput] = useState('')
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const geocodeAddress = (query: string) => {
    if (!query.trim()) return
    setGeocodeStatus('loading')
    const token = import.meta.env.VITE_MAPBOX_TOKEN ?? ''
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`)
      .then(r => r.json())
      .then(data => {
        const feature = data?.features?.[0]
        const coords = feature?.center as [number, number] | undefined
        if (coords) {
          props.onMapCenterChange?.(coords)
          const short = [feature.address, feature.text].filter(Boolean).join(' ')
          props.onMapAddressChange?.(short || undefined)
          setGeocodeStatus('idle')
        } else {
          setGeocodeStatus('error')
        }
      })
      .catch(() => setGeocodeStatus('error'))
  }

  const [principleVisible, setPrincipleVisible] = useState<boolean>(false)
  const [principleOpen, setPrincipleOpen] = useState<boolean>(false)
  const [perfMetricsVisible, setPerfMetricsVisible] = useState<boolean>(false)
  const [perfMetricsOpen, setPerfMetricsOpen] = useState<boolean>(false)
  // mode values are driven by parent when provided; otherwise default to bezier
  const expandMode: 'spring' | 'bezier' = props.expandMode ?? 'bezier'
  const setExpandMode = (props.setExpandMode ?? (() => {})) as (v: 'spring' | 'bezier') => void
  const collapseMode: 'spring' | 'bezier' = props.collapseMode ?? 'bezier'
  const setCollapseMode = (props.setCollapseMode ?? (() => {})) as (v: 'spring' | 'bezier') => void
  const togMode: 'spring' | 'bezier' = props.togMode ?? 'bezier'
  const setTogMode = (props.setTogMode ?? (() => {})) as (v: 'spring' | 'bezier') => void
  // Sheets open mode is driven by parent to keep demo in sync
  const expandSpring = props.expandSpring ?? { mass: 1, stiffness: 302, damping: 26 }
  const setExpandSpring = props.setExpandSpring ?? ((_: any) => {})
  const collapseSpring = props.collapseSpring ?? { mass: 1, stiffness: 302, damping: 26 }
  const setCollapseSpring = props.setCollapseSpring ?? ((_: any) => {})
  const togSpring = props.toggleSpring ?? { mass: 1, stiffness: 302, damping: 26 }
  const setTogSpring = props.setToggleSpring ?? ((_: any) => {})
  // local tooltip state for Pay-now pause slider
  const pauseRef = useRef<HTMLInputElement>(null)
  const [pauseTipLeft, setPauseTipLeft] = useState<number>(0)
  const [pauseShowTip, setPauseShowTip] = useState<boolean>(false)
  // local tooltip state for spinner slider
  const spinnerRef = useRef<HTMLInputElement>(null)
  const [spinnerTipLeft, setSpinnerTipLeft] = useState<number>(0)
  const [spinnerShowTip, setSpinnerShowTip] = useState<boolean>(false)
  // Tokens: toggle between base and amplified token sets
  const [amplifiedTokens, setAmplifiedTokens] = useState<boolean>(true)
  // tooltips for Section stagger sliders
  const stgMsRef = useRef<HTMLInputElement>(null)
  const [stgMsLeft, setStgMsLeft] = useState<number>(0)
  const [stgMsShow, setStgMsShow] = useState<boolean>(false)
  const stgFirstRef = useRef<HTMLInputElement>(null)
  const [stgFirstLeft, setStgFirstLeft] = useState<number>(0)
  const [stgFirstShow, setStgFirstShow] = useState<boolean>(false)
  const stgStepRef = useRef<HTMLInputElement>(null)
  const [stgStepLeft, setStgStepLeft] = useState<number>(0)
  const [stgStepShow, setStgStepShow] = useState<boolean>(false)
  const stgOffsetRef = useRef<HTMLInputElement>(null)
  const [stgOffsetLeft, setStgOffsetLeft] = useState<number>(0)
  const [stgOffsetShow, setStgOffsetShow] = useState<boolean>(false)
  const updatePauseTip = (value: number) => {
    const el = pauseRef.current
    if (!el) return
    const min = 0, max = 2000
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (value - min) / (max - min)))
    setPauseTipLeft(pct * rect.width)
  }
  const updateSpinnerTip = (value: number) => {
    const el = spinnerRef.current
    if (!el) return
    const min = 100, max = 1200
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (value - min) / (max - min)))
    setSpinnerTipLeft(pct * rect.width)
  }
  const updateStgTip = (el: HTMLInputElement | null, min: number, max: number, value: number, setLeft: (n:number)=>void) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (value - min) / (max - min)))
    setLeft(pct * rect.width)
  }
  useEffect(() => {
    if (pauseMs != null) updatePauseTip(pauseMs)
  }, [pauseMs])
  useEffect(() => {
    if (spinnerMs != null) updateSpinnerTip(spinnerMs)
  }, [spinnerMs])
  useEffect(() => {
    if (stgMs != null) updateStgTip(stgMsRef.current, 100, 1500, stgMs, setStgMsLeft)
  }, [stgMs])
  useEffect(() => {
    if (stgFirst != null) updateStgTip(stgFirstRef.current, 0, 1000, stgFirst, setStgFirstLeft)
  }, [stgFirst])
  useEffect(() => {
    if (stgStep != null) updateStgTip(stgStepRef.current, 0, 600, stgStep, setStgStepLeft)
  }, [stgStep])
  useEffect(() => {
    if (stgOffset != null) updateStgTip(stgOffsetRef.current, 0, 60, stgOffset, setStgOffsetLeft)
  }, [stgOffset])
  const openPrinciple = () => {
    setPrincipleVisible(true)
    requestAnimationFrame(() => setPrincipleOpen(true))
  }
  const closePrinciple = () => {
    setPrincipleOpen(false)
    setTimeout(() => setPrincipleVisible(false), 180)
  }
  const openPerfMetrics = () => {
    setPerfMetricsVisible(true)
    requestAnimationFrame(() => setPerfMetricsOpen(true))
  }
  const closePerfMetrics = () => {
    setPerfMetricsOpen(false)
    setTimeout(() => setPerfMetricsVisible(false), 180)
  }
  return (
    <div className={`settings-panel ${isPayNow ? 'with-devhud-offset' : ''}`}>
      <div className="menu-bar">
        <span className="menu-title">{title}</span>
      </div>
      <div className="panel-body">
      {isRollups ? (
        <>
          <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
            <button className="btn-chip" type="button" onClick={openPrinciple}>Principle</button>
            <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
          </div>
          <div className="settings-block">
            <div className="settings-heading-row">
              <div className="settings-heading">Expand</div>
              <div className="mode-toggle" style={{ ['--mt-index' as any]: expandMode === 'spring' ? 0 : 1 }}>
                <span className="mt-slider" aria-hidden />
                <button type="button" className={`mt-btn ${expandMode === 'spring' ? 'selected' : ''}`} onClick={() => setExpandMode('spring')} title="Spring">
                  <img src="/images/Spring.svg" alt="" />
                </button>
                <button type="button" className={`mt-btn ${expandMode === 'bezier' ? 'selected' : ''}`} onClick={() => setExpandMode('bezier')} title="Bezier">
                  <img src="/images/Smooth.svg" alt="" />
                </button>
              </div>
              <CopyButton getText={() => {
                const easingStr = expandMode === 'bezier'
                  ? `cubic-bezier(${expandCubic.map(n => Number(n).toFixed(2)).join(', ')})`
                  : `spring(m:${expandSpring.mass},k:${expandSpring.stiffness},c:${expandSpring.damping})`
                return `${expandMs}ms ${easingStr}`
              }} />
            </div>
            {expandMode === 'bezier' ? (
              <SectionRow title="" ms={expandMs} setMs={setExpandMs} cubic={expandCubic} setCubic={setExpandCubic} />
            ) : (
              <SectionSpringPhysical
                title=""
                ms={expandMs}
                setMs={setExpandMs}
                mass={expandSpring.mass}
                setMass={v => setExpandSpring(s => ({ ...s, mass: typeof v === 'function' ? (v as any)(s.mass) : v }))}
                stiffness={expandSpring.stiffness}
                setStiffness={v => setExpandSpring(s => ({ ...s, stiffness: typeof v === 'function' ? (v as any)(s.stiffness) : v }))}
                damping={expandSpring.damping}
                setDamping={v => setExpandSpring(s => ({ ...s, damping: typeof v === 'function' ? (v as any)(s.damping) : v }))}
                easing=""
              />
            )}
          </div>
          <div className="divider" />
          <div className="settings-block">
            <div className="settings-heading-row">
              <div className="settings-heading">Collapse</div>
              <div className="mode-toggle" style={{ ['--mt-index' as any]: collapseMode === 'spring' ? 0 : 1 }}>
                <span className="mt-slider" aria-hidden />
                <button type="button" className={`mt-btn ${collapseMode === 'spring' ? 'selected' : ''}`} onClick={() => setCollapseMode('spring')} title="Spring">
                  <img src="/images/Spring.svg" alt="" />
                </button>
                <button type="button" className={`mt-btn ${collapseMode === 'bezier' ? 'selected' : ''}`} onClick={() => setCollapseMode('bezier')} title="Bezier">
                  <img src="/images/Smooth.svg" alt="" />
                </button>
              </div>
              <CopyButton getText={() => {
                const easingStr = collapseMode === 'bezier'
                  ? `cubic-bezier(${collapseCubic.map(n => Number(n).toFixed(2)).join(', ')})`
                  : `spring(m:${collapseSpring.mass},k:${collapseSpring.stiffness},c:${collapseSpring.damping})`
                return `${collapseMs}ms ${easingStr}`
              }} />
            </div>
            {collapseMode === 'bezier' ? (
              <SectionRow title="" ms={collapseMs} setMs={setCollapseMs} cubic={collapseCubic} setCubic={setCollapseCubic} />
            ) : (
              <SectionSpringPhysical
                title=""
                ms={collapseMs}
                setMs={setCollapseMs}
                mass={collapseSpring.mass}
                setMass={v => setCollapseSpring(s => ({ ...s, mass: typeof v === 'function' ? (v as any)(s.mass) : v }))}
                stiffness={collapseSpring.stiffness}
                setStiffness={v => setCollapseSpring(s => ({ ...s, stiffness: typeof v === 'function' ? (v as any)(s.stiffness) : v }))}
                damping={collapseSpring.damping}
                setDamping={v => setCollapseSpring(s => ({ ...s, damping: typeof v === 'function' ? (v as any)(s.damping) : v }))}
                easing=""
              />
            )}
          </div>
        </>
        ) : isTokens ? (
          <>
            <div className="panel-actions" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CopyButton getText={() => `${expandMs}ms cubic-bezier(${expandCubic.map(n => Number(n).toFixed(2)).join(', ')})`} />
                <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
              </span>
            </div>
            <div className="settings-block" style={{ gap: 6 }}>
              <div className="settings-subheading" style={{ margin: '0 0 4px' }}>Curve type</div>
              <select
                className="select-chip"
                defaultValue="Ease out"
                aria-label="Easing preset"
                disabled
              >
                <option>Ease out</option>
                <option>Bounce</option>
              </select>
              <div className="settings-subheading" style={{ margin: '4px 0 4px' }}>Token</div>
              {/* Amplified token set toggle */}
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={amplifiedTokens}
                  onChange={e => setAmplifiedTokens(!!e.target.checked)}
                  aria-label="Amplified tokens"
                />
                Amplified tokens
              </label>
              {(() => {
                const basePresets: Record<string, { cubic: Cubic }> = {
                  'Gentle 200': { cubic: [0.45, 0.70, 0.55, 1.00] },
                  'Gentle 100': { cubic: [0.40, 0.70, 0.50, 1.00] },
                  'Base':       { cubic: [0.35, 0.70, 0.45, 1.00] },
                  'Snappy 100': { cubic: [0.30, 0.70, 0.40, 1.00] },
                  'Snappy 200': { cubic: [0.25, 0.70, 0.35, 1.00] },
                }
                const amplifiedPresets: Record<string, { cubic: Cubic }> = {
                  'Gentle 200': { cubic: [0.60, 0.70, 0.70, 1.00] },
                  'Gentle 100': { cubic: [0.50, 0.70, 0.60, 1.00] },
                  'Base':       { cubic: [0.40, 0.70, 0.50, 1.00] },
                  'Snappy 100': { cubic: [0.30, 0.70, 0.40, 1.00] },
                  'Snappy 200': { cubic: [0.20, 0.70, 0.30, 1.00] },
                }
                const getKeyFor = (c: Cubic): string | undefined => {
                  const eq = (a: number, b: number) => Math.abs(a - b) < 0.001
                  const [x1, y1, x2, y2] = c
                  const same = (arr: Cubic) => eq(x1, arr[0]) && eq(y1, arr[1]) && eq(x2, arr[2]) && eq(y2, arr[3])
                  // Check active set first to avoid collisions across sets (e.g., same curve under different label)
                  const primary = amplifiedTokens ? amplifiedPresets : basePresets
                  const secondary = amplifiedTokens ? basePresets : amplifiedPresets
                  for (const k of Object.keys(primary)) if (same(primary[k].cubic)) return k
                  for (const k of Object.keys(secondary)) if (same(secondary[k].cubic)) return k
                  return 'Custom'
                }
                const currentKey = getKeyFor(expandCubic)
                // Map current label to other set when toggled
                useEffect(() => {
                  if (currentKey && currentKey !== 'Custom') {
                    const map = amplifiedTokens ? amplifiedPresets : basePresets
                    const p = map[currentKey]
                    if (p) setExpandCubic(p.cubic)
                  }
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [amplifiedTokens])
                return (
                  <select
                    className="select-chip"
                    value={currentKey}
                    aria-label="Timing preset"
                    onChange={e => {
                      const val = e.target.value
                      const p = (amplifiedTokens ? amplifiedPresets : basePresets)[val]
                      if (p) setExpandCubic(p.cubic)
                    }}
                  >
                    <option>Gentle 200</option>
                    <option>Gentle 100</option>
                    <option>Base</option>
                    <option>Snappy 100</option>
                    <option>Snappy 200</option>
                    <option disabled>Custom</option>
                  </select>
                )
              })()}
            </div>
            <SectionRow title="" ms={expandMs} setMs={setExpandMs} cubic={expandCubic} setCubic={setExpandCubic} />
          </>
        ) : isToggles ? (
          <>
            <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn-chip" type="button" onClick={openPrinciple}>Principle</button>
              <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
            </div>
            <div className="settings-block">
              <div className="settings-heading-row">
                <div className="settings-heading">Selection</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: togMode === 'spring' ? 0 : 1 }}>
                  <span className="mt-slider" aria-hidden />
                  <button type="button" className={`mt-btn ${togMode === 'spring' ? 'selected' : ''}`} onClick={() => setTogMode('spring')} title="Spring">
                    <img src="/images/Spring.svg" alt="" />
                  </button>
                  <button type="button" className={`mt-btn ${togMode === 'bezier' ? 'selected' : ''}`} onClick={() => setTogMode('bezier')} title="Bezier">
                    <img src="/images/Smooth.svg" alt="" />
                  </button>
                </div>
                <CopyButton getText={() => {
                  const easingStr = togMode === 'bezier'
                    ? `cubic-bezier(${(toggleCubic ?? [0.4,0.7,0.5,1]).map(n => Number(n).toFixed(2)).join(', ')})`
                    : `spring(m:${togSpring.mass},k:${togSpring.stiffness},c:${togSpring.damping})`
                  return `${toggleMs}ms ${easingStr}`
                }} />
              </div>
              {togMode === 'bezier' ? (
                <SectionRow title="" ms={toggleMs!} setMs={setToggleMs!} cubic={toggleCubic!} setCubic={setToggleCubic!} />
              ) : (
                <SectionSpringPhysical
                  title=""
                  ms={toggleMs!}
                  setMs={setToggleMs!}
                  mass={togSpring.mass}
                setMass={v => setTogSpring(s => ({ ...s, mass: typeof v === 'function' ? (v as any)(s.mass) : v }))}
                  stiffness={togSpring.stiffness}
                setStiffness={v => setTogSpring(s => ({ ...s, stiffness: typeof v === 'function' ? (v as any)(s.stiffness) : v }))}
                  damping={togSpring.damping}
                setDamping={v => setTogSpring(s => ({ ...s, damping: typeof v === 'function' ? (v as any)(s.damping) : v }))}
                  easing=""
                />
              )}
            </div>
          </>
        ) : isSheets ? (
          <>
            <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn-chip" type="button" onClick={openPrinciple}>Principle</button>
              <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
            </div>
            <div className="settings-block">
              <div className="settings-heading-row">
                <div className="settings-heading">Open</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: (props.sheetMode ?? 'spring') === 'spring' ? 0 : 1 }}>
                  <span className="mt-slider" aria-hidden />
                  <button type="button" className={`mt-btn ${ (props.sheetMode ?? 'spring') === 'spring' ? 'selected' : '' }`} onClick={() => props.setSheetMode?.('spring')} title="Spring">
                    <img src="/images/Spring.svg" alt="" />
                  </button>
                  <button type="button" className={`mt-btn ${ (props.sheetMode ?? 'spring') === 'bezier' ? 'selected' : '' }`} onClick={() => props.setSheetMode?.('bezier')} title="Bezier">
                    <img src="/images/Smooth.svg" alt="" />
                  </button>
                </div>
                <CopyButton getText={() => `${sheetOpenMs}ms ${sheetOpenEasing}`} />
              </div>
              {(props.sheetMode ?? 'spring') === 'spring' ? (
                <SectionSpringPhysical
                  title=""
                  ms={sheetOpenMs!}
                  setMs={setSheetOpenMs!}
                  mass={sheetMass ?? 1}
                  setMass={setSheetMass!}
                  stiffness={sheetStiffness ?? 170}
                  setStiffness={setSheetStiffness!}
                  damping={sheetDamping ?? 26}
                  setDamping={setSheetDamping!}
                  easing={sheetOpenEasing ?? ''}
                  onChange={onSpringChange}
                />
              ) : (
                <SectionRow
                  title=""
                  ms={sheetOpenMs!}
                  setMs={setSheetOpenMs!}
                  cubic={sheetOpenCubic!}
                  setCubic={setSheetOpenCubic!}
                />
              )}
            </div>
            <div className="divider" />
            <div className="settings-block">
              <div className="settings-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Button spinner
                <div className="inline-toggle" style={{ ['--inline-index' as any]: (props as any).spinnerEnabled === false ? 1 : 0 }}>
                  <span className="inline-toggle-slider" aria-hidden />
                  <button className="inline-toggle-opt" onClick={() => (props as any).setSpinnerEnabled?.(true)}>On</button>
                  <button className="inline-toggle-opt" onClick={() => (props as any).setSpinnerEnabled?.(false)}>Off</button>
                </div>
              </div>
              <div className="settings-subheading" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="select-chip"
                  value={(props as any).paySpinner ?? 'circle'}
                  onChange={e => (props as any).setPaySpinner?.(e.target.value as any)}
                  aria-label="Spinner variant"
                >
                  <option value="circle">Circle</option>
                  <option value="concentric">Concentric rings</option>
                  <option value="orbit">3D orbits</option>
                  <option value="arc">Arc loader</option>
                  <option value="sweep">Arc sweep</option>
                </select>
                <a
                  role="button"
                  className="settings-subheading preview-link"
                  onClick={() => (props as any).onGoToSpinner?.()}
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fff', marginLeft: 'auto' }}
                >
                  preview &rarr;
                </a>
              </div>
            </div>
            <div className="settings-block">
              <div className="settings-heading">Spinner speed</div>
              <div className="settings-range">
                <div className={`range-tooltip ${spinnerShowTip ? 'show' : ''}`} style={{ left: spinnerTipLeft }}>{(props as any).paySpinnerMs ?? 350} ms</div>
                <input
                  ref={spinnerRef}
                  type="range"
                  min={100}
                  max={1200}
                  step={10}
                  value={(props as any).paySpinnerMs ?? 350}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    ;(props as any).setPaySpinnerMs?.(v)
                    updateSpinnerTip(v)
                    setSpinnerShowTip(true)
                  }}
                  onMouseEnter={() => setSpinnerShowTip(true)}
                  onMouseLeave={() => setSpinnerShowTip(false)}
                  onPointerDown={() => setSpinnerShowTip(true)}
                  onPointerUp={() => setSpinnerShowTip(false)}
                  aria-label="Spinner speed"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>100ms</span>
                  <span>{(props as any).paySpinnerMs ?? 350}ms</span>
                  <span>1200ms</span>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div className="settings-block">
              <div className="settings-heading-row">
                <div className="settings-heading">Close</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: (sheetCloseMode ?? 'bezier') === 'spring' ? 0 : 1 }}>
                  <span className="mt-slider" aria-hidden />
                  <button
                    type="button"
                    className={`mt-btn ${(sheetCloseMode ?? 'bezier') === 'spring' ? 'selected' : ''}`}
                    onClick={() => setSheetCloseMode?.('spring')}
                    title="Spring"
                  >
                    <img src="/images/Spring.svg" alt="" />
                  </button>
                  <button
                    type="button"
                    className={`mt-btn ${(sheetCloseMode ?? 'bezier') === 'bezier' ? 'selected' : ''}`}
                    onClick={() => setSheetCloseMode?.('bezier')}
                    title="Bezier"
                  >
                    <img src="/images/Smooth.svg" alt="" />
                  </button>
                </div>
                <CopyButton getText={() => {
                  const easeStr = (sheetCloseMode ?? 'bezier') === 'bezier'
                    ? `cubic-bezier(${(sheetCloseCubic ?? [0.5,0,0.6,0.3]).map(n=>Number(n).toFixed(2)).join(', ')})`
                    : (sheetCloseEasing ?? '')
                  const full = `${(sheetCloseMs ?? 0)}ms ${easeStr}`
                  return easeStr ? full.trim() : ''
                }} />
              </div>
              {(sheetCloseMode ?? 'bezier') === 'spring' ? (
                <SectionSpringPhysical
                  title=""
                  ms={sheetCloseMs!}
                  setMs={setSheetCloseMs!}
                  mass={sheetMass ?? 1}
                  setMass={setSheetMass!}
                  stiffness={sheetStiffness ?? 302}
                  setStiffness={setSheetStiffness!}
                  damping={sheetDamping ?? 26}
                  setDamping={setSheetDamping!}
                  easing={sheetCloseEasing ?? ''}
                />
              ) : (
                <SectionRow
                  title=""
                  ms={sheetCloseMs!}
                  setMs={setSheetCloseMs!}
                  cubic={sheetCloseCubic!}
                  setCubic={setSheetCloseCubic!}
                />
              )}
            </div>
          </>
        ) : isPayNow ? (
          <>
            <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn-chip" type="button" onClick={openPrinciple}>Principle</button>
              <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
            </div>
            <div className="settings-block" style={{ gap: 4 }}>
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 3px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={!!props.reduceMotion}
                  onChange={e => props.setReduceMotion?.(!!e.target.checked)}
                  aria-label="Reduce motion"
                />
                Reduce motion
                <InfoTooltip text={'\u201cReduce Motion\u201d is a phone accessibility setting. When enabled, it minimizes motion-heavy transitions, replacing sliding animations with simpler fade effects to create a calmer visual experience.'} />
              </label>
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={Boolean((props as any).darkMode)}
                  onChange={e => (props as any).setDarkMode?.(e.target.checked)}
                  aria-label="Dark mode"
                />
                Dark mode
              </label>
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={!Boolean((props as any).guestCheckout)}
                  onChange={e => (props as any).setGuestCheckout?.(!e.target.checked)}
                  aria-label="Shop"
                />
                Shop
              </label>
              {/* Shop percentile toggle - only show when Shop checkout is enabled */}
              {!Boolean((props as any).guestCheckout) && (
                <div className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px', paddingLeft: 28 }}>
                  <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Performance
                    <span
                      className="info-icon"
                      onClick={openPerfMetrics}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      aria-label="Performance metrics info"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPerfMetrics() }}
                    />
                  </span>
                  <select
                    className="select-chip"
                    value={(props as any).shopPercentile ?? 'p50'}
                    onChange={e => (props as any).setShopPercentile?.(e.target.value as 'p50' | 'p90')}
                    aria-label="Shop performance percentile"
                    style={{ minWidth: 80 }}
                  >
                    <option value="p50">P50</option>
                    <option value="p90">P90</option>
                  </select>
                </div>
              )}
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={!!(props as any).digitalProduct}
                  onChange={e => (props as any).setDigitalProduct?.(!!e.target.checked)}
                  aria-label="Digital product"
                />
                Digital product
              </label>
              {/* BOPIS toggle - hidden when Digital product is on */}
              {!(props as any).digitalProduct && (
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={!!(props as any).bopis}
                  onChange={e => (props as any).setBopis?.(!!e.target.checked)}
                  aria-label="BOPIS"
                />
                BOPIS
              </label>
              )}
              {/* Number of items selection - only show when digital product is enabled */}
              {!!(props as any).digitalProduct && (
                <div className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                  <span style={{ marginRight: 'auto' }}>Number of items</span>
                  <select
                    className="select-chip"
                    value={(props as any).selectedProduct ?? '3-items'}
                    onChange={e => (props as any).setSelectedProduct?.(e.target.value)}
                    aria-label="Number of items"
                    style={{ minWidth: 100 }}
                  >
                    <option value="1-item">1 item</option>
                    <option value="2-items">2 items</option>
                    <option value="3-items">3 items</option>
                    <option value="4-items">4 items</option>
                    <option value="5-items">5+ items</option>
                    <optgroup label="Image types">
                      <option value="shoe">Shoe</option>
                      <option value="flute">Flute</option>
                      <option value="tire">Car tire</option>
                      <option value="tennis">Tennis ball</option>
                    </optgroup>
                  </select>
                </div>
              )}
              {/* Number of items - only show when digital product is disabled */}
              {!(props as any).digitalProduct && (
                <div className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                  <span style={{ marginRight: 'auto' }}>Number of items</span>
                  <select
                    className="select-chip"
                    value={(props as any).numberOfItems ?? '2'}
                    onChange={e => (props as any).setNumberOfItems?.(e.target.value)}
                    aria-label="Number of items"
                    style={{ minWidth: 100 }}
                  >
                    <option value="1">1 item</option>
                    <option value="2">2 items</option>
                    <option value="3">3 items</option>
                    <option value="4">4 items</option>
                    <option value="5+">5+ items</option>
                  </select>
                </div>
              )}
              {/* Map setting - only show when digital product is disabled */}
              {!(props as any).digitalProduct && (
                <div className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                  <span style={{ marginRight: 'auto' }}>Map</span>
                  <select
                    className="select-chip"
                    value={(props as any).mapStyle ?? 'day|default'}
                    onChange={e => (props as any).setMapStyle?.(e.target.value)}
                    aria-label="Map style"
                    style={{ minWidth: 100 }}
                  >
                    <optgroup label="3D to flat">
                      <option value="amplified|day">Day (Zoom out)</option>
                      <option value="amplified|night">Night (Zoom out)</option>
                      <option value="amplified-zoomin|day">Day (Zoom in)</option>
                      <option value="amplified-zoomin|night">Night (Zoom in)</option>
                    </optgroup>
                    <optgroup label="Standard 3D - Default Theme">
                      <option value="day|default">Day</option>
                      <option value="dawn|default">Dawn</option>
                      <option value="dusk|default">Dusk</option>
                      <option value="mapbox://styles/guillaumegranger/cmndnrgz9001u01qq6sg87y7i|night|default">Night</option>
                    </optgroup>
                    <optgroup label="Standard Flat (No Buildings)">
                      <option value="day||flat">Day (Flat)</option>
                      <option value="dawn||flat">Dawn (Flat)</option>
                      <option value="dusk||flat">Dusk (Flat)</option>
                      <option value="night||flat">Night (Flat)</option>
                    </optgroup>
                    <optgroup label="Standard 3D - Monochrome Theme">
                      <option value="dawn|monochrome">Dawn (Monochrome)</option>
                      <option value="dusk|monochrome">Dusk (Monochrome)</option>
                    </optgroup>
                    <optgroup label="Classic Styles (Legacy)">
                      <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
                      <option value="mapbox://styles/mapbox/outdoors-v12">Outdoors</option>
                      <option value="mapbox://styles/mapbox/satellite-v9">Satellite (Classic)</option>
                      <option value="mapbox://styles/mapbox/light-v11">Light</option>
                      <option value="mapbox://styles/mapbox/dark-v11">Dark</option>
                    </optgroup>
                  </select>
                </div>
              )}
              {!(props as any).digitalProduct && (
                <div className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 4px' }}>
                  <span style={{ marginRight: 'auto' }}>Static map</span>
                  <label className="pill-toggle">
                    <input
                      type="checkbox"
                      checked={!!(props as any).staticMap}
                      onChange={e => (props as any).setStaticMap?.(e.target.checked)}
                      aria-label="Static map"
                    />
                    <span className="pill-toggle-track" />
                  </label>
                </div>
              )}
              {!(props as any).digitalProduct && (
                <div className="settings-subheading" style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Map address override</span>
                    {geocodeStatus === 'loading' && <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 'auto' }}>...</span>}
                    {geocodeStatus === 'error' && <span style={{ fontSize: 11, color: '#f66', marginLeft: 'auto' }}>Not found</span>}
                  </div>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      className="select-chip"
                      placeholder="e.g. 11 W 53rd St, New York"
                      value={addressInput}
                      style={{ width: '100%', textOverflow: 'ellipsis', backgroundImage: 'none', paddingRight: addressInput ? 28 : 10, boxSizing: 'border-box' }}
                      onChange={e => {
                        setAddressInput(e.target.value)
                        setGeocodeStatus('idle')
                        if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
                        geocodeTimer.current = setTimeout(() => geocodeAddress(e.target.value), 600)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
                          geocodeAddress(addressInput)
                        }
                      }}
                      aria-label="Map address override"
                    />
                    {addressInput && (
                      <button
                        type="button"
                        aria-label="Clear address"
                        onClick={() => {
                          setAddressInput('')
                          setGeocodeStatus('idle')
                          if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
                          props.onMapCenterChange?.(undefined)
                          props.onMapAddressChange?.(undefined)
                        }}
                        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.5, color: '#fff' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="divider" />
            <div className="settings-block">
              <div className="settings-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 }}>
                Button spinner
                <div className="inline-toggle" style={{ ['--inline-index' as any]: (props as any).spinnerEnabled === false ? 1 : 0 }}>
                  <span className="inline-toggle-slider" aria-hidden />
                  <button className="inline-toggle-opt" onClick={() => (props as any).setSpinnerEnabled?.(true)}>On</button>
                  <button className="inline-toggle-opt" onClick={() => (props as any).setSpinnerEnabled?.(false)}>Off</button>
                </div>
              </div>
              {(props as any).spinnerEnabled !== false && (
                <div className="settings-subheading" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    className="select-chip"
                    value={(props as any).paySpinner ?? 'circle'}
                    onChange={e => (props as any).setPaySpinner?.(e.target.value as any)}
                    aria-label="Spinner variant"
                  >
                    <option value="circle">Circle</option>
                    <option value="concentric">Concentric rings</option>
                    <option value="orbit">3D orbits</option>
                    <option value="arc">Arc loader</option>
                    <option value="sweep">Arc sweep</option>
                  </select>
                  <a
                    role="button"
                    className="settings-subheading preview-link"
                    onClick={() => (props as any).onGoToSpinner?.()}
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fff', marginLeft: 'auto' }}
                  >
                    preview &rarr;
                  </a>
                </div>
              )}
            </div>
            {(props as any).spinnerEnabled !== false && (
            <div className="settings-block">
              <div className="settings-heading">Spinner speed</div>
              <div className="settings-range">
                <div className={`range-tooltip ${spinnerShowTip ? 'show' : ''}`} style={{ left: spinnerTipLeft }}>{(props as any).paySpinnerMs ?? 350} ms</div>
                <input
                  ref={spinnerRef}
                  type="range"
                  min={100}
                  max={1200}
                  step={10}
                  value={(props as any).paySpinnerMs ?? 350}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    ;(props as any).setPaySpinnerMs?.(v)
                    updateSpinnerTip(v)
                    setSpinnerShowTip(true)
                  }}
                  onMouseEnter={() => setSpinnerShowTip(true)}
                  onMouseLeave={() => setSpinnerShowTip(false)}
                  onPointerDown={() => setSpinnerShowTip(true)}
                  onPointerUp={() => setSpinnerShowTip(false)}
                  aria-label="Spinner speed"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>100ms</span>
                  <span>{(props as any).paySpinnerMs ?? 350}ms</span>
                  <span>1200ms</span>
                </div>
              </div>
            </div>
            )}
            <div className="divider" />
            {(() => {
              const expSpring = props.expandSpring ?? { mass: 1, stiffness: 302, damping: 26 }
              const setExpSpring = props.setExpandSpring ?? (() => {})
              const colSpring = props.collapseSpring ?? { mass: 1, stiffness: 302, damping: 26 }
              const setColSpring = props.setCollapseSpring ?? (() => {})
              const togSpring = props.toggleSpring ?? { mass: 1, stiffness: 302, damping: 26 }
              const setTgSpring = props.setToggleSpring ?? (() => {})
              return (
            <div className="settings-block" style={{ opacity: props.reduceMotion ? 0.5 : 1, pointerEvents: props.reduceMotion ? 'none' : 'auto' }}>
              <div className="settings-heading-row">
                <div className="settings-heading">Checkmark slide</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: thumbMode === 'spring' ? 0 : 1 }}>
                  <span className="mt-slider" aria-hidden />
                  <button
                    type="button"
                    className={`mt-btn ${thumbMode === 'spring' ? 'selected' : ''}`}
                    onClick={() => setThumbMode?.('spring')}
                    title="Spring"
                  >
                    <img src="/images/Spring.svg" alt="" width="18" height="18" />
                  </button>
                  <button
                    type="button"
                    className={`mt-btn ${thumbMode === 'bezier' ? 'selected' : ''}`}
                    onClick={() => setThumbMode?.('bezier')}
                    title="Bezier"
                  >
                    <img src="/images/Smooth.svg" alt="" width="18" height="18" />
                  </button>
                </div>
                <CopyButton getText={() => {
                  const easingStr =
                    thumbMode === 'bezier'
                      ? `cubic-bezier(${(thumbCubic ?? [0.4,0.7,0.5,1]).map(n=>Number(n).toFixed(2)).join(', ')})`
                      : (thumbEasing ?? '')
                  const full = `${(thumbMs ?? 0)}ms ${easingStr}`
                  return easingStr ? full.trim() : ''
                }} />
              </div>
              {thumbMode === 'spring' ? (
                <SectionSpringPhysical
                  title=""
                  ms={thumbMs!}
                  setMs={setThumbMs!}
                  mass={thumbMass ?? 1}
                  setMass={setThumbMass!}
                  stiffness={thumbStiffness ?? 302}
                  setStiffness={setThumbStiffness!}
                  damping={thumbDamping ?? 26}
                  setDamping={setThumbDamping!}
                  easing={thumbEasing ?? ''}
                />
              ) : (
                <SectionRow
                  title=""
                  ms={thumbMs!}
                  setMs={setThumbMs!}
                  cubic={thumbCubic ?? [0.4, 0.7, 0.5, 1]}
                  setCubic={setThumbCubic!}
                />
              )}
            </div>
              )
            })()}
            <div className="divider" />
            <div className="settings-block">
              <div className="settings-heading">Paused checkmark duration</div>
              <div className="settings-range">
                <div className={`range-tooltip ${pauseShowTip ? 'show' : ''}`} style={{ left: pauseTipLeft }}>{pauseMs} ms</div>
                <input
                  ref={pauseRef}
                  type="range"
                  min={0}
                  max={2000}
                  step={50}
                  value={pauseMs!}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    setPauseMs!(v)
                    updatePauseTip(v)
                    setPauseShowTip(true)
                  }}
                  onMouseEnter={() => setPauseShowTip(true)}
                  onMouseLeave={() => setPauseShowTip(false)}
                  onPointerDown={() => setPauseShowTip(true)}
                  onPointerUp={() => setPauseShowTip(false)}
                  aria-label="Pause duration"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0ms</span>
                  <span>{pauseMs}ms</span>
                  <span>2000ms</span>
                </div>
              </div>
            </div>
            <div className="settings-block" style={{ opacity: props.reduceMotion ? 0.5 : 1, pointerEvents: props.reduceMotion ? 'none' : 'auto' }}>
              <div className="settings-heading-row">
                <div className="settings-heading">Section stagger</div>
                <span style={{ marginLeft: 'auto' }}>
                <CopyButton getText={() => {
                  const ms = stgMs ?? 900
                  const first = stgFirst ?? 320
                  const step = stgStep ?? 200
                  const off = stgOffset ?? 18
                  const blur = stgBlur ?? 4
                  return `--stg-ms: ${ms}ms; --stg-first: ${first}ms; --stg-step: ${step}ms; --stg-offset: ${off}px; --stg-blur: ${blur}px;`
                }} />
                </span>
              </div>
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={stgExitEnabled ?? true}
                  onChange={e => setStgExitEnabled?.(!!e.target.checked)}
                  aria-label="Enable stagger on first screen"
                />
                Enable stagger on first screen
              </label>
              <div className="settings-range">
                <label className="settings-subheading" style={{ display: 'block', marginBottom: 6 }}>Duration</label>
                <div className={`range-tooltip ${stgMsShow ? 'show' : ''}`} style={{ left: stgMsLeft }}>{stgMs ?? 520} ms</div>
                <input
                  ref={stgMsRef}
                  type="range"
                  min={100}
                  max={1500}
                  step={10}
                  value={stgMs ?? 520}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    setStgMs?.(v)
                    updateStgTip(stgMsRef.current, 100, 1500, v, setStgMsLeft)
                    setStgMsShow(true)
                  }}
                  onMouseEnter={() => setStgMsShow(true)}
                  onMouseLeave={() => setStgMsShow(false)}
                  onPointerDown={() => setStgMsShow(true)}
                  onPointerUp={() => setStgMsShow(false)}
                  aria-label="Stagger duration"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>100ms</span>
                  <span>{stgMs ?? 520}ms</span>
                  <span>1500ms</span>
                </div>
              </div>
              <div className="settings-range">
                <label className="settings-subheading" style={{ display: 'block', marginBottom: 6 }}>First delay</label>
                <div className={`range-tooltip ${stgFirstShow ? 'show' : ''}`} style={{ left: stgFirstLeft }}>{stgFirst ?? 320} ms</div>
                <input
                  ref={stgFirstRef}
                  type="range"
                  min={0}
                  max={1000}
                  step={20}
                  value={stgFirst ?? 320}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    setStgFirst?.(v)
                    updateStgTip(stgFirstRef.current, 0, 1000, v, setStgFirstLeft)
                    setStgFirstShow(true)
                  }}
                  onMouseEnter={() => setStgFirstShow(true)}
                  onMouseLeave={() => setStgFirstShow(false)}
                  onPointerDown={() => setStgFirstShow(true)}
                  onPointerUp={() => setStgFirstShow(false)}
                  aria-label="Stagger first delay"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0ms</span>
                  <span>{stgFirst ?? 320}ms</span>
                  <span>1000ms</span>
                </div>
              </div>
              <div className="settings-range">
                <label className="settings-subheading" style={{ display: 'block', marginBottom: 6 }}>Delay step</label>
                <div className={`range-tooltip ${stgStepShow ? 'show' : ''}`} style={{ left: stgStepLeft }}>{stgStep ?? 200} ms</div>
                <input
                  ref={stgStepRef}
                  type="range"
                  min={0}
                  max={600}
                  step={20}
                  value={stgStep ?? 200}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    setStgStep?.(v)
                    updateStgTip(stgStepRef.current, 0, 600, v, setStgStepLeft)
                    setStgStepShow(true)
                  }}
                  onMouseEnter={() => setStgStepShow(true)}
                  onMouseLeave={() => setStgStepShow(false)}
                  onPointerDown={() => setStgStepShow(true)}
                  onPointerUp={() => setStgStepShow(false)}
                  aria-label="Stagger delay step"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0ms</span>
                  <span>{stgStep ?? 200}ms</span>
                  <span>600ms</span>
                </div>
              </div>
              <div className="settings-range">
                <label className="settings-subheading" style={{ display: 'block', marginBottom: 6 }}>Offset</label>
                <div className={`range-tooltip ${stgOffsetShow ? 'show' : ''}`} style={{ left: stgOffsetLeft }}>{stgOffset ?? 18} px</div>
                <input
                  ref={stgOffsetRef}
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={stgOffset ?? 18}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    setStgOffset?.(v)
                    updateStgTip(stgOffsetRef.current, 0, 60, v, setStgOffsetLeft)
                    setStgOffsetShow(true)
                  }}
                  onMouseEnter={() => setStgOffsetShow(true)}
                  onMouseLeave={() => setStgOffsetShow(false)}
                  onPointerDown={() => setStgOffsetShow(true)}
                  onPointerUp={() => setStgOffsetShow(false)}
                  aria-label="Stagger offset"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0px</span>
                  <span>{stgOffset ?? 18}px</span>
                  <span>60px</span>
                </div>
              </div>
              <div className="settings-range">
                <label className="settings-subheading" style={{ display: 'block', marginBottom: 6 }}>Blur</label>
                <div className={`range-tooltip ${stgOffsetShow ? 'show' : ''}`} style={{ left: stgOffsetLeft }}>{stgBlur ?? 4} px</div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={stgBlur ?? 4}
                  onChange={e => setStgBlur?.(parseInt(e.target.value || '0', 10))}
                  aria-label="Stagger blur"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0px</span>
                  <span>{stgBlur ?? 4}px</span>
                  <span>12px</span>
                </div>
              </div>
            </div>
          </>
        ) : isSpinner ? (
          <>
            <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
              <span className="settings-heading">Spinner</span>
              <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
            </div>
            {/* No variant dropdown in Spinner panel by design */}
            <div className="settings-block">
              <div className="settings-heading">Spinner speed</div>
              <div className="settings-range">
                <div className={`range-tooltip ${spinnerShowTip ? 'show' : ''}`} style={{ left: spinnerTipLeft }}>{spinnerMs ?? 350} ms</div>
                <input
                  ref={spinnerRef}
                  type="range"
                  min={100}
                  max={1200}
                  step={10}
                  value={spinnerMs ?? 350}
                  onChange={e => {
                    const v = parseInt(e.target.value || '0', 10)
                    setSpinnerMs?.(v)
                    updateSpinnerTip(v)
                    setSpinnerShowTip(true)
                  }}
                  onMouseEnter={() => setSpinnerShowTip(true)}
                  onMouseLeave={() => setSpinnerShowTip(false)}
                  onPointerDown={() => setSpinnerShowTip(true)}
                  onPointerUp={() => setSpinnerShowTip(false)}
                  aria-label="Spinner speed"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>100ms</span>
                  <span>{spinnerMs ?? 350}ms</span>
                  <span>1200ms</span>
                </div>
              </div>
            </div>
            <div className="settings-block">
              <label className="settings-subheading" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                <input
                  className="stg-check"
                  type="checkbox"
                  checked={!!props.spinnerTrail}
                  onChange={e => props.setSpinnerTrail?.(!!e.target.checked)}
                  aria-label="Enable trail"
                />
                Enable trail
              </label>
              <div className="settings-subheading" style={{ fontSize: 12 }}>
                Adds a faint, offset ghost that follows the spinner motion.
              </div>
            </div>
            <div className="settings-block">
              <div className="settings-heading">Trail offset</div>
              <div className="settings-range">
                <input
                  type="range"
                  min={0}
                  max={400}
                  step={10}
                  value={(props as any).spinnerTrailOffset ?? 230}
                  onChange={e => (props as any).setSpinnerTrailOffset?.(parseInt(e.target.value || '0', 10))}
                  aria-label="Trail offset (ms)"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0ms</span>
                  <span>{(props as any).spinnerTrailOffset ?? 230}ms</span>
                  <span>400ms</span>
                </div>
              </div>
            </div>
            <div className="settings-block" style={{ marginTop: -6 }}>
              <a
                href="https://dev.to/webdeasy/25-awesome-loading-animations-where-you-like-to-wait-1b5f"
                target="_blank"
                rel="noreferrer"
                className="settings-subheading"
                style={{ textDecoration: 'underline', color: 'inherit', cursor: 'pointer' }}
              >
                Source
              </a>
            </div>
          </>
        ) : props.isMicro ? (
          <>
            <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn-chip" type="button" onClick={openPrinciple}>Principle</button>
              <button className="btn-chip" type="button" onClick={onReset}>Reset</button>
            </div>
            {/* Press transitions - inline with label */}
            <div className="settings-block">
              <div className="settings-heading-row">
                <div className="settings-heading">Press transitions</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: props.microPressTransitions ? 0 : 1, ['--mt-w' as any]: '28px', ['--mt-gap' as any]: '6px' }}>
                  <span className="mt-slider" aria-hidden />
                  <button type="button" style={{ width: 30 }} className={`mt-btn${props.microPressTransitions ? ' selected' : ''}`} onClick={() => props.setMicroPressTransitions?.(true)}>On</button>
                  <button type="button" style={{ width: 30 }} className={`mt-btn${!props.microPressTransitions ? ' selected' : ''}`} onClick={() => props.setMicroPressTransitions?.(false)}>Off</button>
                </div>
              </div>
            </div>
            {/* Choice list elements — hidden when press transitions are off */}
            {props.microPressTransitions && <div className="settings-block">
              <div className="settings-heading-row">
                <div className="settings-heading">Choice list elements</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: props.microChoiceUnit === '%' ? 0 : 1, ['--mt-w' as any]: '24px', ['--mt-gap' as any]: '6px' }}>
                  <span className="mt-slider" aria-hidden />
                  <button type="button" style={{ width: 26 }} className={`mt-btn${props.microChoiceUnit === '%' ? ' selected' : ''}`} onClick={() => props.setMicroChoiceUnit?.('%')}>%</button>
                  <button type="button" style={{ width: 26 }} className={`mt-btn${props.microChoiceUnit === 'px' ? ' selected' : ''}`} onClick={() => props.setMicroChoiceUnit?.('px')}>px</button>
                </div>
              </div>
              <div className="settings-range">
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={props.microChoiceGap ?? 4}
                  onChange={e => props.setMicroChoiceGap?.(parseInt(e.target.value, 10))}
                  aria-label="Choice list gap"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>0{props.microChoiceUnit ?? 'px'}</span>
                  <span>{props.microChoiceGap ?? 4}{props.microChoiceUnit ?? 'px'}</span>
                  <span>20{props.microChoiceUnit ?? 'px'}</span>
                </div>
              </div>
            </div>}
            {/* Checkmark animation */}
            <div className="settings-block" style={{ borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a', marginTop: 4, marginBottom: 4, paddingTop: 12, paddingBottom: 12 }}>
              <div className="settings-heading-row">
                <div className="settings-heading">Checkmark animation</div>
                <div className="mode-toggle" style={{ ['--mt-index' as any]: props.microCheckmark === 'spring' ? 0 : 1 }}>
                  <span className="mt-slider" aria-hidden />
                  <button type="button" className={`mt-btn${props.microCheckmark === 'spring' ? ' selected' : ''}`} onClick={() => props.setMicroCheckmark?.('spring')} title="Spring">
                    <img src="/images/Spring.svg" alt="Spring" width={18} height={18} />
                  </button>
                  <button type="button" className={`mt-btn${props.microCheckmark === 'draw' ? ' selected' : ''}`} onClick={() => props.setMicroCheckmark?.('draw')} title="Draw">
                    <img src="/images/draw.svg" alt="Draw" width={18} height={18} style={{ filter: 'brightness(0) invert(1)', display: 'block' }} />
                  </button>
                </div>
              </div>
            </div>
            {/* Screen width */}
            <div className="settings-block">
              <div className="settings-heading">Screen width</div>
              <div className="settings-range">
                <input
                  type="range"
                  min={393}
                  max={700}
                  step={1}
                  value={props.microScreenWidth ?? 393}
                  onChange={e => props.setMicroScreenWidth?.(parseInt(e.target.value, 10))}
                  aria-label="Screen width"
                />
                <div className="range-scale" style={{ justifyContent: 'space-between' }}>
                  <span>393px</span>
                  <span>{props.microScreenWidth ?? 393}px</span>
                  <span>700px</span>
                </div>
              </div>
            </div>
          </>
        ) : (
        <div className="settings-block">
          <span className="muted">Coming soon</span>
        </div>
      )}
      </div>
      {principleVisible ? (
        <div className={`modal-backdrop panel-modal ${principleOpen ? 'show' : ''}`} role="dialog" aria-modal="true" onClick={closePrinciple}>
          <div className={`modal-card panel-modal ${principleOpen ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="settings-title">
                {isRollups ? 'Rollups animation principle' : isToggles ? 'Toggle selection principle' : isSheets ? 'Sheet animation principle' : props.isMicro ? 'Microinteractions principle' : 'Principle'}
              </span>
              <button className="icon-btn" aria-label="Close" onClick={closePrinciple}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {isRollups ? (
                <>
                  <p>
                    Rollups are a core part of the checkout experience, so their motion is practical, not expressive. Expansion uses an ease-out curve for a smooth, deliberate reveal, while collapse uses a tighter ease-out for a quick, clean close. Collapsing is slightly faster to keep the flow efficient.
                  </p>
                  <p>
                    No bounce, no recoil, and no caret rotation-extra motion adds visual noise and can make frequent interactions feel annoying. Every movement is purposeful, supporting clarity and responsiveness without distraction.
                  </p>
                </>
              ) : isToggles ? (
                <p>
                  Toggles should behave like real-world switches-quick, responsive, and grounded in physical plausibility.
                  The motion should feel snappy and intentional. The animation should be short and fluid (typically
                  150-250ms) to maintain responsiveness without feeling rushed. It avoids exaggerated easing or bounce
                  effects, which can introduce unnecessary playfulness and reduce clarity of state. When the content
                  updates below, it should synchronize precisely with the toggle's end state to reinforce clarity and
                  polish.
                </p>
              ) : isSheets ? (
                <p>
                  Motion in Checkout exists to support understanding, not decoration. For small, frequent interactions like dropdowns, toggles, or hover states, animations should feel immediate and purposeful-quick enough to keep the interface responsive and free of distraction. In contrast, for larger surface transitions such as modals or overlaid sheets, motion can afford a touch more realism: gentle easing or a subtle bounce can reinforce natural physical behavior, making these movements feel intuitive and lifelike. Entry animations may carry this expressive quality to create a sense of arrival and context, while exit motions should remain clean and swift, minimizing visual noise and keeping focus on what comes next.
                </p>
              ) : props.isMicro ? (
                <>
                  <p>
                    Microinteractions are the small moments that make an interface feel alive - a press state that yields under your finger, a radio button dot that springs into place, a checkbox that confirms your tap. Their role is purely functional: to close the feedback loop between user intent and system response, making the product feel responsive and under control. Each microinteraction exists to deliver feedback - not to be noticed.
                  </p>
                  <p>
                    The most effective press states, selection animations, and state transitions are the ones users feel but never consciously see. Functional priority must always come before aesthetics: an animation that draws attention to itself has already failed its purpose. For Checkout, this means press states should resolve in under 100ms, selection feedback in under 300ms, and spring physics - high stiffness, well-damped - should give interactions a grounded, physical quality without veering into playfulness. The measure of a well-designed microinteraction is not whether users notice it, but whether they would notice its absence.
                  </p>
                </>
              ) : isPayNow ? (
                <p>
                  The "Pay now" transition marks a key emotional peak in the checkout journey, reflecting the{' '}
                  <a href="https://www.nngroup.com/articles/peak-end-rule/" target="_blank" rel="noopener noreferrer">
                    peak-end rule
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ marginLeft: 2, verticalAlign: 'text-bottom' }}
                      aria-hidden
                      focusable="false"
                    >
                      <path d="M11.75 3.5C11.3358 3.5 11 3.83579 11 4.25C11 4.66421 11.3358 5 11.75 5H13.9393L8.96967 9.96967C8.67678 10.2626 8.67678 10.7374 8.96967 11.0303C9.26256 11.3232 9.73744 11.3232 10.0303 11.0303L15 6.06066V8.25C15 8.66421 15.3358 9 15.75 9C16.1642 9 16.5 8.66421 16.5 8.25V4.25C16.5 3.83579 16.1642 3.5 15.75 3.5H11.75Z" fill="currentColor"/>
                      <path d="M15 10.9674C15 10.5532 14.6642 10.2174 14.25 10.2174C13.8358 10.2174 13.5 10.5532 13.5 10.9674V13.75C13.5 14.4404 12.9404 15 12.25 15H6.25C5.55964 15 5 14.4404 5 13.75L5 7.75C5 7.05964 5.55965 6.5 6.25 6.5L9.03261 6.5C9.44682 6.5 9.78261 6.16421 9.78261 5.75C9.78261 5.33579 9.44682 5 9.03261 5L6.25 5C4.73122 5 3.5 6.23122 3.5 7.75V13.75C3.5 15.2688 4.73122 16.5 6.25 16.5H12.25C13.7688 16.5 15 15.2688 15 13.75V10.9674Z" fill="currentColor"/>
                    </svg>
                  </a>{' '}
                  in user experience. It should feel both expressive and rewarding-delivering immediate, clear feedback that confirms the purchase while adding a celebratory touch that builds trust and satisfaction. Beyond leaving a positive final impression, the animation should carry a distinct, opinionated style that makes subsequent checkouts instantly recognizable as part of the Shopify experience, strengthening brand familiarity and confidence with every purchase.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {perfMetricsVisible ? (
        <div className={`modal-backdrop panel-modal ${perfMetricsOpen ? 'show' : ''}`} role="dialog" aria-modal="true" onClick={closePerfMetrics}>
          <div className={`modal-card panel-modal ${perfMetricsOpen ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="settings-title">Shop Pay Performance Metrics</span>
              <button className="icon-btn" aria-label="Close" onClick={closePerfMetrics}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginTop: 0 }}>
                <strong>The blank white screen will be visible for:</strong>
              </p>
              <ul style={{ marginLeft: 20, marginBottom: 20 }}>
                <li><strong>P50 (Median):</strong> ~250-350ms (TTFB) + DNS lookup (~50ms) = <strong>~300-400ms total</strong></li>
                <li><strong>P90:</strong> ~1,200-1,500ms (for slower connections/devices)</li>
                <li><strong>P99:</strong> ~2,000-2,500ms (worst case, poor connections)</li>
              </ul>

              <p>
                <strong>Connection Speed Breakdown</strong>
              </p>
              <p style={{ marginTop: 8 }}>
                From the data, the P90 performance (1,163ms TTFB) typically represents:
              </p>
              <ul style={{ marginLeft: 20, marginBottom: 20 }}>
                <li><strong>4G connections:</strong> ~300-500ms blank state</li>
                <li><strong>3G connections:</strong> ~1,000-1,500ms blank state</li>
                <li><strong>Slow connections:</strong> 2,000ms+ blank state</li>
              </ul>

              <p>
                <strong>Critical Insight</strong>
              </p>
              <p style={{ marginTop: 8 }}>
                The data shows that:
              </p>
              <ul style={{ marginLeft: 20, marginBottom: 8 }}>
                <li><strong>50% of Shop Pay users</strong> will experience a blank state of <strong>less than 400ms</strong>, which is actually quite fast for a cross-origin navigation. This is below the threshold where users typically perceive a "lag" (generally ~500ms).</li>
                <li>However, <strong>10% of users (P90)</strong> will see <strong>~1.5 seconds</strong> of blank screen, which is more noticeable.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SectionRow({
  title,
  ms,
  setMs,
  cubic,
  setCubic
}: {
  title: string
  ms: number
  setMs: Dispatch<SetStateAction<number>>
  cubic: Cubic
  setCubic: Dispatch<SetStateAction<Cubic>>
}) {
  const [x1, y1, x2, y2] = cubic
  const sliderMin = 0
  const sliderMax = 1000
  const sliderRef = useRef<HTMLInputElement>(null)
  const [tipLeft, setTipLeft] = useState<number>(0)
  const [showTip, setShowTip] = useState<boolean>(false)

  const onPointChange = (idx: number, value: number) => {
    const clamped = Number.isFinite(value) ? value : 0
    const next: Cubic = [...cubic] as Cubic
    next[idx] = clamped
    setCubic(next)
  }
  const updateTooltip = (value: number) => {
    const el = sliderRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (value - sliderMin) / (sliderMax - sliderMin)))
    setTipLeft(pct * rect.width)
  }
  useEffect(() => {
    updateTooltip(ms)
  }, [ms])

  return (
    <div className="settings-block">
      {title ? (
        <div className="settings-heading-row">
          <div className="settings-heading">{title}</div>
          <CopyButton getText={() => `cubic-bezier(${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)})`} />
        </div>
      ) : null}
      <div className="curve-row">
        <CurvePreview x1={x1} y1={y1} x2={x2} y2={y2} onChange={(nx1, ny1, nx2, ny2) => setCubic([nx1, ny1, nx2, ny2])} />
      </div>
      <div className="settings-range">
        <div className={`range-tooltip ${showTip ? 'show' : ''}`} style={{ left: tipLeft }}>{ms} ms</div>
        <input
          type="range"
          ref={sliderRef}
          min={sliderMin}
          max={sliderMax}
          step={10}
          value={ms}
          onChange={e => {
            const val = parseInt(e.target.value || '0', 10)
            setMs(val)
            updateTooltip(val)
            setShowTip(true)
          }}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onPointerDown={() => setShowTip(true)}
          onPointerUp={() => setShowTip(false)}
          aria-label={`${title} duration`}
        />
        <div className="range-scale" style={{ justifyContent: 'space-between' }}>
          <span>0ms</span>
          <span>{ms}ms</span>
          <span>1000ms</span>
        </div>
      </div>
      <div className="settings-grid">
        <label>
          x1
          <input type="number" step="0.01" value={x1} onChange={e => onPointChange(0, parseFloat(e.target.value))} />
        </label>
        <label>
          y1
          <input type="number" step="0.01" value={y1} onChange={e => onPointChange(1, parseFloat(e.target.value))} />
        </label>
        <label>
          x2
          <input type="number" step="0.01" value={x2} onChange={e => onPointChange(2, parseFloat(e.target.value))} />
        </label>
        <label>
          y2
          <input type="number" step="0.01" value={y2} onChange={e => onPointChange(3, parseFloat(e.target.value))} />
        </label>
      </div>
    </div>
  )
}

function SectionSpringPhysical({
  title,
  ms,
  setMs,
  mass,
  setMass,
  stiffness,
  setStiffness,
  damping,
  setDamping,
  easing,
  onChange
}: {
  title: string
  ms: number
  setMs: Dispatch<SetStateAction<number>>
  mass: number
  setMass: Dispatch<SetStateAction<number>>
  stiffness: number
  setStiffness: Dispatch<SetStateAction<number>>
  damping: number
  setDamping: Dispatch<SetStateAction<number>>
  easing: string
  onChange?: () => void
}) {
  const sliderMin = 0
  const sliderMax = 1200
  const [tipLeft, setTipLeft] = useState<number>(0)
  const [showTip, setShowTip] = useState<boolean>(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  // tooltips for Mass, Stiffness, Damping
  const massRef = useRef<HTMLInputElement>(null)
  const stiffRef = useRef<HTMLInputElement>(null)
  const dampRef = useRef<HTMLInputElement>(null)
  const [massLeft, setMassLeft] = useState(0)
  const [stiffLeft, setStiffLeft] = useState(0)
  const [dampLeft, setDampLeft] = useState(0)
  const [showMassTip, setShowMassTip] = useState(false)
  const [showStiffTip, setShowStiffTip] = useState(false)
  const [showDampTip, setShowDampTip] = useState(false)

  const updateTooltip = (value: number) => {
    const el = sliderRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (value - sliderMin) / (sliderMax - sliderMin)))
    setTipLeft(pct * rect.width)
  }
  useEffect(() => {
    updateTooltip(ms)
  }, [ms])
  const updateLeft = (el: HTMLInputElement | null, min: number, max: number, value: number, setter: (n: number)=>void) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (value - min) / (max - min)))
    setter(pct * rect.width)
  }
  useEffect(() => { updateLeft(massRef.current, 0.2, 5, mass, setMassLeft) }, [mass])
  useEffect(() => { updateLeft(stiffRef.current, 10, 400, stiffness, setStiffLeft) }, [stiffness])
  useEffect(() => { updateLeft(dampRef.current, 1, 80, damping, setDampLeft) }, [damping])

  return (
    <div className="settings-block spring-controls">
      {title ? (
        <div className="settings-heading-row">
          <div className="settings-heading">{title}</div>
          <CopyButton getText={() => easing} />
        </div>
      ) : null}
      <div className="curve-row">
        <SpringPreview mass={mass} stiffness={stiffness} damping={damping} />
      </div>
      <div className="settings-range">
        <div className={`range-tooltip ${showTip ? 'show' : ''}`} style={{ left: tipLeft }}>{ms} ms</div>
        <input
          type="range"
          ref={sliderRef}
          min={sliderMin}
          max={sliderMax}
          step={10}
          value={ms}
          onChange={e => {
            const val = parseInt(e.target.value || '0', 10)
            setMs(val)
            updateTooltip(val)
            setShowTip(true)
          }}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onPointerDown={() => setShowTip(true)}
          onPointerUp={() => setShowTip(false)}
          aria-label="Perceptual duration"
        />
        <div className="range-scale" style={{ justifyContent: 'space-between' }}>
          <span>0ms</span>
          <span>{ms}ms</span>
          <span>1200ms</span>
        </div>
      </div>
      <div className="settings-range">
        <div className="range-scale"><span className="settings-subheading">Mass</span></div>
        <div className={`range-tooltip ${showMassTip ? 'show' : ''}`} style={{ left: massLeft }}>{mass.toFixed(1)}</div>
        <input
          type="range"
          ref={massRef}
          min={0.2}
          max={5}
          step={0.1}
          value={mass}
          onChange={e => { const v = parseFloat(e.target.value); setMass(v); updateLeft(massRef.current, 0.2, 5, v, setMassLeft); setShowMassTip(true); onChange?.() }}
          onMouseEnter={() => setShowMassTip(true)}
          onMouseLeave={() => setShowMassTip(false)}
          onPointerDown={() => setShowMassTip(true)}
          onPointerUp={() => setShowMassTip(false)}
          aria-label="Mass"
        />
        <div className="range-scale">
          <span>0.2</span>
          <span>5</span>
        </div>
      </div>
      <div className="settings-range">
        <div className="range-scale"><span className="settings-subheading">Stiffness</span></div>
        <div className={`range-tooltip ${showStiffTip ? 'show' : ''}`} style={{ left: stiffLeft }}>{stiffness}</div>
        <input
          type="range"
          ref={stiffRef}
          min={10}
          max={400}
          step={1}
          value={stiffness}
          onChange={e => { const v = parseInt(e.target.value || '0', 10); setStiffness(v); updateLeft(stiffRef.current, 10, 400, v, setStiffLeft); setShowStiffTip(true); onChange?.() }}
          onMouseEnter={() => setShowStiffTip(true)}
          onMouseLeave={() => setShowStiffTip(false)}
          onPointerDown={() => setShowStiffTip(true)}
          onPointerUp={() => setShowStiffTip(false)}
          aria-label="Stiffness"
        />
        <div className="range-scale">
          <span>10</span>
          <span>400</span>
        </div>
      </div>
      <div className="settings-range">
        <div className="range-scale"><span className="settings-subheading">Damping</span></div>
        <div className={`range-tooltip ${showDampTip ? 'show' : ''}`} style={{ left: dampLeft }}>{damping}</div>
        <input
          type="range"
          ref={dampRef}
          min={1}
          max={80}
          step={1}
          value={damping}
          onChange={e => { const v = parseInt(e.target.value || '0', 10); setDamping(v); updateLeft(dampRef.current, 1, 80, v, setDampLeft); setShowDampTip(true); onChange?.() }}
          onMouseEnter={() => setShowDampTip(true)}
          onMouseLeave={() => setShowDampTip(false)}
          onPointerDown={() => setShowDampTip(true)}
          onPointerUp={() => setShowDampTip(false)}
          aria-label="Damping"
        />
        <div className="range-scale">
          <span>1</span>
          <span>80</span>
        </div>
      </div>
    </div>
  )
}

function SpringPreview({
  mass, stiffness, damping
}: {
  mass: number, stiffness: number, damping: number
}) {
  // generate normalized points 0..1 time, position may overshoot slightly
  const W = 160
  const H = 100
  // basic physical sim
  const dt = 1 / 120
  let t = 0
  let x = 0
  let v = 0
  const target = 1
  const pts: Array<{ t: number; x: number }> = [{ t: 0, x: 0 }]
  for (let i = 0; i < 12000; i++) {
    const F = -stiffness * (x - target) - damping * v
    const a = F / Math.max(0.0001, mass)
    v += a * dt
    x += v * dt
    t += dt
    pts.push({ t, x })
    if (Math.abs(1 - x) < 0.01 && Math.abs(v) < 0.01 && t > 0.2) break
  }
  const total = pts[pts.length - 1]?.t || 1
  // downsample ~80 points for smooth path
  const n = 80
  const path = (() => {
    const toXY = (tt: number) => {
      // find segment
      let j = 0
      while (j + 1 < pts.length && pts[j + 1].t < tt) j++
      const a = pts[j]; const b = pts[Math.min(j + 1, pts.length - 1)]
      const k = (tt - a.t) / Math.max(1e-6, b.t - a.t)
      const xi = a.x + (b.x - a.x) * k
      const X = (tt / total) * W
      // Map so that xi = 1 sits at vertical center without clamping the overshoot (no flattening)
      const baseOffset = 6 // small visual offset from bottom
      const scale = (H / 2) - baseOffset
      const Y = Math.max(0, Math.min(H, H - (xi * scale + baseOffset)))
      return { X, Y }
    }
    let d = ''
    for (let i = 0; i < n; i++) {
      const tt = (i / (n - 1)) * total
      const { X, Y } = toXY(tt)
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`
    }
    return d
  })()
  return (
    <svg width={W} height={H} className="curve-box" viewBox={`0 0 ${W} ${H}`} aria-label="spring preview">
      <rect x="0" y="0" width={W} height={H} rx="8" fill="#111" stroke="#333" />
      <path d={`M 0 ${H} L ${W} 0`} stroke="#333" strokeDasharray="2 2" />
      <path d={path} stroke="#5a31f4" strokeWidth="2" fill="none" />
    </svg>
  )
}

function CurvePreview({
  x1, y1, x2, y2, onChange
}: {
  x1: number, y1: number, x2: number, y2: number,
  onChange: (x1: number, y1: number, x2: number, y2: number) => void
}) {
  const W = 160
  const H = 100
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<null | 1 | 2>(null)

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
  const toSvg = (clientX: number, clientY: number) => {
    const el = svgRef.current
    if (!el) return { sx: 0, sy: 0 }
    const rect = el.getBoundingClientRect()
    const sx = clamp01((clientX - rect.left) / rect.width)
    const sy = clamp01(1 - (clientY - rect.top) / rect.height)
    return { sx, sy }
  }
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag) return
    const { sx, sy } = toSvg(e.clientX, e.clientY)
    if (drag === 1) onChange(sx, sy, x2, y2)
    if (drag === 2) onChange(x1, y1, sx, sy)
  }
  const startDrag = (which: 1 | 2) => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.((e as any).pointerId)
    setDrag(which)
  }
  const endDrag = () => setDrag(null)

  // Map CSS easing space (0..1, 0..1) to SVG coordinates with padding to avoid clipped handles
  const INSET = 8
  const innerW = W - 2 * INSET
  const innerH = H - 2 * INSET
  const cx1 = INSET + x1 * innerW
  const cy1 = INSET + (1 - y1) * innerH
  const cx2 = INSET + x2 * innerW
  const cy2 = INSET + (1 - y2) * innerH
  const path = `M ${INSET} ${H - INSET} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${W - INSET} ${INSET}`
  return (
    <svg
      ref={svgRef}
      width={W}
      height={H}
      className="curve-box"
      viewBox={`0 0 ${W} ${H}`}
      aria-label="cubic-bezier preview"
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <rect x="0" y="0" width={W} height={H} rx="8" fill="#111" stroke="#333" />
      <path d={`M ${INSET} ${H - INSET} L ${W - INSET} ${INSET}`} stroke="#333" strokeDasharray="2 2" />
      <path d={path} stroke="#5a31f4" strokeWidth="2" fill="none" />
      {/* Handles */}
      <circle cx={cx1} cy={cy1} r="5" fill="#5a31f4" style={{ cursor: 'grab' }} onPointerDown={startDrag(1)} />
      <circle cx={cx2} cy={cy2} r="5" fill="#5a31f4" style={{ cursor: 'grab' }} onPointerDown={startDrag(2)} />
    </svg>
  )
}


