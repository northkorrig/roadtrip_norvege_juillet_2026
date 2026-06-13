import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import PwaManager from './components/pwa/PwaManager'
import { LoadingScreen, ToastProvider } from './components/ui'
import { AuthProvider, useAuth } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { TripDataProvider } from './state/TripDataContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const ItineraryPage = lazy(() => import('./pages/ItineraryPage'))
const PoisPage = lazy(() => import('./pages/PoisPage'))
const BivouacsPage = lazy(() => import('./pages/BivouacsPage'))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const SharePage = lazy(() => import('./pages/SharePage'))
const RoadbookPage = lazy(() => import('./pages/RoadbookPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

function ProtectedRoute({ children }: { children: ReactNode }): ReactNode {
  const { user, chargement } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) return <>{children}</>
  if (chargement) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function AppShell(): ReactNode {
  const { user } = useAuth()
  const location = useLocation()
  const sansNav =
    location.pathname.startsWith('/trip/') ||
    location.pathname === '/roadbook' ||
    location.pathname === '/login'

  return (
    // Remonte TripDataProvider quand l'utilisateur change pour forcer un rechargement des données
    <TripDataProvider key={user?.id ?? 'anonymous'}>
      {!sansNav && <NavBar />}
      <Suspense fallback={<div className="pt-24"><LoadingScreen /></div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/trip/:code" element={<SharePage />} />
          <Route path="/roadbook" element={<ProtectedRoute><RoadbookPage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/itineraire" element={<ProtectedRoute><ItineraryPage /></ProtectedRoute>} />
          <Route path="/pois" element={<ProtectedRoute><PoisPage /></ProtectedRoute>} />
          <Route path="/bivouacs" element={<ProtectedRoute><BivouacsPage /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </TripDataProvider>
  )
}

export default function App(): ReactNode {
  return (
    <ToastProvider>
      <PwaManager />
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
