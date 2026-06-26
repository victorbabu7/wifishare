import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth.jsx'
import Intro from './components/Intro.jsx'
import App from './WifiShareApp.jsx'

function Root() {
  const [session, setSession] = useState(undefined)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) {
    if (showIntro) return <Intro onContinue={() => setShowIntro(false)} />
    return <Auth onShowIntro={() => setShowIntro(true)} />
  }
  return <App user={session.user} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
