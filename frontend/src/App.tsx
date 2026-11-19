import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import apiClient from "./api/client"
import AuthPage from "./pages/auth/AuthPage"
import Navbar from "./components/layout/Navbar"
import SellItemModal from "./components/marketplace/SellItemModal"
import FloatingChat from "./components/chat/FloatingChat"
import HomePage from "./pages/HomePage"
import MarketplacePage from "./pages/MarketplacePage"
import AdminDashboard from "./pages/admin/AdminDashboard"
import ChatHubPage from "./pages/chat/ChatHubPage"
import ProductDetailPage from "./pages/marketplace/ProductDetailPage"
import UserProfilePage from "./pages/profile/UserProfilePage"
import SettingsPage from "./pages/SettingsPage"
import FriendsPage from "./pages/FriendsPage"
import FavoritesPage from "./pages/FavoritesPage"
import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage"
import TermsPage from "./pages/legal/TermsPage"
import CookiePolicyPage from "./pages/legal/CookiePolicyPage"
import Footer from "./components/layout/Footer"
import CookieConsent from "./components/legal/CookieConsent"
import { useAuth } from "./auth/AuthContext"
import { ChatProvider } from "./contexts/ChatContext"
import { useAppSelector } from "./store"

function AppShell() {
  const theme = useAppSelector((state) => state.ui.theme)
  const [isSellOpen, setIsSellOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const { user } = useAuth()
  
  // Admin theme - different color scheme for admin users
  const isAdmin = user?.is_staff || user?.is_superuser

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark")
    // Add admin class to body for special styling
    document.body.classList.toggle("admin-mode", isAdmin)
  }, [theme, isAdmin])

  // Fetch unread message count in real-time
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return
      
      try {
        const response = await apiClient.get<{ results: any[] }>('/messages/?ordering=-created_at')
        const messages = response.data.results || []
        
        // Count unread messages where current user is recipient
        const unread = messages.filter((msg: any) => 
          msg.recipient === user.id && !msg.is_read
        ).length
        
        setUnreadMessageCount(unread)
      } catch (error) {
        console.error('Failed to fetch unread message count:', error)
      }
    }
    
    if (user) {
      fetchUnreadCount()
      // Poll every 30 seconds instead of 3 seconds to reduce load
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const requireAuth = (element: ReactNode) =>
    user ? element : <Navigate to="/auth" replace />
  const requireStaff = (element: ReactNode) =>
    user?.is_staff ? element : <Navigate to="/" replace />

  return (
    <div className={`min-h-screen ${isAdmin ? 'admin-theme' : ''}`}>
      {user && <Navbar onOpenSell={() => setIsSellOpen(true)} />}
      <main>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={user ? <HomePage /> : <Navigate to="/auth" replace />} />
          <Route path="/marketplace" element={user ? <MarketplacePage refreshKey={refreshKey} /> : <Navigate to="/auth" replace />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/shop/:id" element={<UserProfilePage />} />
          <Route path="/messages" element={requireAuth(<ChatHubPage />)} />
          <Route path="/friends" element={requireAuth(<FriendsPage />)} />
          <Route path="/favorites" element={requireAuth(<FavoritesPage />)} />
          <Route path="/settings" element={requireAuth(<SettingsPage />)} />
          <Route path="/admin" element={requireStaff(<AdminDashboard />)} />
          <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/cookies" element={<CookiePolicyPage />} />
        </Routes>
      </main>
      <Footer />
      {user && (
        <>
          <SellItemModal
            isOpen={isSellOpen}
            onClose={() => setIsSellOpen(false)}
            onCreated={() => {
              setIsSellOpen(false)
              setRefreshKey((prev) => prev + 1)
              setToast("Listing published to marketplace")
              setTimeout(() => setToast(null), 2400)
            }}
          />
          <FloatingChat messageCount={unreadMessageCount} />
        </>
      )}
      <CookieConsent />
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed right-6 top-6 z-[70] neu-button px-6 py-3 text-sm font-medium ${
              isAdmin ? 'bg-purple-500 text-white' : 'text-green-700'
            }`}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ChatProvider>
        <AppShell />
      </ChatProvider>
    </BrowserRouter>
  )
}

export default App
