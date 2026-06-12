import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import { LoadingScreen, ToastProvider } from './components/ui'
import { TripDataProvider } from './state/TripDataContext'

// Lazy loading : les pages carte (Google Maps) ne sont chargées qu'à la demande
const HomePage = lazy(() => import('./pages/HomePage'))
const ItineraryPage = lazy(() => import('./pages/ItineraryPage'))
const PoisPage = lazy(() => import('./pages/PoisPage'))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const SharePage = lazy(() => import('./pages/SharePage'))
const RoadbookPage = lazy(() => import('./pages/RoadbookPage'))

function AppShell(): ReactNode {
  const location = useLocation()
  const sansNav = location.pathname.startsWith('/trip/') || location.pathname === '/roadbook'

  return (
    <div className="min-h-[100dvh]">
      {!sansNav && <NavBar />}
      <Suspense fallback={<div className="pt-24"><LoadingScreen /></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/itineraire" element={<ItineraryPage />} />
          <Route path="/pois" element={<PoisPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/roadbook" element={<RoadbookPage />} />
          <Route path="/trip/:code" element={<SharePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App(): ReactNode {
  return (
    <ToastProvider>
      <TripDataProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TripDataProvider>
    </ToastProvider>
  )
}
