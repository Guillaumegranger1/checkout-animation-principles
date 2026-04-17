import { useState, useCallback, useEffect } from 'react'
import Map from './components/Map'
import Header from './components/Header'
import ConfirmationCard from './components/ConfirmationCard'
import OrderSummary from './components/OrderSummary'
import ShippingDetails from './components/ShippingDetails'
import IntroAnimation from './components/IntroAnimation'
import Perf from './components/Perf'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 500)
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 500)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return isDesktop
}

function App() {
  const [showContent, setShowContent] = useState(false)
  const isDesktop = useIsDesktop()
  
  const handleAnimationComplete = useCallback(() => {
    setShowContent(true)
  }, [])

  const content = (
    <div className="app">
      <IntroAnimation onComplete={handleAnimationComplete} />
      <div className={`main-content ${showContent ? 'visible' : ''}`}>
        <Header />
        <div className="map-section">
          <Map showMarker={showContent} />
        </div>
        <div className="content-section">
          <ConfirmationCard />
          <div className="content-scroll">
            <p className="confirmation-email">
              Confirmation will be sent to<br />
              jordanchen@gmail.com
            </p>
            <button className="btn btn-primary">
              Download to track order with <strong>shop</strong>
            </button>
            <button className="btn btn-secondary">
              Save my info for a faster checkout
            </button>
            <div className="divider" />
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              Email me with news and offers
            </label>
            <OrderSummary />
            <ShippingDetails />
          </div>
        </div>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <>
        <Perf />
        <div className="phone-frame">
          <div className="phone-screen">
            {content}
          </div>
        </div>
      </>
    )
  }

  return <div className="mobile-container">{content}</div>
}

export default App
