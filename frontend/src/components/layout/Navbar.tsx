import { AnimatePresence } from "framer-motion"
import {
  Bell,
  Home,
  Plus,
  Search,
  ShoppingBag,
  Settings,
  LogOut,
  Store,
  Heart,
  Users,
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/AuthContext"
import apiClient from "../../api/client"
import GlobalSearchResults from "../search/GlobalSearchResults"

interface NavbarProps {
  onOpenSell: () => void
}

function Navbar({ onOpenSell }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchUsers, setSearchUsers] = useState<any[]>([])
  const [searchProducts, setSearchProducts] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: number
    title: string
    message: string
    time: string
    isRead: boolean
    link?: string
  }>>([])
  const [notificationCount, setNotificationCount] = useState(0)

  const isActive = (path: string) => location.pathname === path

  // Global search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchUsers([])
      setSearchProducts([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      // Search users and products simultaneously
      const [usersResponse, productsResponse] = await Promise.all([
        apiClient.get(`/users/search/?q=${encodeURIComponent(query)}`),
        apiClient.get(`/products/?search=${encodeURIComponent(query)}&page_size=10`),
      ])

      setSearchUsers(usersResponse.data?.results || usersResponse.data || [])
      setSearchProducts(productsResponse.data?.results || productsResponse.data || [])
    } catch (error) {
      console.error("Search failed:", error)
      setSearchUsers([])
      setSearchProducts([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300) // Wait 300ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  // Helper function for time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  // Fetch real notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return
      
      try {
        const response = await apiClient.get<{ results: any[] }>("/notifications/")
        const data = response.data.results || response.data
        
        setNotifications(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: formatTimeAgo(n.created_at),
          isRead: n.is_read,
          link: n.link,
        })))
        
        // Get unread count
        const countRes = await apiClient.get("/notifications/unread_count/")
        setNotificationCount(countRes.data.count)
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
    }
    
    if (user) {
      fetchNotifications()
      // Refresh every 60 seconds to keep notification polling light
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/notifications/mark_all_read/")
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      setNotificationCount(0)
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark this notification as read
      if (!notification.isRead) {
        await apiClient.post(`/notifications/${notification.id}/mark_read/`)
        
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ))
        setNotificationCount(prev => Math.max(0, prev - 1))
      }
      
      // Navigate to the link if it exists
      if (notification.link) {
        navigate(notification.link)
      }
      
      // Close the dropdown
      setShowNotifications(false)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-moonstone-200 bg-moonstone-50/80 backdrop-blur-md shadow-glass">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between gap-4 px-4">
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="glass-button flex items-center gap-2 px-3 py-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-moonstone-400 to-moonstone-600 shadow-glow-moonstone">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="hidden text-xl font-bold text-moonstone-700 lg:block">Takers</span>
          </button>

          {/* Search */}
          <div className="glass-card hidden items-center gap-2 px-4 py-2 md:flex">
            <Search className="h-5 w-5 text-moonstone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              placeholder="Search users and products..."
              className="w-64 bg-transparent text-sm text-moonstone-900 placeholder:text-moonstone-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="glass-button relative px-6 py-2 transition"
          >
            <Home
              className={`h-6 w-6 transition ${
                isActive("/") ? "text-moonstone-700" : "text-moonstone-500"
              }`}
            />
            {isActive("/") && (
              <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-moonstone-600" />
            )}
          </button>

          <button
            onClick={() => navigate("/marketplace")}
            className="glass-button relative px-6 py-2 transition"
          >
            <ShoppingBag
              className={`h-6 w-6 transition ${
                isActive("/marketplace") ? "text-moonstone-700" : "text-moonstone-500"
              }`}
            />
            {isActive("/marketplace") && (
              <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-moonstone-600" />
            )}
          </button>

          <button
            onClick={() => navigate("/friends")}
            className="glass-button relative px-6 py-2 transition"
          >
            <Users
              className={`h-6 w-6 transition ${
                isActive("/friends") ? "text-moonstone-700" : "text-moonstone-500"
              }`}
            />
            {isActive("/friends") && (
              <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-moonstone-600" />
            )}
          </button>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Sell Button */}
          {user && (
            <button
              onClick={onOpenSell}
              className="glass-button-primary hidden items-center gap-2 px-4 py-2 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg md:flex"
            >
              <Plus className="h-5 w-5" />
              Sell
            </button>
          )}

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="glass-button relative p-2"
              >
                <Bell className="h-6 w-6 text-moonstone-600" />
                {notificationCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <div
                    className="absolute right-0 top-14 w-96 glass-card p-4 shadow-glow-moonstone-lg transition-all duration-150"
                    style={{ opacity: 1, transform: 'translateY(0)' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-moonstone-900">Notifications</h3>
                      {notificationCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-moonstone-600 hover:text-moonstone-700"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <Bell className="mx-auto mb-2 h-12 w-12 text-moonstone-300" />
                          <p className="text-sm text-moonstone-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`glass-card cursor-pointer p-3 transition hover:shadow-glass ${
                              !notification.isRead ? "border-l-4 border-moonstone-500" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-moonstone-900">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-xs text-moonstone-600">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-moonstone-400">
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="mt-1 h-2 w-2 rounded-full bg-moonstone-500" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="glass-button flex items-center gap-2 p-1 pr-3"
              >
                <div className="glass-card flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600">
                      <span className="text-sm font-bold text-white">
                        {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <svg
                  className="h-4 w-4 text-moonstone-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <div
                    className="absolute right-0 top-14 w-72 glass-card p-3 shadow-glow-moonstone-lg transition-all duration-150"
                    style={{ opacity: 1, transform: 'translateY(0)' }}
                  >
                    <div className="glass-card mb-3 flex items-center gap-3 p-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-moonstone-400 to-moonstone-600">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-white">
                            {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-moonstone-900">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-xs text-moonstone-500">{user.email}</p>
                        {(user.is_staff || user.is_superuser) && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {user.is_superuser ? "SUPERADMIN" : "ADMIN"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          navigate(`/shop/${user.id}`)
                          setShowProfileMenu(false)
                        }}
                        className="glass-button flex w-full items-center gap-3 px-3 py-2 text-left text-moonstone-700 hover:bg-moonstone-100"
                      >
                        <Store className="h-5 w-5 text-moonstone-600" />
                        <span className="text-sm font-medium text-moonstone-800">My Shop</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate("/favorites")
                          setShowProfileMenu(false)
                        }}
                        className="glass-button flex w-full items-center gap-3 px-3 py-2 text-left text-moonstone-700 hover:bg-moonstone-100"
                      >
                        <Heart className="h-5 w-5 text-moonstone-600" />
                        <span className="text-sm font-medium text-moonstone-800">Saved Items</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate("/settings")
                          setShowProfileMenu(false)
                        }}
                        className="glass-button flex w-full items-center gap-3 px-3 py-2 text-left text-moonstone-700 hover:bg-moonstone-100"
                      >
                        <Settings className="h-5 w-5 text-moonstone-600" />
                        <span className="text-sm font-medium text-moonstone-800">Settings</span>
                      </button>

                      {user.is_staff && (
                        <button
                          onClick={() => {
                            navigate("/admin")
                            setShowProfileMenu(false)
                          }}
                          className="glass-button flex w-full items-center gap-3 px-3 py-2 text-left text-moonstone-700 hover:bg-moonstone-100"
                        >
                          <svg
                            className="h-5 w-5 text-moonstone-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium text-moonstone-800">Admin Panel</span>
                        </button>
                      )}

                      <div className="my-2 h-px bg-moonstone-200" />

                      <button
                        onClick={() => {
                          logout()
                          setShowProfileMenu(false)
                        }}
                        className="glass-button flex w-full items-center gap-3 px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-5 w-5 text-rose-600" />
                        <span className="text-sm font-medium text-rose-600">Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="glass-button-primary px-6 py-2 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="border-t border-moonstone-200 px-4 py-2 md:hidden">
        <div className="glass-card flex items-center gap-2 px-4 py-2">
          <Search className="h-4 w-4 text-moonstone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            placeholder="Search users and products..."
            className="flex-1 bg-transparent text-sm text-moonstone-900 placeholder:text-moonstone-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Global Search Results */}
      <GlobalSearchResults
        isOpen={showSearchResults}
        onClose={() => setShowSearchResults(false)}
        query={searchQuery}
        users={searchUsers}
        products={searchProducts}
        isLoading={isSearching}
      />
    </nav>
  )
}

export default Navbar
