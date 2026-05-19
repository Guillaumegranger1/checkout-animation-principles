import React, { useState, useRef } from 'react'
import { Section } from '../components/Section'
import { SvgSequencePlayer, svgSequenceFrameCount } from '../components/SvgSequencePlayer'
import { DevHud } from '../components/DevHud'
import { OrderSummaryGuest } from '../components/OrderSummaryGuest'
import { Collapsible } from '../components/Collapsible'
import { SettingsPanel } from '../components/SettingsPanel'
import { BezierPreview } from '../components/BezierPreview'
import { SpringPreview } from '../components/SpringPreview'
import { LinearPreview } from '../components/LinearPreview'
import MapView, { type MapViewRef } from '../components/MapView'

const BOPIS_CENTER: [number, number] = [-71.205325, 46.811881];

const isEmbedMode = (() => {
  try { return new URL(window.location.href).searchParams.get('embed') === '1' } catch { return false }
})()
if (isEmbedMode) document.body.classList.add('embed-mode')

const isEndState = (() => {
  try { return new URL(window.location.href).searchParams.get('end') === '1' } catch { return false }
})()

export function RollupsDemo() {
  // Linear() curve requested for the last two visuals
  const overshootLinearPoints: Array<[number, number]> = [
    [0.0, 0.0],
    [0.043, 0.105],
    [0.087, 0.326],
    [0.13, 0.587],
    [0.174, 0.831],
    [0.217, 1.023],
    [0.261, 1.148],
    [0.304, 1.206],
    [0.348, 1.211],
    [0.391, 1.179],
    [0.435, 1.127],
    [0.478, 1.071],
    [0.522, 1.021],
    [0.565, 0.985],
    [0.609, 0.963],
    [0.652, 0.954],
    [0.696, 0.956],
    [0.739, 0.965],
    [0.783, 0.977],
    [0.826, 0.988],
    [0.87, 0.998],
    [0.913, 1.005],
    [0.957, 1.009],
    [1.0, 1.0],
  ]
  function generateSpringLinear(bouncePct: number, samples = 28): string {
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
    const ζ = clamp(1.2 - (bouncePct / 100) * 1.1, 0.05, 1.2) // damping ratio
    const ω = 8 // base frequency
    const values: string[] = []
    values.push('0') // start
    for (let i = 1; i < samples; i++) {
      const t = i / (samples - 1)
      let y: number
      if (ζ < 1) {
        const ωd = ω * Math.sqrt(1 - ζ * ζ)
        y = 1 - Math.exp(-ζ * ω * t) * (Math.cos(ωd * t) + (ζ / Math.sqrt(1 - ζ * ζ)) * Math.sin(ωd * t))
      } else {
        // critically/over-damped approx
        y = 1 - Math.exp(-ω * t) * (1 + ω * t)
      }
      const pct = (t * 100).toFixed(2)
      values.push(`${clamp(y, 0, 1.05).toFixed(4)} ${pct}%`)
    }
    return `linear(${values.join(', ')})`
  }
  // Physically based generator similar to easingwizard.com
  function generateSpringLinearPhysical({
    mass,
    stiffness,
    damping,
  }: {
    mass: number
    stiffness: number
    damping: number
  }): { easing: string; durationMs: number } {
    // simulate mass-spring-damper towards 1 using semi-implicit Euler
    const dt = 1 / 120 // high-resolution step
    let t = 0
    let x = 0 // position
    let v = 0 // velocity
    const target = 1
    const samples: Array<{ t: number; x: number }> = [{ t: 0, x: 0 }]
    // Convert accuracy percent to threshold
    const eps = 0.01 // fixed perceptual threshold (~1%)
    // Integrate until settled
    for (let i = 0; i < 12000; i++) { // max 100s
      // Force: F = -k(x - 1) - c v
      const F = -stiffness * (x - target) - damping * v
      const a = F / mass
      v += a * dt
      x += v * dt
      t += dt
      samples.push({ t, x })
      const posErr = Math.abs(target - x)
      const velSmall = Math.abs(v) < eps
      if (posErr < eps && velSmall && t > dt * 10) break
    }
    const durationMs = Math.round(t * 1000)
    // Downsample to ~24 points to keep CSS string compact and similar to example
    const points = 24
    const easingParts: string[] = ['0']
    for (let i = 1; i < points - 1; i++) {
      const tt = (i / (points - 1)) * t
      // find nearest sample
      let j = 0
      while (j + 1 < samples.length && samples[j + 1].t < tt) j++
      const a = samples[j]
      const b = samples[Math.min(j + 1, samples.length - 1)]
      const k = (tt - a.t) / Math.max(1e-6, b.t - a.t)
      const xi = a.x + (b.x - a.x) * k
      const pct = ((tt / t) * 100).toFixed(1)
      easingParts.push(`${xi.toFixed(3)} ${pct}%`)
    }
    easingParts.push('1')
    return { easing: `linear(${easingParts.join(', ')})`, durationMs }
  }
  const [openMap, setOpen] = useState<Record<number, boolean>>({})
  const [selectedAddress, setSelectedAddress] = useState<number>(0)
  const [selectedMethod, setSelectedMethod] = useState<number>(0)
  const [selectedPayment, setSelectedPayment] = useState<number>(0)
  const [toggleChoice, setToggleChoice] = useState<'Ship' | 'Pickup'>('Ship')
  const [togglesPayment, setTogglesPayment] = useState<'card' | 'paypal' | 'shop'>('shop')
  // Delivery form state (for floating labels)
  const [country, setCountry] = useState<string>('Canada')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [address1, setAddress1] = useState<string>('')
  const [address2, setAddress2] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [province, setProvince] = useState<string>('Ontario')
  const [postal, setPostal] = useState<string>('')

  const defaultExpandMs = 250
  const defaultCollapseMs = 150
  // Default Rollups easing (keep durations as-is)
  const defaultExpandCubic: [number, number, number, number] = [0.30, 0.50, 0.50, 1.00]
  const defaultCollapseCubic: [number, number, number, number] = [0.30, 0.50, 0.50, 1.00]
  const [expandMs, setExpandMs] = useState<number>(defaultExpandMs)
  const [collapseMs, setCollapseMs] = useState<number>(defaultCollapseMs)
  const [expandCubic, setExpandCubic] = useState<[number, number, number, number]>(defaultExpandCubic)
  const [collapseCubic, setCollapseCubic] = useState<[number, number, number, number]>(defaultCollapseCubic)
  // Mode for Rollups (default bezier)
  const [expandMode, setExpandMode] = useState<'spring' | 'bezier'>('bezier')
  const [collapseMode, setCollapseMode] = useState<'spring' | 'bezier'>('bezier')

  const [view, setView] = useState<'Rollups' | 'Sheets' | 'Pay now transition' | 'Toggles' | 'Spinner' | 'Tokens' | 'Microinteractions'>(() => {
    try {
      const url = new URL(window.location.href)
      const q = (url.searchParams.get('demo') || '').toLowerCase()
      const h = (url.hash || '').replace('#', '').toLowerCase()
      const map: Record<string, 'Rollups' | 'Sheets' | 'Pay now transition' | 'Toggles' | 'Spinner' | 'Tokens' | 'Microinteractions'> = {
        rollups: 'Rollups',
        toggles: 'Toggles',
        sheets: 'Sheets',
        pay: 'Pay now transition',
        spinner: 'Spinner',
        tokens: 'Tokens',
        micro: 'Microinteractions',
      }
      if (q && map[q]) return map[q]
      if (h && map[h]) return map[h]
    } catch {}
    return 'Rollups'
  })
  const [mode, setMode] = useState<'live' | 'principles'>('live')
  const [menuOpen, setMenuOpen] = useState(false)
  const [principlesOpen, setPrinciplesOpen] = useState<boolean>(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetBrand, setSheetBrand] = useState<'ceremonia' | 'blume'>('ceremonia')
  // Toggles animation (defaults to 150ms)
  const [toggleMs, setToggleMs] = useState<number>(150)
  const [toggleCubic, setToggleCubic] = useState<[number, number, number, number]>(defaultExpandCubic)
  const [togMode, setTogMode] = useState<'spring' | 'bezier'>('bezier')
  // Sheet animation (open/close)
  const defaultSheetOpenMs = 350
  const defaultSheetCloseMs = 220
  const [sheetOpenMs, setSheetOpenMs] = useState<number>(defaultSheetOpenMs)
  const [sheetCloseMs, setSheetCloseMs] = useState<number>(defaultSheetCloseMs)
  const [sheetOpenCubic, setSheetOpenCubic] = useState<[number, number, number, number]>(defaultExpandCubic)
  const [sheetCloseCubic, setSheetCloseCubic] = useState<[number, number, number, number]>(defaultCollapseCubic)
  const [sheetMass, setSheetMass] = useState<number>(1)
  const [sheetStiffness, setSheetStiffness] = useState<number>(302)
  const [sheetDamping, setSheetDamping] = useState<number>(26)
  const [sheetMode, setSheetMode] = useState<'spring' | 'bezier'>('spring')
  const [sheetCloseMode, setSheetCloseMode] = useState<'spring' | 'bezier'>('bezier')
  // no Accuracy control; use fixed perceptual threshold in generator
  const defaultSpringLinearEasing = 'linear(0, 0.098 4.3%, 0.261 8.7%, 0.435 13.0%, 0.595 17.4%, 0.726 21.7%, 0.827 26.1%, 0.899 30.4%, 0.948 34.8%, 0.980 39.1%, 0.998 43.5%, 1.008 47.8%, 1.011 52.2%, 1.012 56.5%, 1.011 60.9%, 1.009 65.2%, 1.007 69.6%, 1.005 73.9%, 1.003 78.3%, 1.002 82.6%, 1.001 87.0%, 1.001 91.3%, 1.000 95.7%, 1)'
  const [springDirty, setSpringDirty] = useState(false)
  const { easing: sheetOpenEasing, durationMs: derivedOpenMs } = React.useMemo(() => {
    if (sheetMode === 'spring') {
      return springDirty
        ? generateSpringLinearPhysical({ mass: sheetMass, stiffness: sheetStiffness, damping: sheetDamping })
        : { easing: defaultSpringLinearEasing, durationMs: defaultSheetOpenMs }
    }
    // bezier mode
    return { easing: `cubic-bezier(${sheetOpenCubic.join(', ')})`, durationMs: sheetOpenMs }
  }, [springDirty, sheetMass, sheetStiffness, sheetDamping, sheetOpenCubic, sheetOpenMs, sheetMode])
  const sheetCloseEasing = React.useMemo(() => {
    if (sheetCloseMode === 'spring') {
      return generateSpringLinearPhysical({ mass: sheetMass, stiffness: sheetStiffness, damping: sheetDamping }).easing
    }
    return `cubic-bezier(${sheetCloseCubic.join(', ')})`
  }, [sheetCloseMode, sheetMass, sheetStiffness, sheetDamping, sheetCloseCubic])
  React.useEffect(() => {
    setSheetOpenMs(derivedOpenMs)
  }, [derivedOpenMs])
  // sheetMode is declared above (moved earlier)

  const toggle = (idx: number) => {
    setOpen(prev => ({ ...prev, [idx]: !prev[idx] }))
  }
  // Easing strings for Rollups/Toggles when in spring mode (driven by panel state)
  const [expandSpring, setExpandSpring] = React.useState<{mass:number;stiffness:number;damping:number}>({ mass: 1, stiffness: 302, damping: 26 })
  const [collapseSpring, setCollapseSpring] = React.useState<{mass:number;stiffness:number;damping:number}>({ mass: 1, stiffness: 302, damping: 26 })
  const [toggleSpring, setToggleSpring] = React.useState<{mass:number;stiffness:number;damping:number}>({ mass: 1, stiffness: 302, damping: 26 })
  const expandSpringEase = React.useMemo(() => generateSpringLinearPhysical(expandSpring).easing, [expandSpring])
  const collapseSpringEase = React.useMemo(() => generateSpringLinearPhysical(collapseSpring).easing, [collapseSpring])
  const toggleSpringEase = React.useMemo(() => generateSpringLinearPhysical(toggleSpring).easing, [toggleSpring])

  const renderViewLabel = (v: 'Rollups' | 'Sheets' | 'Pay now transition' | 'Spinner' | 'Modals' | 'Toggles' | 'Radio buttons' | 'Tokens' | 'Microinteractions') => {
    return v === 'Pay now transition'
      ? (<><em>Pay now</em>{'\u00A0'}transition</>)
      : v
  }

  // Ensure state stays scoped to its demo:
  // - When leaving "Pay now transition", clear success/sequence so the global page class doesn't hide buttons elsewhere.
  // - When leaving "Sheets", auto-close the sheet if it was open.
  React.useEffect(() => {
    if (view !== 'Pay now transition') {
      setShowSuccess(false)
      setOverlayFade(false)
      setShowOsSequence(false)
      setIsLeaving(false)
      setIsPaying(false)
      setIsMorphing(false)
      setPersistThumbs(false)
    }
    if (view !== 'Sheets') {
      setSheetOpen(false)
    }
  }, [view])
  const [restartKey, setRestartKey] = useState<number>(0)
  const [showOsSequence, setShowOsSequence] = useState<boolean>(isEndState)
  const [isPaying, setIsPaying] = useState<boolean>(false)
  const [isLeaving, setIsLeaving] = useState<boolean>(isEndState)
  const [overlayFade, setOverlayFade] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState<boolean>(isEndState)
  const [mapReady, setMapReady] = useState<boolean>(false)
  const [isMorphing, setIsMorphing] = useState<boolean>(false)
  const mapRef = useRef<MapViewRef>(null)
  const triggerPayRef = React.useRef<(() => void) | null>(null)
  const [isPreMorph, setIsPreMorph] = useState<boolean>(false)
  const [persistThumbs, setPersistThumbs] = useState<boolean>(isEndState)
  // Track morph start to compute elapsed for mid-swap handoff
  // (Reverted mid-swap handoff state)
  const [osKey, setOsKey] = useState<number>(0)
  // Thumbnails morph (supports spring or bezier via settings toggle)
  const [thumbMass, setThumbMass] = useState<number>(1)
  const [thumbStiffness, setThumbStiffness] = useState<number>(302)
  const [thumbDamping, setThumbDamping] = useState<number>(26)
  const defaultThumbMs = 150
  // By default, do not override spring easing so physical params (mass/k/damping) are effective
  const defaultThumbEasingOverride = undefined as string | undefined
  const [thumbMs, setThumbMs] = useState<number>(defaultThumbMs)
  const [thumbMode, setThumbMode] = useState<'spring' | 'bezier'>('bezier')
  const [thumbCubic, setThumbCubic] = useState<[number, number, number, number]>([0.51, 0.00, 0.72, 0.51])
  const [thumbEasingOverride, setThumbEasingOverride] = useState<string | undefined>(defaultThumbEasingOverride)
  const [reduceMotion, setReduceMotion] = useState<boolean>(false)
  const [numberOfItems, setNumberOfItems] = useState<'1' | '2' | '3' | '4' | '5+'>(() => {
    try {
      const v = new URL(window.location.href).searchParams.get('items')
      if (v === '1' || v === '2' || v === '3' || v === '4' || v === '5+') return v
    } catch {}
    return '3'
  })
  const brand = (() => {
    try { return new URL(window.location.href).searchParams.get('brand') || '' } catch { return '' }
  })()
  const atelierImages = [
    '/images/atelier/product-1.png',
    '/images/atelier/product-2.png',
    '/images/atelier/product-3.png',
  ]

  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [guestCheckout, setGuestCheckout] = useState<boolean>(true)
  const [shopPercentile, setShopPercentile] = useState<'p50' | 'p90'>('p50')
  // Map can be either a light preset (for Standard style) or a full style URL
  const [mapStyle, setMapStyle] = useState<string>('day|default')
  const [staticMap, setStaticMap] = useState<boolean>(false)
  // Mapbox Static Images API doesn't support Standard or Standard-based custom styles.
  // When static map is on, remap to the nearest classic equivalent.
  const effectiveMapStyle = React.useMemo(() => {
    if (!staticMap) return mapStyle
    if (mapStyle.startsWith('amplified')) return mapStyle // streets-v12 / dark-v11 already
    if (mapStyle.startsWith('mapbox://') && !mapStyle.includes('|')) return mapStyle // direct classic URL
    const isNight = mapStyle.includes('night') || mapStyle.includes('dusk')
    return isNight
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12'
  }, [staticMap, mapStyle])
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)
  const [mapAddressLabel, setMapAddressLabel] = useState<string | undefined>(undefined)
  const [bopis, setBopis] = useState<boolean>(() => {
    try { return new URL(window.location.href).searchParams.get('bopis') === '1' } catch { return false }
  })
  React.useEffect(() => {
    setMapStyle(prev => {
      if (prev.startsWith('amplified')) {
        const isZoomIn = prev.includes('zoomin');
        return `amplified${isZoomIn ? '-zoomin' : ''}|${darkMode ? 'night' : 'day'}`;
      }
      if (prev.startsWith('mapbox://') && prev.includes('|')) {
        // Custom Standard URL — toggle back to day when dark mode is off
        return darkMode ? prev : 'day|default';
      }
      if (!prev.startsWith('mapbox://')) {
        const parts = prev.split('|');
        parts[0] = darkMode ? 'night' : 'day';
        const next = parts.join('|');
        // Map night|default to custom Mapbox style
        if (next === 'night|default') return 'mapbox://styles/guillaumegranger/cmndnrgz9001u01qq6sg87y7i|night|default';
        return next;
      }
      return prev;
    });
  }, [darkMode])
  // Digital product selection
  const [selectedProduct, setSelectedProduct] = useState<'1-item' | '2-items' | '3-items' | '4-items' | '5-items' | 'shoe' | 'flute' | 'tire' | 'tennis'>(() => {
    try {
      const v = new URL(window.location.href).searchParams.get('items')
      const map: Record<string, '1-item' | '2-items' | '3-items' | '4-items' | '5-items'> =
        { '1': '1-item', '2': '2-items', '3': '3-items', '4': '4-items', '5': '5-items' }
      if (v && map[v]) return map[v]
    } catch {}
    return '3-items'
  })
  
  // Helper to get product images based on selection
  const getProductImages = () => {
    // Handle item count options
    if (selectedProduct.includes('-item')) {
      const itemCountMap = {
        '1-item': 1,
        '2-items': 2,
        '3-items': 3,
        '4-items': 4,
        '5-items': 5
      }
      const count = itemCountMap[selectedProduct as keyof typeof itemCountMap]
      const defaultImages = [
        '/images/image1.png',
        '/images/image2.png',
        '/images/image3.png',
        '/images/image4.png',
        '/images/image5.png'
      ]
      const imageMap = brand === 'atelier'
        ? [...atelierImages, ...defaultImages.slice(atelierImages.length)]
        : defaultImages
      return {
        images: imageMap.slice(0, count),
        count: count,
        backgroundImage: imageMap[0] // Always use first image for background
      }
    }
    
    // Handle single product type options
    const productMap = {
      shoe: '/images/product-shoe.png',
      flute: '/images/product-flute.png',
      tire: '/images/product-tire.png',
      tennis: '/images/product-tennisBall.png'
    }
    const img = productMap[selectedProduct as keyof typeof productMap]
    return {
      images: [img],
      count: 1,
      backgroundImage: img
    }
  }

  // Helper to get map thumbnail images and count based on numberOfItems
  const getMapThumbnails = () => {
    const itemCount = numberOfItems === '5+' ? 5 : parseInt(numberOfItems)
    const defaultImages = [
      '/images/image1.png',
      '/images/image2.png',
      '/images/image3.png',
      '/images/image4.png',
      '/images/image5.png'
    ]
    const imageMap = brand === 'atelier'
      ? [...atelierImages, ...defaultImages.slice(atelierImages.length)]
      : defaultImages
    return {
      images: imageMap.slice(0, itemCount),
      count: itemCount
    }
  }
  
  const { easing: thumbEasing, durationMs: derivedThumbMs } = React.useMemo(() => {
    if (thumbMode === 'spring') {
      if (thumbEasingOverride) {
        return { easing: thumbEasingOverride, durationMs: thumbMs }
      }
      return generateSpringLinearPhysical({ mass: thumbMass, stiffness: thumbStiffness, damping: thumbDamping })
    } else {
      return { easing: `cubic-bezier(${thumbCubic.join(', ')})`, durationMs: thumbMs }
    }
  }, [thumbMode, thumbMass, thumbStiffness, thumbDamping, thumbCubic, thumbMs, thumbEasingOverride])
  React.useEffect(() => {
    if (thumbMode === 'spring' && !thumbEasingOverride) setThumbMs(derivedThumbMs)
  }, [derivedThumbMs, thumbMode, thumbEasingOverride])
  // Pause on last frame
  const [pauseMs, setPauseMs] = useState<number>(100)
  const preMorphMs = 220

  // Listen for the checkmark sequence completion; when ended:
  // - Normal: pre-morph then slide/morph into success
  // - Reduce motion: skip pre/slide, fade out overlay and show success
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail
      if (!detail) return
      if (detail.ended) {
        // pause on last frame, then show success & morph checkmark → thumbnails
        setTimeout(() => {
          if (reduceMotion) {
            // Simpler: fade-out overlay and show success without pre/slide
            setMapReady(false)
            mapRef.current?.reset()
            setShowSuccess(true)
            setOverlayFade(true)
            setIsPreMorph(false)
            setIsMorphing(false)
            setPersistThumbs(true) // ensure mini map thumbnails are visible in final state
          } else {
            setIsPreMorph(true) // first: radius + scale to ~58x56 while still on first screen
            // After pre-morph completes, run the slide/cross-fade morph
            setTimeout(() => {
              setIsPreMorph(false)
              // Reset map camera to start position for replay
              setMapReady(false)
              mapRef.current?.reset()
              setShowSuccess(true) // reveal success screen (map + overlays) only now to prevent flashes
              setIsMorphing(true)
              setTimeout(() => {
                setIsMorphing(false)
                setPersistThumbs(true)
              }, thumbMs + 10) // matches circle slide duration + small buffer
            }, preMorphMs)
          }
        }, pauseMs)
      }
    }
    window.addEventListener('seq-status', handler as EventListener)
    return () => window.removeEventListener('seq-status', handler as EventListener)
  }, [pauseMs, thumbMs, preMorphMs, reduceMotion])
  // Reset map readiness whenever we reload the embed

  // Embed: fire EMBED_COMPLETE when success screen is fully loaded.
  // Small delay lets the browser paint the content before the parent reveals the phone.
  React.useEffect(() => {
    if (!isEmbedMode || !persistThumbs) return
    const t = setTimeout(() => window.parent.postMessage({ type: 'EMBED_COMPLETE' }, '*'), 300)
    return () => clearTimeout(t)
  }, [persistThumbs])

  // Embed: EMBED_REPLAY resets to start state and auto-plays
  React.useEffect(() => {
    if (!isEmbedMode) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'EMBED_REPLAY') return
      setShowSuccess(false); setIsLeaving(false); setIsPaying(false)
      setPersistThumbs(false); setOverlayFade(false); setShowOsSequence(false)
      setIsMorphing(false); setIsPreMorph(false)
      setOsKey(k => k + 1)
      setTimeout(() => triggerPayRef.current?.(), 200)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // (Reverted handoff alignment logic)

  const [uiReady, setUiReady] = useState<boolean>(false)
  const [suppressBtnAnim, setSuppressBtnAnim] = useState<boolean>(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setUiReady(true))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const [spinnerMs, setSpinnerMs] = useState<number>(350) // Spinner page speed

  // Microinteractions controls
  const [microPressTransitions, setMicroPressTransitions] = useState(true)
  const [microChoiceUnit, setMicroChoiceUnit] = useState<'px' | '%'>('px')
  const [microChoiceGap, setMicroChoiceGap] = useState(4)
  const [microCheckmark, setMicroCheckmark] = useState<'spring' | 'draw'>('spring')
  const [microScreenWidth, setMicroScreenWidth] = useState(393)
  const [microSelectedMethod, setMicroSelectedMethod] = useState(0)
  const [microSaveChecked, setMicroSaveChecked] = useState(false)
  const [microSaveNext, setMicroSaveNext] = useState(false)
  // Derived: press scale = (cardWidth - offsetPx) / cardWidth
  const microPressScale = microChoiceUnit === 'px'
    ? Math.max(0.9, (microScreenWidth - 48 - microChoiceGap) / (microScreenWidth - 48))
    : Math.max(0.9, 1 - microChoiceGap / 100)
  const [spinnerMsPay, setSpinnerMsPay] = useState<number>(350) // Pay now speed
  const [spinnerEnabled, setSpinnerEnabled] = useState<boolean>(true)
  const [spinnerTrail, setSpinnerTrail] = useState<boolean>(false)
  const [spinnerTrailOffset, setSpinnerTrailOffset] = useState<number>(230)
  const [paySpinner, setPaySpinner] = useState<'circle' | 'concentric' | 'orbit' | 'arc' | 'sweep'>('arc')
  // Tokens demo controls
  const [tokOnceDir, setTokOnceDir] = useState<boolean>(false) // false: up, true: down
  const [tokNonce, setTokNonce] = useState<number>(0)
  const [tokSkinYs, setTokSkinYs] = useState<number[]>([])
  const tokRef = React.useRef<HTMLDivElement>(null)
  const [tokPlaying, setTokPlaying] = useState<boolean>(false)
  const [tokY, setTokY] = useState<number>(250) // static position when not animating (+250 bottom, -250 top)
  // Initialize onion skin preview for the next motion (default: up)
  React.useEffect(() => {
    const computeYs = (goingDown: boolean) => {
      const [x1, y1, x2, y2] = expandCubic
      const travel = 250
      const steps = 20
      const sample = (t: number, a1: number, a2: number) => ((3*a1*(1-t)*(1-t)*t) + (3*a2*(1-t)*t*t) + (t*t*t))
      const solveTforX = (p: number) => {
        let lo = 0, hi = 1
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2
          const xm = sample(mid, x1, x2)
          if (xm < p) lo = mid; else hi = mid
        }
        return (lo + hi) / 2
      }
      const ease = (p: number) => {
        const t = solveTforX(p)
        return sample(t, y1, y2)
      }
      const yStart = goingDown ? -travel : travel
      const yEnd = goingDown ? travel : -travel
      const ys: number[] = []
      for (let i = 0; i <= steps; i++) {
        const p = i / steps
        const e = ease(p)
        ys.push((1 - e) * yStart + e * yEnd)
      }
      return ys
    }
    const nextDirDown = !tokOnceDir
    // Preview upcoming motion direction and park the shape at the opposite end by default
    setTokSkinYs(computeYs(nextDirDown))
    setTokY(nextDirDown ? 250 : -250)
  }, []) 
  // When timing/ease changes, refresh onion skin to reflect the current selection
  React.useEffect(() => {
    if (view !== 'Tokens') return
    const [x1, y1, x2, y2] = expandCubic
    const travel = 250
    const steps = 20
    const sample = (t: number, a1: number, a2: number) => ((3*a1*(1-t)*(1-t)*t) + (3*a2*(1-t)*t*t) + (t*t*t))
    const solveTforX = (p: number) => {
      let lo = 0, hi = 1
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2
        const xm = sample(mid, x1, x2)
        if (xm < p) lo = mid; else hi = mid
      }
      return (lo + hi) / 2
    }
    const ease = (p: number) => {
      const t = solveTforX(p)
      return sample(t, y1, y2)
    }
    const dirDown = !tokOnceDir // upcoming direction, consistent with Play
    const yStart = dirDown ? -travel : travel
    const yEnd = dirDown ? travel : -travel
    const ys: number[] = []
    for (let i = 0; i <= steps; i++) {
      const p = i / steps
      const e = ease(p)
      ys.push((1 - e) * yStart + e * yEnd)
    }
    setTokSkinYs(ys)
  }, [expandCubic, expandMs, tokOnceDir, view])
  // Stop playing after each one-shot ends
  React.useEffect(() => {
    const el = tokRef.current
    if (!el) return
    const onEnd = () => {
      // Snap to end of the just-run direction
      setTokY(tokOnceDir ? 250 : -250)
      // Defer turning off the animation to the next frame so there is no visual flash
      requestAnimationFrame(() => setTokPlaying(false))
      // Prepare for next run: flip direction
      setTokOnceDir(v => !v)
    }
    el.addEventListener('animationend', onEnd as any)
    return () => el.removeEventListener('animationend', onEnd as any)
  }, [tokNonce])
  const [tipState, setTipState] = useState<{ show: boolean; text: string; x: number; y: number }>({ show: false, text: '', x: 0, y: 0 })
  // Success screen stagger controls
  // Stagger defaults
  const defaultStgMs = 390
  const defaultStgFirst = 500
  const defaultStgStep = 60
  const defaultStgOffset = 10
  const defaultStgBlur = 6
  const [stgMs, setStgMs] = useState<number>(defaultStgMs)
  const [stgFirst, setStgFirst] = useState<number>(defaultStgFirst)
  const [stgStep, setStgStep] = useState<number>(defaultStgStep)
  const [stgOffset, setStgOffset] = useState<number>(defaultStgOffset)
  const [stgBlur, setStgBlur] = useState<number>(defaultStgBlur)
  const [stgExitEnabled, setStgExitEnabled] = useState<boolean>(true)
  const [mapboxOpen, setMapboxOpen] = useState<boolean>(false)
  const [seqMode, setSeqMode] = useState<'js' | 'sprite' | 'apng' | 'css'>('css')
  const [devGuidesOpen, setDevGuidesOpen] = useState(false)
  // Digital product mode: replace map/thumbnail imagery
  const [digitalProduct, setDigitalProduct] = useState<boolean>(() => {
    try { return new URL(window.location.href).searchParams.get('digital') === '1' } catch { return false }
  })

  // Keep triggerPayRef pre-populated so EMBED_REPLAY can auto-play without
  // requiring a prior manual click. Updated whenever relevant state changes.
  React.useEffect(() => {
    if (view !== 'Pay now transition') return
    triggerPayRef.current = () => {
      if (isPaying) return
      setIsPaying(true)
      setTimeout(() => {
        setIsLeaving(true)
        const checkmarkDelay = guestCheckout
          ? 320
          : (7 * stgStep) + stgMs + (shopPercentile === 'p50' ? 400 : 1350)
        setTimeout(() => {
          setShowOsSequence(true)
          setRestartKey(k => k + 1)
        }, checkmarkDelay)
      }, spinnerEnabled ? spinnerMsPay + 2000 : 0)
    }
  }, [view, isPaying, guestCheckout, stgStep, stgMs, shopPercentile, spinnerEnabled, spinnerMsPay])

  const productImages = (() => {
    const base = getProductImages()
    if (!digitalProduct) return base
    // Image type options (shoe, flute, tire, tennis) have their own specific
    // product images — use them as-is. Only replace with gift.png for
    // generic item-count options ('1-item', '2-items', etc.).
    if (!selectedProduct.includes('-item')) return base
    const giftImages = Array.from({ length: base.count }, () => '/images/gift.png')
    return {
      ...base,
      images: giftImages,
      backgroundImage: '/images/gift.png',
    }
  })()

  // Get map thumbnails based on numberOfItems for non-digital products
  const mapThumbnails = digitalProduct ? productImages : (() => {
    const itemCount = numberOfItems === '5+' ? 5 : parseInt(numberOfItems)
    const defaultImages = [
      '/images/image1.png',
      '/images/image2.png',
      '/images/image3.png',
      '/images/image4.png',
      '/images/image5.png'
    ]
    const imageMap = brand === 'atelier'
      ? [...atelierImages, ...defaultImages.slice(atelierImages.length)]
      : defaultImages
    return {
      images: imageMap.slice(0, itemCount),
      count: itemCount
    }
  })()


  // When using CSS sprite mode, synthesize an "ended" event when the sprite finishes
  React.useEffect(() => {
    if (view !== 'Pay now transition') return
    if (seqMode !== 'sprite') return
    if (!showOsSequence) return
    const frames = svgSequenceFrameCount || 60
    const fps = 60
    const seqMs = Math.max(0, Math.round((frames / fps) * 1000))
    const id = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('seq-status', {
        detail: {
          totalFrames: frames,
          loadedFrames: frames,
          currentFrame: frames - 1,
          playing: false,
          ended: true,
          totalBytes: 0,
        }
      }))
    }, seqMs)
    return () => window.clearTimeout(id)
  }, [view, seqMode, showOsSequence])

  // When using APNG/WebP, simulate the sequence lifecycle events so downstream logic (pre-morph, morph) runs on time.
  React.useEffect(() => {
    if (view !== 'Pay now transition') return
    if (!showOsSequence) return
    if (seqMode !== 'apng') return
    // Approximate duration: frames/FPS. Our packer uses FPS=60; with ~47 frames it's ≈ 780ms.
    const approxDurationMs = 800
    // Fire a start status (optional)
    try {
      window.dispatchEvent(new CustomEvent('seq-status', {
        detail: {
          totalFrames: 1,
          loadedFrames: 1,
          currentFrame: 0,
          playing: true,
          ended: false,
          totalBytes: 0
        }
      }))
    } catch {}
    const id = window.setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('seq-status', {
          detail: {
            totalFrames: 1,
            loadedFrames: 1,
            currentFrame: 0,
            playing: false,
            ended: true,
            totalBytes: 0
          }
        }))
      } catch {}
    }, approxDurationMs)
    return () => window.clearTimeout(id)
  }, [view, showOsSequence, seqMode])

  // CSS stroke mode: dispatch ended event after animation completes (~750ms)
  React.useEffect(() => {
    if (view !== 'Pay now transition') return
    if (!showOsSequence) return
    if (seqMode !== 'css') return
    const approxDurationMs = 940
    try {
      window.dispatchEvent(new CustomEvent('seq-status', {
        detail: { totalFrames: 1, loadedFrames: 1, currentFrame: 0, playing: true, ended: false, totalBytes: 0 }
      }))
    } catch {}
    const id = window.setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('seq-status', {
          detail: { totalFrames: 1, loadedFrames: 1, currentFrame: 0, playing: false, ended: true, totalBytes: 0 }
        }))
      } catch {}
    }, approxDurationMs)
    return () => window.clearTimeout(id)
  }, [view, showOsSequence, seqMode])

  return (
    <div
      key={`view-${view}`}
      className={`page ${isEndState ? 'is-end-state' : ''} ${uiReady ? 'ui-ready' : ''} ${suppressBtnAnim ? 'no-btn-anim' : ''} ${showSuccess ? 'is-success' : ''} ${(!stgExitEnabled || reduceMotion) ? 'stg-exit-off' : ''} ${reduceMotion ? 'reduce-motion' : ''} ${guestCheckout ? 'shop-disabled' : 'shop-enabled'} ${digitalProduct ? 'digital-product' : ''} ${view === 'Tokens' ? 'tokens-view' : ''} ${view === 'Microinteractions' ? 'micro-view' : ''} ${darkMode ? 'dark-mode' : ''} ${bopis ? 'bopis' : ''} ${(mapStyle === 'mapbox://styles/mapbox/dark-v11' || mapStyle === 'amplified|night' || mapStyle === 'amplified-zoomin|night') ? 'map-classic-dark' : ''}`}
      style={{
        ['--micro-screen-w' as any]: `${microScreenWidth}px`,
        ['--trail-offset-ms' as any]: `${spinnerTrailOffset}ms`,
        ['--stg-ms' as any]: `${stgMs}ms`,
        ['--stg-first' as any]: `${stgFirst}ms`,
        ['--stg-step' as any]: `${stgStep}ms`,
        ['--stg-offset' as any]: `${stgOffset}px`,
        ['--stg-blur' as any]: `${stgBlur}px`,
      }}
    >
      {/* Right-side tools: Dev HUD stacked vertically and optional replay icon button */}
      {view === 'Pay now transition' ? (
        <div className="side-stack">
          <button
            type="button"
            className="mapbox-btn"
            onClick={() => setMapboxOpen(true)}
          >
            <span className="info-icon" aria-hidden />
            Mapbox
          </button>
          <button type="button" className="dev-guides-btn" onClick={() => setDevGuidesOpen(true)}>
            <span className="info-icon" aria-hidden />
            Checkmark
          </button>
          {/* Sequence implementation chooser */}
          <div className="seq-mode">
            <label htmlFor="seqMode" className="visually-hidden">Sequence implementation</label>
            <select
              id="seqMode"
              className="seq-select"
              value={seqMode}
              onChange={e => {
                const v = e.target.value as 'js' | 'sprite' | 'apng' | 'css'
                setSeqMode(v)
                // Reset flow similar to Replay button for any mode change
                try {
                  window.scrollTo({ top: 0, behavior: 'auto' })
                  const pc = document.querySelector('.phone-content') as HTMLElement | null
                  if (pc) pc.scrollTop = 0
                } catch {}
                setShowSuccess(false)
                setOverlayFade(false)
                setShowOsSequence(false)
                setIsLeaving(false)
                setIsPaying(false)
                setIsMorphing(false)
                setPersistThumbs(false)
                setRestartKey(k => k + 1)
                setOsKey(k => k + 1)
                setSuppressBtnAnim(true)
                setTimeout(() => setSuppressBtnAnim(false), 600)
              }}
            >
              <option value="js" label="JS sequence">JS sequence (preloaded SVGs)</option>
              <option value="sprite" label="CSS sprite">CSS Sprite (CSS steps)</option>
              <option value="apng" label="APNG/WebP">APNG/WebP (single image)</option>
              <option value="css" label="CSS stroke">CSS Stroke (pure CSS)</option>
            </select>
          </div>
          <DevHud />
          <button
            type="button"
            className={`refresh-icon-btn ${mode === 'live' && showSuccess ? 'show' : ''}`}
            onClick={() => {
              try {
                window.scrollTo({ top: 0, behavior: 'auto' })
                const pc = document.querySelector('.phone-content') as HTMLElement | null
                if (pc) pc.scrollTop = 0
              } catch {}
              setShowSuccess(false)
              setOverlayFade(false)
              setShowOsSequence(false)
              setIsLeaving(false)
              setIsPaying(false)
              setIsMorphing(false)
              setPersistThumbs(false)
              setRestartKey(k => k + 1)
              setOsKey(k => k + 1)
              setSuppressBtnAnim(true)
              setTimeout(() => setSuppressBtnAnim(false), 600)
            }}
            aria-label="Replay animation"
            title="Replay animation"
          >
            <img src="/images/refresh.svg" alt="" width={24} height={24} aria-hidden />
          </button>
        </div>
      ) : null}
      {view === 'Tokens' ? (
        <div className="side-stack">
          <button
            type="button"
            className="dev-guides-btn tokens-play-btn"
            onClick={() => {
              const runDirDown = tokOnceDir
              const [x1, y1, x2, y2] = expandCubic
              const travel = 250
              const steps = 20
              const sample = (t: number, a1: number, a2: number) => ((3*a1*(1-t)*(1-t)*t) + (3*a2*(1-t)*t*t) + (t*t*t))
              const solveTforX = (p: number) => {
                let lo = 0, hi = 1
                for (let i = 0; i < 14; i++) {
                  const mid = (lo + hi) / 2
                  const xm = sample(mid, x1, x2)
                  if (xm < p) lo = mid; else hi = mid
                }
                return (lo + hi) / 2
              }
              const ease = (p: number) => {
                const t = solveTforX(p)
                return sample(t, y1, y2)
              }
              const yStart = runDirDown ? -travel : travel
              const yEnd = runDirDown ? travel : -travel
              const ys: number[] = []
              for (let i = 0; i <= steps; i++) {
                const p = i / steps
                const e = ease(p)
                ys.push((1 - e) * yStart + e * yEnd)
              }
              setTokSkinYs(ys)
              setTokY(runDirDown ? -250 : 250)
              setTokPlaying(true)
              setTokNonce(n => n + 1)
            }}
            aria-label="Play"
            title="Play"
          >
            <svg width="16" height="20" viewBox="0 0 10 12" fill="none" aria-hidden focusable="false" style={{ display: 'block' }}>
              <path d="M1.5 1.2L8.5 6L1.5 10.8V1.2Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      ) : null}
      <div className="phone-shell" role="region" aria-label="iPhone-like container">
        <div className="phone-frame">
          <div className="status-bar">
            <div className="dynamic-island" aria-hidden />
          </div>
          <div className="phone-content">
            {view === 'Rollups' ? (
              <div className="rollups-card">
                <Section
                  title={bopis ? 'Pick up' : 'Ship to'}
                  summary={
                    <div className="col" style={{ gap: 6 }}>
                      <div className="value-main">Jordan Chen</div>
                      <div className="value-sub">{mapAddressLabel ?? (bopis ? "1 Rue des Carrières, Québec City, QC, G1R 5J5, CA" : "151 O'Connor St, Ottawa, ON, K2P 2L8, CA")}</div>
                    </div>
                  }
                  open={!!openMap[0]}
                  onToggle={() => toggle(0)}
                  transitions={{
                    expandMs,
                    collapseMs,
                    expandCubic: collapseCubic,
                    collapseCubic: expandCubic,
                    expandEasing: expandMode === 'spring' ? expandSpringEase : undefined,
                    collapseEasing: collapseMode === 'spring' ? collapseSpringEase : undefined
                  }}
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
                      <div className="value-main">
                        {selectedMethod === 0 ? 'FedEx Ground' : 'USPS Priority'} · {selectedMethod === 0 ? '$10.00' : '$20.00'}
                      </div>
                      <div className="value-sub">
                        {selectedMethod === 0 ? '1 to 2 weeks' : '1 to 3 business days'}
                      </div>
                    </div>
                  }
                  open={!!openMap[1]}
                  onToggle={() => toggle(1)}
                  transitions={{
                    expandMs,
                    collapseMs,
                    expandCubic: collapseCubic,
                    collapseCubic: expandCubic,
                    expandEasing: expandMode === 'spring' ? expandSpringEase : undefined,
                    collapseEasing: collapseMode === 'spring' ? collapseSpringEase : undefined
                  }}
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
                        <div className="address-name">American&nbsp;Express&nbsp;·&nbsp;1006</div>
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
                  transitions={{
                    expandMs,
                    collapseMs,
                    expandCubic: collapseCubic,
                    collapseCubic: expandCubic,
                    expandEasing: expandMode == 'spring' ? expandSpringEase : undefined,
                    collapseEasing: collapseMode == 'spring' ? collapseSpringEase : undefined
                  }}
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
                    <button type="button" className="btn-add-option">
                      <span className="plus-sign" aria-hidden>+</span>
                      <span>Use different payment method</span>
                      <img className="btn-cardstack" src="/images/Card%20stack.png" alt="" aria-hidden />
                    </button>
                  </div>
                </Section>
              </div>
            ) : view === 'Toggles' ? (
              <div className="toggle-panel">
                <div className="toggle-group">
                  <div
                    className="toggle-highlight"
                    style={{
                      left: toggleChoice === 'Ship'
                        ? '4px'
                        : 'calc(100% - 4px - ((100% - 12px) / 2))',
                      transition: `left ${toggleMs}ms ${togMode === 'spring' ? toggleSpringEase : `cubic-bezier(${toggleCubic.join(', ')})`}`
                    }}
                  />
                  <button
                    type="button"
                    className={`toggle-card ${toggleChoice === 'Ship' ? 'selected' : ''}`}
                    onClick={() => setToggleChoice('Ship')}
                  >
                    <div className="toggle-row">
                      <span className="toggle-icon" aria-hidden>
                        <img src="/images/box.png" width={18} height={18} alt="" />
                      </span>
                      <span className="toggle-title">Ship</span>
                    </div>
                    <div className="toggle-sub">2–3 days</div>
                  </button>
                  <button
                    type="button"
                    className={`toggle-card ${toggleChoice === 'Pickup' ? 'selected' : ''}`}
                    onClick={() => setToggleChoice('Pickup')}
                  >
                    <div className="toggle-row">
                      <span className="toggle-icon" aria-hidden>
                        <img src="/images/marker.png" width={18} height={18} alt="" />
                      </span>
                      <span className="toggle-title">Pickup</span>
                    </div>
                    <div className="toggle-sub">24 hours</div>
                  </button>
                </div>
                {/* Fixed position swap below toggles (no layout shift) */}
                <div className="below-toggles-block">
                <FixedCrossfade activeKey={toggleChoice} durationMs={toggleMs} cubic={toggleCubic}>
                  {/* Ship pane */}
                  <div data-key="Ship">
                    <div className="form-card">
                      <div className="field">
                        <select className="input has-value" value={country} onChange={e => setCountry(e.target.value)}>
                          <option>Canada</option>
                          <option>United States</option>
                        </select>
                        <label className="floating-label">Country/region</label>
                      </div>
                      <div className="field">
                        <input className="input" type="text" placeholder=" " value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <label className="floating-label">First name (optional)</label>
                      </div>
                      <div className="field">
                        <input className="input" type="text" placeholder=" " value={lastName} onChange={e => setLastName(e.target.value)} />
                        <label className="floating-label">Last name</label>
                      </div>
                      <div className="field">
                        <input className="input" type="text" placeholder=" " value={address1} onChange={e => setAddress1(e.target.value)} />
                        <label className="floating-label">Address</label>
                      </div>
                      <div className="field">
                        <input className="input" type="text" placeholder=" " value={address2} onChange={e => setAddress2(e.target.value)} />
                        <label className="floating-label">Apartment, suite, etc. (optional)</label>
                      </div>
                      <div className="field">
                        <input className="input" type="text" placeholder=" " value={city} onChange={e => setCity(e.target.value)} />
                        <label className="floating-label">City</label>
                      </div>
                      <div className="row-2col">
                        <div className="field">
                          <select className="input has-value" value={province} onChange={e => setProvince(e.target.value)}>
                            <option>Ontario</option>
                            <option>Quebec</option>
                            <option>British Columbia</option>
                          </select>
                          <label className="floating-label">Province</label>
                        </div>
                        <div className="field">
                          <input className="input" type="text" placeholder=" " value={postal} onChange={e => setPostal(e.target.value)} />
                          <label className="floating-label">Postal code</label>
                        </div>
                      </div>
                    </div>
                    <div className="form-subtitle">Shipping method</div>
                    <div className="placeholder-card">
                      Enter your shipping address to view available shipping methods
                    </div>
                  </div>
                  {/* Pickup pane */}
                  <div data-key="Pickup" className="pickup-pane">
                    <div className="pickup-heading">
                      <span className="pay-heading">Pickup</span>
                      <button className="pickup-geo" type="button">
                        <img src="/images/geolocation.png" alt="" aria-hidden />
                        <span>K2P 1V5, CA</span>
                      </button>
                    </div>
                    <div className="pickup-card">
                      <div className="pickup-row">
                        <img className="pickup-thumb" src="/images/thumbails-Stack.png" alt="" aria-hidden />
                        <div className="pickup-title">All items</div>
                        <button className="pickup-edit" type="button">
                          Edit
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ marginLeft: 6 }}>
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="pickup-sep" />
                      <div className="pickup-info">
                        <div className="pickup-name">Elgin Point Flagship</div>
                        <div className="pickup-free">FREE</div>
                        <div className="pickup-address">100 Elgin St, Ottawa, ON</div>
                        <div className="pickup-meta">
                          <span className="meta-item">
                            <img src="/images/marker-small.png" alt="" aria-hidden />
                            0.6 km
                          </span>
                          <span className="meta-item">
                            <img src="/images/clock-small.png" alt="" aria-hidden />
                            Usually ready in 24 hours
                          </span>
                        </div>
                      </div>
                      <div className="pickup-sep" />
                      <button className="pickup-link" type="button">
                        <span>4 other locations</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </FixedCrossfade>
                </div>

                {/* Payment heading */}
                <div className="pay-heading">Payment</div>
                <div className="pay-subtext">All transactions are secure and encrypted</div>
                {/* New simplified payment options group */}
                <PaymentOptions />
              </div>
            ) : view === 'Sheets' ? (
              <div className="sheets">
                <div className="sheets-center">
                  <div className="placeholder-card">
                    Tap the terms and policies link<br />to open the sheet
                  </div>
                </div>
                <button type="button" className="sheet-pay-btn">Pay now</button>
                <div className="sheet-divider" />
                <button type="button" className="sheet-terms" onClick={() => setSheetOpen(true)}>Terms and policies</button>
              </div>
            ) : view === 'Spinner' ? (
              <div className="sheets" style={{ minHeight: 0 }}>
                <div
                  className="sheets-center"
                  style={{ padding: '24px 18px', ['--spinner-ms' as any]: `${spinnerMs}ms` }}
                  onMouseMove={e => {
                    setTipState(s => s.show ? { ...s, x: e.clientX + 10, y: e.clientY + 10 } : s)
                  }}
                >
                  <button
                    type="button"
                    className="sheet-pay-btn sbtn"
                    aria-label="Primary spinner"
                    onMouseEnter={() => setTipState({ show: true, text: 'Arc loader', x: 0, y: 0 })}
                    onMouseLeave={() => setTipState({ show: false, text: '', x: 0, y: 0 })}
                  >
                    {spinnerTrail ? (
                      <span className="trail" aria-hidden>
                        <span className="spinner-arc">
                          <svg viewBox="0 0 66 66" aria-hidden focusable="false">
                            <circle className="path" cx="33" cy="33" r="26" pathLength="100" />
                          </svg>
                        </span>
                      </span>
                    ) : null}
                    <span className="spin-wrap">
                      <span className="spinner-arc" aria-hidden>
                        <svg viewBox="0 0 66 66" aria-hidden focusable="false">
                          <circle className="path" cx="33" cy="33" r="26" pathLength="100" />
                        </svg>
                      </span>
                    </span>
                    <span className="label">Arc loader</span>
                  </button>
                </div>
                <div className="spinner-list" style={{ ['--spinner-ms' as any]: `${spinnerMs}ms` }} onMouseMove={e => {
                  setTipState(s => s.show ? { ...s, x: e.clientX + 10, y: e.clientY + 10 } : s)
                }}>
                  <button type="button" className="sbtn" aria-label="Concentric rings spinner"
                    onMouseEnter={() => setTipState({ show: true, text: 'Concentric rings', x: 0, y: 0 })}
                    onMouseLeave={() => setTipState({ show: false, text: '', x: 0, y: 0 })}
                  >
                    {spinnerTrail ? (
                      <span className="trail" aria-hidden>
                        <span className="spinner-concentric">
                          <span className="ring r1" />
                          <span className="ring r2" />
                          <span className="ring r3" />
                        </span>
                      </span>
                    ) : null}
                    <span className="spin-wrap">
                      <span className="spinner-concentric" aria-hidden>
                        <span className="ring r1" />
                        <span className="ring r2" />
                        <span className="ring r3" />
                      </span>
                    </span>
                    <span className="label">Concentric rings</span>
                  </button>
                  <button type="button" className="sbtn" aria-label="3D orbits spinner"
                    onMouseEnter={() => setTipState({ show: true, text: '3D orbits', x: 0, y: 0 })}
                    onMouseLeave={() => setTipState({ show: false, text: '', x: 0, y: 0 })}
                  >
                    {spinnerTrail ? (
                      <span className="trail" aria-hidden>
                        <span className="spinner-orbit">
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
                      </span>
                    ) : null}
                    <span className="spin-wrap">
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
                    </span>
                    <span className="label">3D orbits</span>
                  </button>
                  <button type="button" className="sbtn" aria-label="Circle spinner"
                    onMouseEnter={() => setTipState({ show: true, text: 'Circle', x: 0, y: 0 })}
                    onMouseLeave={() => setTipState({ show: false, text: '', x: 0, y: 0 })}
                  >
                    {spinnerTrail ? (
                      <span className="trail" aria-hidden>
                        <span className="btn-spinner" />
                      </span>
                    ) : null}
                    <span className="spin-wrap">
                      <span className="btn-spinner" aria-hidden />
                    </span>
                    <span className="label">Circle</span>
                  </button>
                  {/* Removed Pulsing bar, Equalizer, Pulse, Bars cascade, and Square rotate per request */}
                  <button type="button" className="sbtn" aria-label="Conic sweep spinner"
                    onMouseEnter={() => setTipState({ show: true, text: 'Arc sweep', x: 0, y: 0 })}
                    onMouseLeave={() => setTipState({ show: false, text: '', x: 0, y: 0 })}
                  >
                    {spinnerTrail ? <span className="trail" aria-hidden><span className="spinner-conic" /></span> : null}
                    <span className="spin-wrap"><span className="spinner-conic" aria-hidden /></span>
                    <span className="label">Arc sweep</span>
                  </button>
                  
                </div>
              </div>
            ) : view === 'Tokens' ? (
              <div className="sheets" style={{ minHeight: 0 }}>
                <div
                  className="sheets-center"
                  style={{
                    padding: 0, // phone-content handles side padding
                    ['--tok-ms' as any]: `${expandMs}ms`,
                    ['--tok-ease' as any]: `cubic-bezier(${expandCubic.join(', ')})`,
                  }}
                >
                  <div className="token-row">
                    <div className="token-stage">
                      <div
                        key={`once-${tokNonce}`}
                        className="token-shape"
                        style={{
                          animationIterationCount: tokPlaying ? (1 as any) : (0 as any),
                          animationName: tokPlaying ? (tokOnceDir ? 'token-down' : 'token-up') : ('none' as any),
                          transform: tokPlaying ? undefined : (`translateY(${tokY}px)` as any),
                        }}
                        ref={tokRef}
                      />
                    </div>
                    <div className="token-skin">
                      {tokSkinYs.map((y, i) => {
                        const alpha = 0.05 + 0.02 * (i / Math.max(1, tokSkinYs.length - 1))
                        return (
                          <div
                            key={`skin-${tokNonce}-${i}`}
                            className="token-ghost"
                            style={{ transform: `translate(-50%, ${y}px)`, ['--og-alpha' as any]: alpha }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : view === 'Microinteractions' ? (
              <div className="sheets" style={{ minHeight: 0 }}>
                <div className="sheets-center" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }}>
                  <div
                    role="radiogroup"
                    aria-label="Shipping method"
                    style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
                  >
                    {[
                      { label: 'Standard', sub: '3–5 business days', price: 'Free', badge: '' },
                      { label: 'Express', sub: '1–2 business days', price: '$12.00', badge: '' },
                      { label: 'Next-day', sub: 'Tomorrow', price: '$24.00', badge: 'Fastest' },
                    ].map((method, idx) => {
                      const isSelected = microSelectedMethod === idx
                      return (
                        <div
                          key={idx}
                          className={`micro-choice-item${isSelected ? ' micro-selected' : ''}${microPressTransitions ? ' press-enabled' : ''}`}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => setMicroSelectedMethod(idx)}
                          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setMicroSelectedMethod(idx)}
                          style={{ ['--press-scale' as any]: microPressScale }}
                        >
                          <div className={`micro-radio${isSelected ? ` micro-radio--selected micro-radio--${microCheckmark}` : ''}`} />
                          <div className="col" style={{ gap: 2 }}>
                            <div className="address-name">{method.label}</div>
                            <div className="value-sub">{method.sub}</div>
                          </div>
                          <div className="col" style={{ gap: 4, alignItems: 'flex-end' }}>
                            <div className="method-price">{method.price}</div>
                            {method.badge ? <span className="micro-badge">{method.badge}</span> : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Rollup summary + Save info — ported from checkout-accounts-playground/thank-you */}
                  <div className="rollups-card" style={{ marginTop: 40 }}>
                    <div className="micro-section">
                      <div className="micro-section-header">
                        <span className="micro-section-label">Ship to</span>
                        <div>
                          <div className="micro-section-main">Jordan Chen</div>
                          <div className="micro-section-sub">151 O'Connor St, Ottawa, ON, K2P 2L8, CA</div>
                        </div>
                      </div>
                    </div>
                    <div className="micro-section micro-section-divider">
                      <div className="micro-section-header">
                        <span className="micro-section-label">Method</span>
                        <div>
                          <div className="micro-section-main">FedEx Ground</div>
                          <div className="micro-section-sub">1 to 2 weeks</div>
                        </div>
                      </div>
                    </div>
                    <div className="micro-section micro-section-divider">
                      <div className="micro-section-header">
                        <span className="micro-section-label">Paid</span>
                        <div>
                          <div className="micro-section-main micro-section-main--payment">
                            <span>Visa ···· 4242</span>
                            <div className="micro-section-payment-chip">
                              <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="33" height="21" aria-label="Visa">
                                <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
                                <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/>
                                <path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="micro-section micro-section-divider micro-section-subdued">
                      <div
                        className={`cb-root micro-checkmark-${microCheckmark}${microPressTransitions ? ' press-enabled' : ''}${microSaveChecked ? ' cb-root--checked' : ''}`}
                        role="checkbox"
                        aria-checked={microSaveChecked}
                        tabIndex={0}
                        onClick={() => setMicroSaveChecked(v => !v)}
                        onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setMicroSaveChecked(v => !v))}
                      >
                        <div className="cb-box" aria-hidden>
                          {microSaveChecked && (
                            <span className="cb-check-wrap">
                              <svg className="cb-check" viewBox="0 0 12 10" fill="none" aria-hidden>
                                <path d="M1.5 5L4.5 8L10.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <span className="cb-label">Save my information for a faster checkout</span>
                      </div>
                    </div>
                  </div>
                  {/* Standalone checkbox below */}
                  <div
                    className={`cb-root micro-checkmark-${microCheckmark}${microPressTransitions ? ' press-enabled' : ''}${microSaveNext ? ' cb-root--checked' : ''}`}
                    role="checkbox"
                    aria-checked={microSaveNext}
                    tabIndex={0}
                    onClick={() => setMicroSaveNext(v => !v)}
                    onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setMicroSaveNext(v => !v))}
                    style={{ marginTop: 40 }}
                  >
                    <div className="cb-box" aria-hidden>
                      {microSaveNext && (
                        <span className="cb-check-wrap">
                          <svg className="cb-check" viewBox="0 0 12 10" fill="none" aria-hidden>
                            <path d="M1.5 5L4.5 8L10.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="cb-label">Save information for next time</span>
                  </div>
                </div>
              </div>
            ) : view === 'Pay now transition' ? (
              <div className="paynow-host" style={{ ['--spinner-ms' as any]: `${spinnerMsPay}ms` }}>
                <OrderSummaryGuest
                  key={osKey}
                  onPayNow={() => {
                    if (isPaying) return
                    const pay = () => {
                      setIsPaying(true)
                    setTimeout(() => {
                      setIsLeaving(true)
                      let checkmarkDelay: number
                      
                      if (!guestCheckout) {
                        // Shop checkout: wait for stagger to complete, then blank screen based on percentile
                        const staggerCompleteTime = (7 * stgStep) + stgMs
                        const blankScreenDuration = shopPercentile === 'p50' ? 400 : 1350
                        checkmarkDelay = staggerCompleteTime + blankScreenDuration
                      } else {
                        // Guest checkout: original behavior - 320ms delay (overlaps with stagger)
                        checkmarkDelay = 320
                      }
                      
                      setTimeout(() => {
                        // Always play the checkmark; reduceMotion logic handled on sequence end
                        setShowOsSequence(true)
                        setRestartKey(k => k + 1)
                      }, checkmarkDelay)
                    }, spinnerEnabled ? spinnerMsPay + 2000 : 0)
                    }
                    triggerPayRef.current = pay
                    pay()
                  }}
                  isPaying={isPaying}
                  isLeaving={isLeaving}
                  spinnerVariant={paySpinner}
                  spinnerTrail={spinnerTrail}
                  spinnerMs={spinnerMsPay}
                  spinnerEnabled={spinnerEnabled}
                  guestCheckout={guestCheckout}
                  thumbnails={productImages}
                  bopis={bopis}
                />
                {showOsSequence ? (
                  <div
                    className={`paynow-overlay ${overlayFade ? 'fade-out' : ''} ${isPreMorph ? 'pre' : ''} ${isMorphing ? 'morphing' : ''} ${persistThumbs ? 'persist' : ''} ${isEndState && persistThumbs ? 'instant' : ''}`}
                    aria-hidden
                    style={{
                      ['--morph-ease' as any]: thumbEasing as any,
                      ['--morph-ms' as any]: `${thumbMs}ms`,
                      ['--pre-morph-ms' as any]: `${preMorphMs}ms`,
                    }}
                  >
                    {(seqMode === 'js') && (
                      <div className="checkmark-grow">
                        <SvgSequencePlayer fps={60} size={111} padding={18} loop={false} restartKey={restartKey} />
                      </div>
                    )}
                    {(seqMode === 'sprite') && (
                      // Hybrid: use JS sequence for playback to avoid sprite sampling drift,
                      // while keeping sprite assets available for idle states.
                      <div className="checkmark-grow">
                        <SvgSequencePlayer fps={60} size={111} padding={18} loop={false} restartKey={restartKey} />
                      </div>
                    )}
                    {(seqMode === 'apng') && (
                      <div className="checkmark-grow">
                        <div className="sequence-circle" style={{ width: 111, height: 111, padding: 18 }}>
                          <div className="sequence-inner" style={{ width: 111 - 36, height: 111 - 36 }}>
                            <picture>
                              {/* Prefer APNG to avoid webp toolchain issues; falls back to <img> */}
                              <source srcSet="/images/check.apng" type="image/apng" />
                              <source srcSet="/images/check.webp" type="image/webp" />
                              <img className="sequence-img" src="/images/check.apng" alt="" aria-hidden />
                            </picture>
                          </div>
                        </div>
                      </div>
                    )}
                    {(seqMode === 'css') && (
                      <div className="checkmark-grow">
                        <div className="sequence-circle" style={{ width: 111, height: 111, padding: 18 }}>
                          <div className="sequence-inner" style={{ width: 75, height: 75 }}>
                            <svg key={restartKey} className="css-stroke-svg" viewBox="0 0 75 75" fill="none" aria-hidden>
                              <circle
                                className="css-stroke-circle-path"
                                cx="37.5" cy="37.5" r="32"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                className="css-stroke-check-path"
                                d="M 6 40.1 C 7.1 34.6 11.5 31.9 16.5 33 C 21.4 34.1 29.7 42.9 35.2 47.8 C 42.2 40.3 49.1 33 51.7 30.2"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Ghost during morph (non-reduce-motion only). */}
                    {!reduceMotion ? (
                      digitalProduct
                        ? (!persistThumbs
                            ? <img className="thumbs-ghost" src="/images/envelope-closed.png" alt="" aria-hidden />
                            : null)
                        : bopis
                          ? <>
                              <div className="thumbs-ghost bopis-map-pin" aria-hidden>
                                <svg className="bopis-pin-svg" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M34 81 A3 3 0 0 0 38 81 C46 68 72 55 72 36 C72 16.1 55.9 0 36 0 C16.1 0 0 16.1 0 36 C0 55 26 68 34 81 Z" fill="currentColor" stroke="white" strokeOpacity="0.1" strokeWidth="2" paintOrder="stroke fill"/>
                                  <circle cx="36" cy="33" r="24" fill="white"/>
                                </svg>
                                <div className="bopis-pin-icon"><img src="/images/colissimo_logomark.svg" alt="" /></div>
                                <div className="bopis-pin-shadow" />
                              </div>
                              <div className="map-thumb-badge single-item bopis-badge" aria-hidden>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                  <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </>
                          : <>
                              {numberOfItems !== '1' && <img className={`thumbs-ghost-2 ${numberOfItems === '3' || numberOfItems === '4' || numberOfItems === '5+' ? 'three-items' : ''}`} src="/images/map-thumbnail-2.png" alt="" aria-hidden />}
                              {(numberOfItems === '3' || numberOfItems === '4' || numberOfItems === '5+') && <img className="thumbs-ghost-3" src="/images/map-thumbnail-3.png" alt="" aria-hidden />}
                              {(numberOfItems === '4' || numberOfItems === '5+') && <img className="thumbs-ghost-4" src="/images/map-thumbnail-4.png" alt="" aria-hidden />}
                              {numberOfItems === '5+' && <img className="thumbs-ghost-5" src="/images/map-thumbnail-5.png" alt="" aria-hidden />}
                              <img className={`thumbs-ghost ${numberOfItems === '1' ? 'single-item' : numberOfItems === '3' || numberOfItems === '4' || numberOfItems === '5+' ? 'three-items' : ''}`} src="/images/map-thumbnail-1.png" alt="" aria-hidden />
                              <div className={`map-thumb-badge ${numberOfItems === '1' ? 'single-item' : numberOfItems === '3' || numberOfItems === '4' || numberOfItems === '5+' ? 'three-items' : ''}`} aria-hidden>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                  <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </>
                    ) : null}
                  </div>
                ) : null}
                {(showOsSequence || showSuccess || isEndState) ? (
                <div className={`success-screen ${showSuccess ? 'show' : ''} ${isMorphing ? 'morphing' : ''}`} aria-live="polite">
                  <header className="os-header">
                    <div className="os-header-spacer" />
                    <img src="/images/atelier/logo.png" className="os-header-title os-header-logo" alt="Atelier" />
                    <div className={`os-avatar${guestCheckout ? '' : ' os-avatar--shop-pay'}`} aria-hidden>J</div>
                  </header>
                  <div className="success-map">
                    {digitalProduct ? (
                      <div className="dp-bg" aria-hidden />
                    ) : (
                      <>
                        <div className={`map-embed ${mapReady ? 'is-loaded' : ''}`}>
                          <MapView
                            ref={mapRef}
                            reduceMotion={reduceMotion}
                            fasterCamera={false}
                            staticMap={staticMap}
                            mapStyle={effectiveMapStyle}
                            onReady={() => setMapReady(true)}
                            cameraOffset={[numberOfItems === '2' && !bopis ? -20 : 0, -30]}
                            center={mapCenter ?? (bopis ? BOPIS_CENTER : undefined)}
                          />
                        </div>
                        <div className={`map-cover ${mapReady ? 'hide' : ''}`} aria-hidden />
                        <div className={`map-darken ${mapReady ? 'is-visible' : ''}`} aria-hidden />
                        <div className={`map-white-overlay ${darkMode && (mapStyle.startsWith('night') || mapStyle.includes('|night|')) && mapReady ? 'is-visible' : ''}`} aria-hidden />
                      </>
                    )}
                    {/* Digital product envelope end-state stack is positioned relative to .success-map
                        so it matches the morph ghost's global path without overlay offsets. */}
                    {digitalProduct ? (
                      <>
                        <div className={`envelope-stack ${persistThumbs ? 'open' : 'closed'}`}>
                          <img className="env-flap" src="/images/envelope-flap.png" alt="" />
                          {/* Product thumbnails stack between flap and open */}
                          <div className="env-products" aria-hidden>
                            {productImages.images.map((img, idx) => (
                              <img
                                key={idx}
                                className={`env-prod p${productImages.count === 1 ? 2 : idx + 1}`}
                                src={img}
                                alt=""
                              />
                            ))}
                          </div>
                          <img className="env-open" src="/images/envelope-open.png" alt="" />
                          <img className="env-closed" src="/images/envelope-closed.png" alt="" />
                        </div>
                        {/* Notification badge — sibling of envelope-stack so it isn't scaled by envelopeGrow */}
                        <div className={`env-badge${persistThumbs ? ' open' : ''}`} aria-hidden>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </>
                    ) : null}
                    <div className="success-overlay">
                      {/* Map thumbnails on map (Reduce motion only) */}
                      {reduceMotion && !digitalProduct
                        ? (bopis
                            ? <div className="success-thumbs bopis-map-pin" aria-hidden>
                                <svg className="bopis-pin-svg" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M34 81 A3 3 0 0 0 38 81 C46 68 72 55 72 36 C72 16.1 55.9 0 36 0 C16.1 0 0 16.1 0 36 C0 55 26 68 34 81 Z" fill="currentColor" stroke="white" strokeOpacity="0.1" strokeWidth="2" paintOrder="stroke fill"/>
                                  <circle cx="36" cy="33" r="24" fill="white"/>
                                </svg>
                                <div className="bopis-pin-icon"><img src="/images/colissimo_logomark.svg" alt="" /></div>
                                <div className="bopis-pin-shadow" />
                              </div>
                            : <img className="success-thumbs" src="/images/map-thumbnail-1.png" alt="" aria-hidden />)
                        : null}
                      {!digitalProduct ? (
                        bopis ? (
                          <div className="bopis-chip-row">
                            <div className="success-chip bopis-chip">
                              <span className="chip-label">Pick up</span>
                              <span className="chip-value">{mapAddressLabel ?? "1 Rue des Carrières, Québec City"}</span>
                            </div>
                            <div className="bopis-chip-pill" aria-hidden>
                              <img src="/images/direction.svg" alt="" />
                            </div>
                          </div>
                        ) : (
                          <div className="success-chip">
                            <span className="chip-label">{bopis ? 'Pick up' : 'Ship to'}</span>&nbsp;
                            <span className="chip-value">{mapAddressLabel ?? (bopis ? "1 Rue des Carrières" : "151 O'Connor St")}</span>
                          </div>
                        )
                      ) : null}
                      <div className="success-card" style={digitalProduct ? { ['--product-bg-image' as any]: `url('${productImages.backgroundImage}')` } : undefined}>
                        <div className="success-content">
                          <div className="success-title">Thank you, Jordan!</div>
                          <div className="success-sub">{bopis ? 'Order #1EY2CR3456GF4Y' : 'Order #1EY2CR3456GF4Y will be sent to jordanchen@gmail.com'}</div>
                        </div>
                      </div>
                    </div>
                  <div
                    className="success-followups"
                    style={{
                      ['--stg-ms' as any]: `${stgMs}ms`,
                      ['--stg-first' as any]: `${stgFirst}ms`,
                      ['--stg-step' as any]: `${stgStep}ms`,
                      ['--stg-offset' as any]: `${stgOffset}px`,
                      ['--stg-blur' as any]: `${stgBlur}px`,
                    }}
                  >
                    {digitalProduct ? (
                      <a className="followup-btn" href={darkMode ? 'https://accounts-redesign.quick.shopify.io/?brandId=heritage&showStoreCredit=false&orderCount=4&recentOrder.productCount=4&navItemCount=6&orderActionCount=1&actionLayout=buttons&showAddressBadges=true' : 'https://accounts-redesign.quick.shopify.io/?brandId=default&showStoreCredit=false&orderCount=4&recentOrder.productCount=4&navItemCount=6&orderActionCount=1&actionLayout=buttons&showAddressBadges=true'} target="_blank" rel="noopener noreferrer">Manage my order</a>
                    ) : (
                      <div className="followup-card">
                        <div className="followup-delivery">{bopis ? 'Usually ready in 24 hours' : 'Estimated delivery: May 19-30'}</div>
                        {bopis && <div className="followup-text">You'll receive an email at jordanchen@gmail.com when your order is ready to pickup.</div>}
                        <div className="followup-btn followup-primary">Track order with <svg viewBox="0 0 47 20" xmlns="http://www.w3.org/2000/svg" fill="white" className="shop-pay-logo" aria-hidden={true}><path d="M9.09504 6.7662L6.76507 7.95243C6.23251 7.03473 5.50023 6.5648 4.47969 6.5648C3.37018 6.5648 2.81522 6.90047 2.8148 7.5718C2.8148 8.2881 3.63625 8.44453 5.47825 8.84733C7.32024 9.25013 9.40905 9.83217 9.40905 12.1369C9.40905 14.3751 7.67821 15.7177 4.81568 15.7177C2.5077 15.7177 0.796334 14.7329 0 12.9874L2.32997 11.824C2.81794 12.9007 3.66138 13.4574 4.81568 13.4574C6.01395 13.4574 6.61309 13.1217 6.61309 12.4054C6.61309 11.6891 5.78975 11.5327 3.94524 11.1299C2.10074 10.7271 0.0200972 10.145 0.0200972 7.84033C0.0200972 5.66927 1.72895 4.30443 4.47906 4.30443C6.63318 4.30443 8.25348 5.17717 9.09504 6.7662Z" /><path d="M11.0493 0.5H13.9345V5.60213C14.6881 4.77437 15.7758 4.30443 17.0187 4.30443C19.5044 4.30443 21.2798 6.22913 21.2798 8.95943V15.605H18.3947V8.95943C18.3947 7.6839 17.4627 6.74277 16.1752 6.74277C14.8878 6.74277 13.9345 7.7048 13.9345 8.95943V15.605H11.0493V0.5Z" /><path d="M23.1658 5.11003C24.1204 4.4387 25.4957 3.97003 26.9609 3.97003C30.8666 3.97003 33.7071 6.6332 33.7071 10.2812C33.7071 13.6822 31.266 16.0547 27.8703 16.0547C24.9632 16.0547 22.8775 14.0856 22.8775 11.4446C22.8775 9.6542 23.9452 8.3337 25.4524 7.81943L26.6727 9.90056C25.8518 10.2806 25.5422 10.8404 25.5422 11.5339C25.5422 12.6739 26.4968 13.4814 27.8722 13.4814C29.5591 13.4814 30.8905 12.1381 30.8905 10.3255C30.8905 8.19943 29.2262 6.58886 26.9628 6.58886C26.0732 6.58186 25.2012 6.83865 24.4551 7.32733L23.1658 5.11003Z" /><path d="M38.1895 14.3301V19.5H35.3049V4.41653H38.1229V5.78137C38.9889 4.8415 40.2092 4.30443 41.5852 4.30443C44.6254 4.30443 47 6.78837 47 10.0114C47 13.2344 44.6254 15.7177 41.5852 15.7177C40.2312 15.7177 39.0549 15.2028 38.1895 14.3301ZM44.1368 9.9886C44.1368 8.13103 42.85 6.7662 41.0966 6.7662C39.3657 6.7662 38.0563 8.15383 38.0563 9.9886C38.0563 11.8234 39.3657 13.2116 41.0966 13.2116C42.85 13.2116 44.1387 11.8462 44.1387 9.9886H44.1368Z" /></svg></div>
                        <a className="followup-btn" href={darkMode ? 'https://accounts-redesign.quick.shopify.io/?brandId=heritage&showStoreCredit=false&orderCount=4&recentOrder.productCount=4&navItemCount=6&orderActionCount=1&actionLayout=buttons&showAddressBadges=true' : 'https://accounts-redesign.quick.shopify.io/?brandId=default&showStoreCredit=false&orderCount=4&recentOrder.productCount=4&navItemCount=6&orderActionCount=1&actionLayout=buttons&showAddressBadges=true'} target="_blank" rel="noopener noreferrer">Manage my order</a>
                      </div>
                    )}
                    <div className="followup-card">
                      <div className="items-row">
                        <div className="items-left subscribe-label">{mapThumbnails.count} {mapThumbnails.count === 1 ? 'item' : 'items'}</div>
                        <div className="items-right">
                          <div className="mini-thumbs" data-count={mapThumbnails.count} aria-hidden>
                            {mapThumbnails.images.map((img, idx) => (
                              <span 
                                key={idx} 
                                className={`mini-thumb t${idx + 1}`}
                              >
                                <img src={img} width={23} height={23} alt="" />
                              </span>
                            ))}
                          </div>
                          <div className="os-price">
                            <span className="amount">$61.02</span>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                              <path d="M1.42843 3.39258L4.74732 6.71147C4.8868 6.85094 5.11293 6.85094 5.2524 6.71147L8.57129 3.39258" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!digitalProduct ? (
                      /* Rollups component duplicated (without Payment) using original styles */
                      <div className="rollups-card followup-rollups">
                        <Section
                          title={bopis ? 'Pick up' : 'Ship to'}
                          summary={
                            <div className="col" style={{ gap: 6 }}>
                              <div className="value-main">Jordan Chen</div>
                              <div className="value-sub">{mapAddressLabel ?? (bopis ? "1 Rue des Carrières, Québec City, QC, G1R 5J5, CA" : "151 O'Connor St, Ottawa, ON, K2P 2L8, CA")}</div>
                            </div>
                          }
                          open={!!openMap[10]}
                          onToggle={() => toggle(10)}
                          transitions={{ expandMs, collapseMs, expandCubic, collapseCubic }}
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
                              <div className="value-main">
                                {selectedMethod === 0 ? 'FedEx Ground' : 'USPS Priority'} · {selectedMethod === 0 ? '$10.00' : '$20.00'}
                              </div>
                              <div className="value-sub">
                                {selectedMethod === 0 ? '1 to 2 weeks' : '1 to 3 business days'}
                              </div>
                            </div>
                          }
                          open={!!openMap[11]}
                          onToggle={() => toggle(11)}
                          transitions={{ expandMs, collapseMs, expandCubic, collapseCubic }}
                          showChevron={false}
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
                                <div className="address-name">American&nbsp;Express&nbsp;·&nbsp;1006</div>
                                <div className="value-sub">1 to 3 business days</div>
                              </div>
                              <div className="method-right">
                                <div className="method-price">$20.00</div>
                                <span className="pill-default-small">Fastest</span>
                              </div>
                            </div>
                          </div>
                        </Section>
                      </div>
                    ) : null}
                    {/* Similar products - end-state only (Pay now transition) */}
                    <div className="recs-card" aria-label="Continue shopping">
                      <div className="recs-title">Continue shopping</div>
                      <div className="recs-list" role="list">
                        {brand === 'atelier' ? (<>
                          <div className="recs-item" role="listitem">
                            <div className="recs-img"><img src="/images/atelier/product-1.png" alt="" aria-hidden /></div>
                            <div className="recs-name">Arc Tote</div>
                            <div className="recs-meta">Grey / Cognac</div>
                            <div className="recs-price">$285.00</div>
                          </div>
                          <div className="recs-item" role="listitem">
                            <div className="recs-img"><img src="/images/atelier/product-2.png" alt="" aria-hidden /></div>
                            <div className="recs-name">Block Mule</div>
                            <div className="recs-meta">Tan</div>
                            <div className="recs-price">$195.00</div>
                          </div>
                          <div className="recs-item" role="listitem">
                            <div className="recs-img"><img src="/images/atelier/product-3.png" alt="" aria-hidden /></div>
                            <div className="recs-name">Envelope Clutch</div>
                            <div className="recs-meta">Nude</div>
                            <div className="recs-price">$145.00</div>
                          </div>
                        </>) : (<>
                          <div className="recs-item" role="listitem">
                            <div className="recs-img"><img src="/images/product_1.png" alt="" aria-hidden /></div>
                            <div className="recs-name">Aceite de Moska</div>
                            <div className="recs-meta">60 mL</div>
                            <div className="recs-price">$64.00</div>
                          </div>
                          <div className="recs-item" role="listitem">
                            <div className="recs-img"><img src="/images/product_2.png" alt="" aria-hidden /></div>
                            <div className="recs-name">Guava Rescue</div>
                            <div className="recs-meta">200 mL</div>
                            <div className="recs-price">$27.00</div>
                          </div>
                          <div className="recs-item" role="listitem">
                            <div className="recs-img"><img src="/images/product_3.png" alt="" aria-hidden /></div>
                            <div className="recs-name">Scalp Masaje</div>
                            <div className="recs-meta">2 options</div>
                            <div className="recs-price">$31.00</div>
                          </div>
                        </>)}
                      </div>
                      <div className="recs-terms">Terms and policies</div>
                    </div>
                  </div>
                  </div>
                </div>
                ) : null}
              </div>
            ) : (
              <div className="rollups-card" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
                <div className="muted">Coming soon</div>
              </div>
            )}
          </div>
          {/* In-phone sheet overlay */}
          <div
            className={`sheet-overlay ${sheetOpen ? 'show' : ''}`}
            onClick={() => setSheetOpen(false)}
            aria-hidden
            style={{
              transition: `opacity ${sheetOpen ? sheetOpenMs : sheetCloseMs}ms cubic-bezier(${(sheetOpen ? sheetOpenCubic : sheetCloseCubic).join(', ')})`
            }}
          />
          <div
            className={`sheet-panel ${sheetOpen ? 'show' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Policies"
            style={{
              transition: `transform ${sheetOpen ? sheetOpenMs : sheetCloseMs}ms ${sheetOpen ? (sheetOpenEasing as any) : (sheetCloseEasing as any)}`
            }}
          >
            <div className="sheet-header">
              <span className="sheet-title">Policies</span>
              <button className="sheet-close" aria-label="Close" onClick={() => setSheetOpen(false)}>
                <img src="/images/close.png" width={18} height={18} alt="" aria-hidden />
              </button>
            </div>
            <div className="sheet-body">
              <div className="sheet-tabs" role="tablist" aria-label="Brand">
                <button
                  type="button"
                  role="tab"
                  aria-selected={sheetBrand === 'ceremonia'}
                  className={`sheet-tab ${sheetBrand === 'ceremonia' ? 'active' : ''}`}
                  onClick={() => setSheetBrand('ceremonia')}
                >
                  <span className="sheet-thumb" aria-hidden>
                    <img src="/images/ceremonia.png" width={32} height={32} alt="" />
                  </span>
                  <span>Ceremonia</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sheetBrand === 'blume'}
                  className={`sheet-tab ${sheetBrand === 'blume' ? 'active' : ''}`}
                  onClick={() => setSheetBrand('blume')}
                >
                  <span className="sheet-thumb" aria-hidden>
                    <img src="/images/blume.png" width={32} height={32} alt="" />
                  </span>
                  <span>Blume</span>
                </button>
              </div>
              <div className="sheet-select">
                <div className="field">
                  <select className="input has-value" defaultValue="Return policy">
                    <option>Return policy</option>
                    <option>Privacy policy</option>
                    <option>Shipping policy</option>
                  </select>
                  <label className="floating-label">Policy</label>
                </div>
              </div>
              <p>
                We have a 30‑day return policy, which means you have 30 days after
                receiving your item to request a return.
              </p>
              <p>
                To be eligible for a return, your item must be in the same condition that
                you received it, unworn or unused, with tags, and in its original packaging.
                You'll also need the receipt or proof of purchase.
              </p>
              <h3>Lorem Ipsum</h3>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
                veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <h3>Dolor sit amet</h3>
              <p>
                Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
                architecto beatae vitae dicta sunt explicabo.
              </p>
              <h3>Consectetur adipiscing elit</h3>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
                veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
            </div>
          </div>
          <div className="home-indicator" aria-hidden />
        </div>
      </div>

      {/* Old outside-phone refresh button replaced by side-stack icon-only variant */}

      {/* Top dropdown and Motion Principles button */}
      <div className="top-dropdown">
        <button className={`dd-trigger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(v => !v)}>
          {renderViewLabel(view)}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
            <path
              d={menuOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
            {menuOpen ? (
          <div className="dd-sheet" role="menu">
            {(['Rollups', 'Toggles', 'Sheets', 'Pay now transition', 'Spinner', 'Tokens', 'Microinteractions'] as const).map(label => (
              <button
                key={label}
                className="dd-item"
                onClick={() => {
                  setView(label);
                  try {
                    const url = new URL(window.location.href)
                    const map: Record<string, string> = { 'Rollups':'rollups','Toggles':'toggles','Sheets':'sheets','Pay now transition':'pay','Spinner':'spinner','Tokens':'tokens','Microinteractions':'micro' }
                    url.searchParams.set('demo', map[label] || 'rollups')
                    window.history.replaceState(null, '', url.toString())
                  } catch {}
                  setMenuOpen(false)
                }}
              >
                {renderViewLabel(label)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {/* Top-right Share + Motion principles buttons */}
      <div className="top-actions">
        <button
          className="share-btn"
          onClick={async () => {
            try {
              const url = new URL(window.location.href)
              const map: Record<string, string> = { 'Rollups':'rollups','Toggles':'toggles','Sheets':'sheets','Pay now transition':'pay','Spinner':'spinner','Tokens':'tokens','Microinteractions':'micro' }
              url.searchParams.set('demo', map[view] || 'rollups')
              await navigator.clipboard?.writeText(url.toString())
            } catch {}
          }}
          type="button"
          aria-label="Copy shareable URL"
          title="Copy shareable URL"
        >
          Share
        </button>
        <button
          className="principles-btn"
          onClick={() => {
            setMenuOpen(false)
            setPrinciplesOpen(true)
          }}
          type="button"
        >
          Motion principles
        </button>
      </div>

      {/* Floating tooltip for spinner labels */}
      {tipState.show ? (
        <div
          className="copy-tooltip portal show"
          role="status"
          aria-live="polite"
          style={{ position: 'fixed', top: tipState.y, left: tipState.x, pointerEvents: 'none' }}
        >
          <div className="copy-tt-body" style={{ whiteSpace: 'nowrap' }}>{tipState.text}</div>
        </div>
      ) : null}

      <SettingsPanel
        title={view}
        isRollups={view === 'Rollups'}
        isTokens={view === 'Tokens'}
        isToggles={view === 'Toggles'}
        isSheets={view === 'Sheets'}
        isPayNow={view === 'Pay now transition'}
        isSpinner={view === 'Spinner'}
        isMicro={view === 'Microinteractions'}
        microPressTransitions={microPressTransitions}
        setMicroPressTransitions={setMicroPressTransitions}
        microChoiceUnit={microChoiceUnit}
        setMicroChoiceUnit={setMicroChoiceUnit}
        microChoiceGap={microChoiceGap}
        setMicroChoiceGap={setMicroChoiceGap}
        microCheckmark={microCheckmark}
        setMicroCheckmark={setMicroCheckmark}
        microScreenWidth={microScreenWidth}
        setMicroScreenWidth={setMicroScreenWidth}
        expandMode={expandMode}
        setExpandMode={setExpandMode}
        collapseMode={collapseMode}
        setCollapseMode={setCollapseMode}
        togMode={togMode}
        setTogMode={setTogMode}
        sheetMode={sheetMode}
        setSheetMode={setSheetMode}
        expandMs={expandMs}
        setExpandMs={setExpandMs}
        expandCubic={expandCubic}
        setExpandCubic={setExpandCubic}
        collapseMs={collapseMs}
        setCollapseMs={setCollapseMs}
        collapseCubic={collapseCubic}
        setCollapseCubic={setCollapseCubic}
        toggleMs={toggleMs}
        setToggleMs={setToggleMs}
        toggleCubic={toggleCubic}
        setToggleCubic={setToggleCubic}
        sheetOpenMs={sheetOpenMs}
        setSheetOpenMs={setSheetOpenMs}
        sheetOpenCubic={sheetOpenCubic}
        setSheetOpenCubic={setSheetOpenCubic}
        sheetMass={sheetMass}
        setSheetMass={setSheetMass}
        sheetStiffness={sheetStiffness}
        setSheetStiffness={setSheetStiffness}
        sheetDamping={sheetDamping}
        setSheetDamping={setSheetDamping}
        sheetOpenEasing={sheetOpenEasing}
        onSpringChange={() => setSpringDirty(true)}
        sheetCloseMs={sheetCloseMs}
        setSheetCloseMs={setSheetCloseMs}
        sheetCloseCubic={sheetCloseCubic}
        setSheetCloseCubic={setSheetCloseCubic}
        // Pay now morph controls
        thumbMs={thumbMs}
        setThumbMs={setThumbMs}
        thumbMass={thumbMass}
        setThumbMass={setThumbMass}
        thumbStiffness={thumbStiffness}
        setThumbStiffness={setThumbStiffness}
        thumbDamping={thumbDamping}
        setThumbDamping={setThumbDamping}
        thumbEasing={thumbEasing}
        expandSpring={expandSpring}
        setExpandSpring={setExpandSpring}
        collapseSpring={collapseSpring}
        setCollapseSpring={setCollapseSpring}
        toggleSpring={toggleSpring}
        setToggleSpring={setToggleSpring}
        thumbMode={thumbMode}
        setThumbMode={setThumbMode}
        thumbCubic={thumbCubic}
        setThumbCubic={setThumbCubic}
        // Success screen stagger controls
        stgMs={stgMs}
        setStgMs={setStgMs}
        stgFirst={stgFirst}
        setStgFirst={setStgFirst}
        stgStep={stgStep}
        setStgStep={setStgStep}
        stgOffset={stgOffset}
        setStgOffset={setStgOffset}
        stgBlur={stgBlur}
        setStgBlur={setStgBlur}
        stgExitEnabled={stgExitEnabled}
        setStgExitEnabled={setStgExitEnabled}
        sheetCloseMode={sheetCloseMode}
        setSheetCloseMode={setSheetCloseMode}
        sheetCloseEasing={sheetCloseEasing}
        pauseMs={pauseMs}
        setPauseMs={setPauseMs}
        spinnerMs={spinnerMs}
        setSpinnerMs={setSpinnerMs}
        spinnerTrail={spinnerTrail}
        setSpinnerTrail={setSpinnerTrail}
        spinnerTrailOffset={spinnerTrailOffset}
        setSpinnerTrailOffset={setSpinnerTrailOffset}
        paySpinner={paySpinner}
        setPaySpinner={setPaySpinner}
        paySpinnerMs={spinnerMsPay}
        setPaySpinnerMs={setSpinnerMsPay}
        spinnerEnabled={spinnerEnabled}
        setSpinnerEnabled={setSpinnerEnabled}
        onGoToSpinner={() => setView('Spinner')}
        reduceMotion={reduceMotion}
        setReduceMotion={setReduceMotion}
        numberOfItems={numberOfItems}
        setNumberOfItems={setNumberOfItems}
        digitalProduct={digitalProduct}
        setDigitalProduct={setDigitalProduct}
        bopis={bopis}
        setBopis={setBopis}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        mapStyle={mapStyle}
        setMapStyle={setMapStyle}
        staticMap={staticMap}
        setStaticMap={setStaticMap}
        onMapCenterChange={(c) => setMapCenter(c)}
        onMapAddressChange={(a) => setMapAddressLabel(a)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        guestCheckout={guestCheckout}
        setGuestCheckout={setGuestCheckout}
        shopPercentile={shopPercentile}
        setShopPercentile={setShopPercentile}
        onReset={() => {
          setExpandMs(defaultExpandMs)
          setCollapseMs(defaultCollapseMs)
          setExpandCubic(defaultExpandCubic)
          setCollapseCubic(defaultCollapseCubic)
          setExpandMode('bezier')
          setCollapseMode('bezier')
          setSelectedMethod(0)
          setSelectedPayment(0)
          setToggleMs(150)
          setToggleCubic(defaultExpandCubic)
          setTogMode('bezier')
          setExpandSpring({ mass: 1, stiffness: 302, damping: 26 } as any)
          setCollapseSpring({ mass: 1, stiffness: 302, damping: 26 } as any)
          setToggleSpring({ mass: 1, stiffness: 302, damping: 26 } as any)
          // Reset sheet spring to defaults and restore default linear easing/duration
          setSpringDirty(false)
          setSheetMass(1)
          setSheetStiffness(302)
          setSheetDamping(26)
          setSheetOpenMs(defaultSheetOpenMs)
          setSheetCloseMs(defaultSheetCloseMs)
          setSheetOpenCubic(defaultExpandCubic)
          setSheetCloseCubic(defaultCollapseCubic)
          setSheetMode('spring')
          setSheetCloseMode('bezier')
          // Reset thumbnails morph to defaults and pause duration
          setThumbMode('bezier')
          setThumbMass(1)
          setThumbStiffness(302)
          setThumbDamping(26)
          setThumbMs(defaultThumbMs)
          setThumbCubic([0.51, 0.00, 0.72, 0.51])
          setThumbEasingOverride(defaultThumbEasingOverride)
          setPauseMs(100)
          setSpinnerMs(350)
          setSpinnerMsPay(350)
          // Reset Section stagger defaults
          setStgMs(defaultStgMs)
          setStgFirst(defaultStgFirst)
          setStgStep(defaultStgStep)
          setStgOffset(defaultStgOffset)
          setStgBlur(defaultStgBlur)
          setStgExitEnabled(true)
          setReduceMotion(false)
          setGuestCheckout(true)
          setSpinnerTrail(false)
          setSpinnerTrailOffset(230)
          setPaySpinner('circle')
          setSpinnerEnabled(true)
          setDigitalProduct(false)
          setMapStyle(darkMode ? 'night|default' : 'day|default')
          setMicroPressTransitions(true)
          setMicroChoiceUnit('px')
          setMicroChoiceGap(4)
          setMicroCheckmark('spring')
          setMicroScreenWidth(393)
          setMicroSelectedMethod(0)
        }}
      />
      {/* Principles modal */}
      {/* Dev guidelines modal */}
      <div
        className={`modal-backdrop ${devGuidesOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        style={{ display: devGuidesOpen ? 'grid' : 'none' }}
        onClick={() => setDevGuidesOpen(false)}
      >
        <div className={`modal-card mapbox-modal ${devGuidesOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="settings-title">Sequence implementation guidelines</span>
            <button className="icon-btn" aria-label="Close" onClick={() => setDevGuidesOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <h2>Preferred implementation</h2>
            <p>A fully CSS-driven checkmark animation — no images, no JS at runtime. Two SVG paths inside a 75×75 viewBox, animated entirely via CSS keyframes.</p>
            <div style={{ paddingLeft: 16 }}>
              <h3>CSS Stroke</h3>
              <div style={{ paddingLeft: 16 }}>
                <h3 style={{ color: '#ffffff' }}>Circle</h3>
                <ul>
                  <li>Drawn on using <code>stroke-dashoffset</code> (201 → 0) over 540 ms</li>
                  <li>Starts at 3 o'clock, rotates 180° to land the seam at 9 o'clock</li>
                  <li>Stroke weight tapers from 13 px → 3.5 px as it draws</li>
                  <li>Scales from 0.3× → 1× while maintaining constant visual thickness via <code>vector-effect: non-scaling-stroke</code></li>
                  <li>Easing: <code>cubic-bezier(0.4, 0, 0.8, 0.6)</code> — subtle ease-in</li>
                </ul>
                <h3 style={{ color: '#ffffff' }}>Checkmark</h3>
                <ul>
                  <li>Starts drawing once the circle is complete (540 ms delay)</li>
                  <li>Head draw: <code>stroke-dashoffset</code> 76 → 0 over 380 ms, pronounced ease-out (<code>cubic-bezier(0, 0, 0.1, 1)</code>)</li>
                  <li>Tail trim: a second simultaneous animation trims the leading 25 px (the overlap with the circle) using a 4-value <code>stroke-dasharray</code> — <code>0 0 76 100</code> → <code>0 25 51 100</code></li>
                  <li>Tail trim starts at 25% of the draw (635 ms) and finishes in sync with the head at 920 ms</li>
                </ul>
                <h3 style={{ color: '#ffffff' }}>Key techniques</h3>
                <ul>
                  <li><code>vector-effect: non-scaling-stroke</code> — decouples visual stroke width from CSS <code>scale()</code> transforms</li>
                  <li>4-value <code>stroke-dasharray</code> — enables CSS interpolation of a leading gap to trim the tail of a stroke</li>
                  <li>Two independent <code>animation</code> declarations on one element — <code>cssDrawCheck</code> animates <code>stroke-dashoffset</code>; <code>cssDrawCheckTail</code> animates <code>stroke-dasharray</code></li>
                  <li><code>key={"{restartKey}"}</code> on the SVG forces React to remount (restarting all CSS animations) on replay</li>
                </ul>
              </div>
            </div>
            <h2 style={{ marginTop: 36 }}>Other implementations</h2>
            <div style={{ paddingLeft: 16 }}>
              <h3>JS sequence (preloaded SVGs)</h3>
              <ul>
                <li>All frames in <code>src/assets/svg-sequence</code></li>
                <li>Preloads via <code>fetch</code> + <code>Image()</code>, reports FPS/bytes via <code>seq-status</code></li>
                <li>Pros: dynamic control (fps, events), easy to swap art</li>
              </ul>
              <h3>CSS Sprite (steps())</h3>
              <ul>
                <li>Single sprite at <code>public/images/check-sprite.svg</code></li>
                <li>Vertical layout with 2px gutters; Y-axis <code>steps(N)</code> animation</li>
                <li>Hybrid: JS drives playback during morph to avoid sampling drift</li>
              </ul>
              <h3>APNG/WebP</h3>
              <ul>
                <li>Drop-in image at <code>public/images/check.apng</code> / <code>check.webp</code></li>
                <li>0% JS at runtime; broad compatibility</li>
              </ul>
            </div>
            <h2 style={{ marginTop: 36 }}>Option comparison</h2>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Runtime JS</th>
                    <th>Files</th>
                    <th>Payload</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>CSS Stroke</strong></td>
                    <td>No</td>
                    <td>0 (inline SVG + CSS)</td>
                    <td>~0 KB extra</td>
                    <td>Default. Pure CSS, fully scalable, trivially themeable</td>
                  </tr>
                  <tr>
                    <td>JS sequence</td>
                    <td>Yes (during playback)</td>
                    <td>Multiple SVGs</td>
                    <td>≈ 27.8 KB</td>
                    <td>Precise frame control; preloads to prevent stutter</td>
                  </tr>
                  <tr>
                    <td>CSS sprite (hybrid)</td>
                    <td>Yes (during playback)</td>
                    <td>1 SVG sprite</td>
                    <td>≈ 29.2 KB</td>
                    <td>JS-free at idle; uses JS during morph to avoid drift</td>
                  </tr>
                  <tr>
                    <td>APNG/WebP</td>
                    <td>No</td>
                    <td>1 image</td>
                    <td>Varies</td>
                    <td>Best for 0% JS with raster art</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Mapbox instructions modal */}
      <div
        className={`modal-backdrop ${mapboxOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        style={{ display: mapboxOpen ? 'grid' : 'none' }}
        onClick={() => setMapboxOpen(false)}
      >
        <div className={`modal-card mapbox-modal ${mapboxOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="settings-title">Mapbox GL JS Performance Implementation Guide</span>
            <button className="icon-btn" aria-label="Close" onClick={() => setMapboxOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <h2>Overview</h2>
            <p>This document outlines best practices for implementing Mapbox GL JS with smooth animations and optimal performance, especially on mobile devices.</p>
            <h2>Key Techniques</h2>
            <h3>1. Wait for Map Idle Before Transitions</h3>
            <p>The <code>idle</code> event fires when the map has fully rendered all tiles and completed all animations. Always wait for this before starting camera transitions.</p>
            <pre><code>{`mapInstance.once('idle', () => {
  onReady() // Safe to start animations now
})`}</code></pre>
            <p><strong>Why</strong>: Starting camera animations before tiles are painted causes jank as the GPU tries to render tiles AND animate simultaneously.</p>
            <h3>2. Use easeTo for Camera Animations</h3>
            <pre><code>{`map.easeTo({
  pitch: 55,
  zoom: 15.5,
  duration: 1200,
  easing: (t) => 1 - Math.pow(1 - t, 3), // Cubic ease-out
})`}</code></pre>
            <p><strong>Options</strong>:</p>
            <ul>
              <li><code>easeTo</code> - Smooth, interruptible animation (recommended)</li>
              <li><code>flyTo</code> - Arc animation with zoom out/in (heavier)</li>
              <li><code>jumpTo</code> - Instant, no animation</li>
            </ul>
            <h3>3. Reduce Map Complexity</h3>
            <p>Disable unnecessary labels and features:</p>
            <pre><code>{`mapInstance.on('style.load', () => {
  mapInstance.setConfigProperty('basemap', 'lightPreset', 'day')
  mapInstance.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
  mapInstance.setConfigProperty('basemap', 'showTransitLabels', false)
})`}</code></pre>
            <h3>4. Start with Simple View, Animate to Complex</h3>
            <p>Start with a simpler camera angle and animate to the final 3D view:</p>
            <pre><code>{`// Initial state - flat, zoomed out (fewer tiles to render)
const mapInstance = new mapboxgl.Map({
  zoom: 14,
  pitch: 0,
  // ...
})

// Animate to final state after idle
map.easeTo({
  pitch: 55,
  zoom: 15.5,
  duration: 1200,
})`}</code></pre>
            <h3>5. Enable Antialiasing Selectively</h3>
            <pre><code>{`new mapboxgl.Map({
  antialias: true, // Smoother 3D buildings, slight performance cost
})`}</code></pre>
            <p>Consider disabling on low-end mobile devices.</p>
            <h3>6. Coordinate Animation Timing</h3>
            <p>Sync UI animations with map readiness:</p>
            <pre><code>{`// App state
const [animationDone, setAnimationDone] = useState(false)
const [mapReady, setMapReady] = useState(false)
const showContent = animationDone && mapReady

// Only trigger camera transition when both are ready
<Map 
  onReady={() => setMapReady(true)}
  triggerTransition={showContent}
/>`}</code></pre>
            <h3>7. Custom Markers with DOM Elements</h3>
            <p>Use Mapbox's <code>Marker</code> class with custom HTML for product markers:</p>
            <pre><code>{`const el = document.createElement('div')
el.innerHTML = \`<div class="custom-marker">...</div>\`

new mapboxgl.Marker({ element: el, anchor: 'bottom' })
  .setLngLat(position)
  .addTo(map)`}</code></pre>
            <p><strong>Performance tip</strong>: Keep marker DOM simple. Avoid heavy CSS animations on markers.</p>
            <h2>Map Events Reference</h2>
            <table>
              <thead>
                <tr><th>Event</th><th>When it Fires</th><th>Use Case</th></tr>
              </thead>
              <tbody>
                <tr><td><code>load</code></td><td>Style loaded</td><td>Add layers/sources</td></tr>
                <tr><td><code>style.load</code></td><td>Style fully parsed</td><td>Configure style properties</td></tr>
                <tr><td><code>idle</code></td><td>All tiles rendered</td><td>Start animations</td></tr>
                <tr><td><code>moveend</code></td><td>Camera animation done</td><td>Trigger dependent actions</td></tr>
              </tbody>
            </table>
            <h2>Mobile Considerations</h2>
            <ol>
              <li><strong>Reduce initial zoom</strong> - Fewer tiles to load</li>
              <li><strong>Lower pitch angles</strong> - Less 3D geometry to render</li>
              <li><strong>Disable 3D buildings on low-end devices</strong> - Check <code>navigator.hardwareConcurrency</code></li>
              <li><strong>Use <code>transformRequest</code></strong> - Cache tiles aggressively</li>
            </ol>
            <h2>Performance Monitoring</h2>
            <p>Use stats.js or r3f-perf (if using Three.js) to monitor:</p>
            <ul>
              <li>FPS during animations</li>
              <li>Memory usage</li>
              <li>Frame time consistency</li>
            </ul>
            <p>Target: 60fps during camera transitions, or at minimum smooth 30fps on mobile.</p>
          </div>
        </div>
      </div>
      <div
        className={`modal-backdrop ${principlesOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        style={{ display: principlesOpen ? 'grid' : 'none' }}
        onClick={() => setPrinciplesOpen(false)}
      >
        <div className={`modal-card ${principlesOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="settings-title">Motion principles</span>
            <button className="icon-btn" aria-label="Close" onClick={() => setPrinciplesOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            {/* Rollups */}
            <div className="principle-row">
              <div className="viz-col">
                <div className="viz-block">
                  <div className="viz-title">Rollups — Expand</div>
                  <BezierPreview x1={expandCubic[0]} y1={expandCubic[1]} x2={expandCubic[2]} y2={expandCubic[3]} />
                </div>
                <div className="viz-block">
                  <div className="viz-title">Rollups — Collapse</div>
                  <BezierPreview x1={collapseCubic[0]} y1={collapseCubic[1]} x2={collapseCubic[2]} y2={collapseCubic[3]} />
                </div>
              </div>
              <div className="text-col">
                <div className="pc-title">Rollups</div>
                <p>
                  Rollups are a core part of the checkout experience, so their motion is practical, not expressive. Expansion uses an ease‑out curve for a smooth, deliberate reveal, while collapse uses a tighter ease‑out for a quick, clean close. Collapsing is slightly faster to keep the flow efficient.
                  <br /><br />
                  No bounce, no recoil, and no caret rotation—extra motion adds visual noise and can make frequent interactions feel annoying. Every movement is purposeful, supporting clarity and responsiveness without distraction.
                </p>
              </div>
            </div>
            {/* Toggles */}
            <div className="principle-row">
              <div className="viz-col">
                <div className="viz-block">
                  <div className="viz-title">Toggles — Selection</div>
                  <BezierPreview x1={toggleCubic[0]} y1={toggleCubic[1]} x2={toggleCubic[2]} y2={toggleCubic[3]} />
                </div>
              </div>
              <div className="text-col">
                <div className="pc-title">Toggles</div>
                <p>
                  Toggles should behave like real-world switches—quick, responsive, and grounded in physical plausibility.
                  The motion should feel snappy and intentional. The animation should be short and fluid (typically 150–250ms)
                  to maintain responsiveness without feeling rushed. It avoids exaggerated easing or bounce effects, which can
                  introduce unnecessary playfulness and reduce clarity of state. When the content updates below, it should
                  synchronize precisely with the toggle's end state to reinforce clarity and polish.
                </p>
              </div>
            </div>
            {/* Sheets */}
            <div className="principle-row">
              <div className="viz-col">
                <div className="viz-block">
                  <div className="viz-title">Sheets — Open</div>
                  <LinearPreview points={overshootLinearPoints} />
                </div>
              </div>
              <div className="text-col">
                <div className="pc-title">Sheets — Open</div>
                <p>
                  Motion in Checkout exists to support understanding, not decoration. For small, frequent interactions like dropdowns,
                  toggles, or hover states, animations should feel immediate and purposeful—quick enough to keep the interface responsive
                  and free of distraction. In contrast, for larger surface transitions such as modals or overlaid sheets, motion can afford
                  a touch more realism: gentle easing or a subtle bounce can reinforce natural physical behavior, making these movements feel
                  intuitive and lifelike. Entry animations may carry this expressive quality to create a sense of arrival and context, while
                  exit motions should remain clean and swift, minimizing visual noise and keeping focus on what comes next.
                </p>
              </div>
            </div>
            {/* Pay now */}
            <div className="principle-row">
              <div className="viz-col">
                <div className="viz-block">
                  <div className="viz-title">Pay now transition</div>
                  <LinearPreview points={overshootLinearPoints} />
                </div>
              </div>
              <div className="text-col">
                <div className="pc-title">Pay now transition</div>
                <p>
                  The “Pay now” transition marks a key emotional peak in the checkout journey, reflecting the{' '}
                  <a href="https://www.nngroup.com/articles/peak-end-rule/" target="_blank" rel="noopener noreferrer">
                    peak‑end rule
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
                  in user experience. It should feel both expressive and rewarding—delivering immediate, clear feedback that confirms the
                  purchase while adding a celebratory touch that builds trust and satisfaction. Beyond leaving a positive final impression,
                  the animation should carry a distinct, opinionated style that makes subsequent checkouts instantly recognizable as part of
                  the Shopify experience, strengthening brand familiarity and confidence with every purchase.
                </p>
              </div>
            </div>
            {/* Microinteractions */}
            <div className="principle-row">
              <div className="viz-col">
                <div className="viz-block">
                  <div className="viz-title">Radio dot — Spring in</div>
                  <BezierPreview x1={0.34} y1={1.56} x2={0.64} y2={1} />
                </div>
                <div className="viz-block">
                  <div className="viz-title">Press release</div>
                  <BezierPreview x1={0.34} y1={1.2} x2={0.64} y2={1} />
                </div>
              </div>
              <div className="text-col">
                <div className="pc-title">Microinteractions</div>
                <p>
                  Microinteractions are the small moments that make an interface feel alive — a press state that yields under your finger, a radio button dot that springs into place, a checkbox that confirms your tap. Their role is purely functional: to close the feedback loop between user intent and system response, making the product feel responsive and under control. Each microinteraction exists to deliver feedback — not to be noticed.
                  <br /><br />
                  The most effective press states, selection animations, and state transitions are the ones users feel but never consciously see. Functional priority must always come before aesthetics: an animation that draws attention to itself has already failed its purpose. For Checkout, this means press states should resolve in under 100ms, selection feedback in under 300ms, and spring physics — high stiffness, well-damped — should give interactions a grounded, physical quality without veering into playfulness. The measure of a well-designed microinteraction is not whether users notice it, but whether they would notice its absence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentOptions() {
  const [sel, setSel] = useState<'card' | 'paypal' | 'shop'>('shop')
  return (
    <div className="payment-options">
      <div className={`payment-row ${sel === 'card' ? 'active' : ''}`} onClick={() => setSel('card')} role="radio" aria-checked={sel==='card'} tabIndex={0}>
        <div className="pay-left">
          <span className={`option-radio ${sel === 'card' ? 'selected' : ''}`} aria-hidden />
          <span className="pay-title">Credit card</span>
        </div>
        <div className="pay-logos" aria-hidden>
          <img src="/images/visa.png" alt="Visa" />
          <img src="/images/mastercard.png" alt="Mastercard" />
          <img src="/images/american_express.png" alt="Amex" />
        </div>
      </div>
      <div className={`payment-row ${sel === 'paypal' ? 'active' : ''}`} onClick={() => setSel('paypal')} role="radio" aria-checked={sel==='paypal'} tabIndex={0}>
        <div className="pay-left">
          <span className={`option-radio ${sel === 'paypal' ? 'selected' : ''}`} aria-hidden />
          <span className="pay-title">PayPal</span>
        </div>
        <div className="pay-logos" aria-hidden>
          <img src="/images/PayPal.png" alt="PayPal" />
        </div>
      </div>
      <div className={`payment-row ${sel === 'shop' ? 'active' : ''}`} onClick={() => setSel('shop')} role="radio" aria-checked={sel==='shop'} tabIndex={0}>
        <div className="pay-left">
          <span className={`option-radio ${sel === 'shop' ? 'selected' : ''}`} aria-hidden />
          <span className="pay-title">Shop Pay</span>
        </div>
        <div className="pay-logos" aria-hidden>
          <img src="/images/ShopPay.png" alt="Shop Pay" />
        </div>
      </div>
    </div>
  )
}

/* FixedCrossfade cross-fades between keyed children and animates the
   container height to the ACTIVE pane. This keeps the heading fixed
   and slides Payment smoothly without leaving extra space. */
function FixedCrossfade({
  activeKey,
  durationMs,
  cubic,
  children,
}: {
  activeKey: 'Ship' | 'Pickup'
  durationMs: number
  cubic: [number, number, number, number]
  children: React.ReactNode
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [activeHeight, setActiveHeight] = useState<number>(0)
  const easing = `cubic-bezier(${cubic.join(', ')})`

  React.useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const getActivePane = () =>
      el.querySelector(`[data-key="${activeKey}"]`) as HTMLElement | null
    const measure = () => {
      const p = getActivePane()
      if (!p) return
      setActiveHeight(p.scrollHeight)
    }
    measure()
    const panes = Array.from(el.querySelectorAll('[data-key]')) as HTMLElement[]
    const ros = panes.map(
      (p) =>
        new ResizeObserver(() => {
          // Always measure the ACTIVE pane to avoid jump on image/text load
          measure()
        })
    )
    panes.forEach((p, i) => ros[i].observe(p))
    return () => ros.forEach((ro) => ro.disconnect())
  }, [children, activeKey])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: activeHeight ? `${activeHeight}px` : undefined,
        overflow: 'visible', // allow drop-shadows to render fully
        paddingBottom: 21, // ensure 21px spacing below the dynamic container
        transition: `height ${durationMs}ms ${easing}`,
      }}
    >
      {React.Children.map(children as React.ReactElement[], (child) => {
        if (!React.isValidElement(child)) return null
        const key = (child.props as any)['data-key'] as string | undefined
        if (!key) return null
        const visible = key === activeKey
        return (
          <div
            style={{
              position: 'absolute' as const,
              inset: 0,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateZ(0)' : 'translateZ(0)', // GPU composite only; no vertical shift
              pointerEvents: visible ? 'auto' : 'none',
              transition: `opacity ${durationMs}ms ${easing}`,
              willChange: 'opacity',
            }}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

