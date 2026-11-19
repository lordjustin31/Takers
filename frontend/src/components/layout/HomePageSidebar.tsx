import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  ShoppingBag,
  Heart,
  MessageCircle,
  TrendingUp,
  MapPin,
  Package,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  badge?: number
  onClick: () => void
  isCollapsed: boolean
  isActive?: boolean
}

function SidebarItem({ icon, label, badge, onClick, isCollapsed, isActive }: SidebarItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
        isActive
          ? "glass-button-primary shadow-glow-moonstone text-white"
          : "glass-button text-moonstone-700 hover:text-moonstone-900 hover:bg-white/30"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex-shrink-0">{icon}</div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {badge !== undefined && badge > 0 && !isCollapsed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gradient-to-r from-rose-400 to-rose-500 px-2 text-xs font-bold text-white shadow-lg"
        >
          {badge > 99 ? "99+" : badge}
        </motion.span>
      )}

      {badge !== undefined && badge > 0 && isCollapsed && (
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-moonstone-50 shadow-lg" />
      )}
    </motion.button>
  )
}

export default function HomePageSidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Mock notification counts - replace with real data
  const notificationCount = 3
  const messageCount = 5

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-20 z-50 glass-button-primary p-3 shadow-lg lg:hidden"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{
          x: isMobileOpen ? 0 : -280,
          width: isCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] overflow-hidden lg:translate-x-0"
      >
        <div className="glass-card h-full w-full border-r border-white/20 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex h-full flex-col">
          {/* Toggle Button */}
          <div className="mb-6 flex items-center justify-between">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-lg font-bold uppercase tracking-wider text-moonstone-800"
                >
                  Menu
                </motion.h2>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="glass-button rounded-lg p-2 text-moonstone-600 hover:text-moonstone-900"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation Section */}
          <div className="mb-6 space-y-2">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-moonstone-500"
                >
                  Navigation
                </motion.p>
              )}
            </AnimatePresence>

            <SidebarItem
              icon={<Home className="h-5 w-5" />}
              label="Feed"
              onClick={() => navigate("/")}
              isCollapsed={isCollapsed}
              isActive={true}
            />
            <SidebarItem
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Browse All"
              onClick={() => navigate("/marketplace")}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={<TrendingUp className="h-5 w-5" />}
              label="Trending"
              onClick={() => navigate("/marketplace?sort=trending")}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={<MapPin className="h-5 w-5" />}
              label="Near You"
              onClick={() => navigate("/marketplace?filter=nearby")}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={<Heart className="h-5 w-5" />}
              label="Saved Items"
              onClick={() => navigate("/favorites")}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={<Package className="h-5 w-5" />}
              label="Your Listings"
              onClick={() => navigate("/my-products")}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Activity Section */}
          <div className="mb-6 space-y-2">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-moonstone-500"
                >
                  Activity
                </motion.p>
              )}
            </AnimatePresence>

            <SidebarItem
              icon={<MessageCircle className="h-5 w-5" />}
              label="Messages"
              badge={messageCount}
              onClick={() => navigate("/messages")}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={<Bell className="h-5 w-5" />}
              label="Notifications"
              badge={notificationCount}
              onClick={() => navigate("/notifications")}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* User Profile - At Bottom */}
          <div className="mt-auto">
            {user ? (
              <motion.button
                onClick={() => navigate(`/shop/${user.id}`)}
                className="glass-card flex w-full items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="glass-card h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-sm font-bold text-white">
                      {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden text-left"
                    >
                      <p className="truncate text-sm font-semibold text-moonstone-900">
                        {user.display_name || user.username}
                      </p>
                      <p className="truncate text-xs text-moonstone-600">View Profile</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ) : (
              <SidebarItem
                icon={<User className="h-5 w-5" />}
                label="Sign In"
                onClick={() => navigate("/auth")}
                isCollapsed={isCollapsed}
              />
            )}
          </div>
        </div>
      </div>
    </motion.aside>
    </>
  )
}
