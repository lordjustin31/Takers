import { AnimatePresence, motion } from "framer-motion"
import { Check, FileText, Gavel, TrendingUp, Users, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import apiClient from "../../api/client"
import { useAuth } from "../../auth/AuthContext"

interface DashboardStats {
  total_sales: string
  active_listings: number
  sold_listings: number
  active_disputes: number
  resolved_disputes: number
  total_users: number
  new_listings_last_30_days: number
}

interface TrendingData {
  top_categories: Array<{ product__category__name: string; total: number }>
  top_locations: Array<{ location: string; total: number }>
}

interface SellerProfile {
  username: string
  display_name: string
}

interface ProductModerationItem {
  id: number
  title: string
  price: string
  currency: string
  moderation_status: string
  seller: SellerProfile
}

interface DisputeItem {
  id: number
  reporter: SellerProfile
  target_user: SellerProfile | null
  target_product: { id: number; title: string } | null
  reason: string
  status: string
  created_at: string
}

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trending, setTrending] = useState<TrendingData | null>(null)
  const [pendingProducts, setPendingProducts] = useState<ProductModerationItem[]>([])
  const [openDisputes, setOpenDisputes] = useState<DisputeItem[]>([])
  const [activeDispute, setActiveDispute] = useState<DisputeItem | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [resolutionStatus, setResolutionStatus] = useState("under_review")

  const totalListings = useMemo(() => {
    if (!stats) return 0
    return stats.active_listings + stats.sold_listings
  }, [stats])

  const soldPercent = useMemo(() => {
    if (!stats || totalListings === 0) return 0
    return Math.round((stats.sold_listings / totalListings) * 100)
  }, [stats, totalListings])

  useEffect(() => {
    if (!user?.is_staff) {
      return
    }
    const fetchAll = async () => {
      const [statsResponse, trendingResponse, productsResponse, disputesResponse] =
        await Promise.all([
          apiClient.get<DashboardStats>("/admin/dashboard-stats/"),
          apiClient.get<TrendingData>("/admin/trending/"),
          apiClient.get<{ results: ProductModerationItem[] }>(
            "/products/?moderation_status=pending",
          ),
          apiClient.get<{ results: DisputeItem[] }>(
            "/admin/disputes/?status=open",
          ),
        ])

      setStats(statsResponse.data)
      setTrending(trendingResponse.data)
      setPendingProducts(productsResponse.data.results)
      setOpenDisputes(disputesResponse.data.results)
    }

    fetchAll()
  }, [user])

  const handleProductAction = async (
    productId: number,
    action: "approve" | "reject",
  ) => {
    await apiClient.post(`/products/${productId}/${action}/`)
    setPendingProducts((prev) => prev.filter((item) => item.id !== productId))
  }

  const handleArbitrate = async () => {
    if (!activeDispute) return
    await apiClient.post(`/admin/disputes/${activeDispute.id}/arbitrate/`, {
      status: resolutionStatus,
      resolution_notes: resolutionNotes,
    })
    setOpenDisputes((prev) => prev.filter((item) => item.id !== activeDispute.id))
    setActiveDispute(null)
    setResolutionNotes("")
    setResolutionStatus("under_review")
  }

  if (!user?.is_staff) {
    return (
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <div className="glass-card p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-moonstone-400">Restricted</p>
          <h1 className="mt-3 text-2xl font-semibold text-moonstone-800">Admin access only</h1>
          <p className="mt-2 text-sm text-moonstone-500">
            Please sign in with a staff account to view analytics.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-moonstone-50 to-moonstone-100 px-6 pb-20 pt-28 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-moonstone-400">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-bold text-moonstone-900">Marketplace Dashboard</h1>
          </div>
          <div className="glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium text-moonstone-600">
            <div className="h-2 w-2 animate-pulse rounded-full bg-moonstone-500" />
            Live Metrics
          </div>
        </header>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 shadow-glass"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="glass-card flex h-12 w-12 items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600">+12.5%</span>
            </div>
            <p className="text-xs uppercase tracking-widest text-moonstone-500">Total Sales</p>
            <p className="mt-2 text-2xl font-bold text-moonstone-900">
              ${stats?.total_sales || "0.00"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 shadow-glass"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="glass-card flex h-12 w-12 items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="h-16 w-20">
                <div className="flex h-full items-end justify-around gap-1">
                  {[40, 60, 45, 70].map((height, i) => (
                    <div
                      key={i}
                      className="w-2 rounded-t bg-gradient-to-t from-blue-400 to-blue-600"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs uppercase tracking-widest text-moonstone-500">Active Listings</p>
            <p className="mt-2 text-2xl font-bold text-moonstone-900">
              {stats?.active_listings || 0}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-moonstone-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                style={{ width: `${soldPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-moonstone-500">{soldPercent}% sold</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 shadow-glass"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="glass-card flex h-12 w-12 items-center justify-center">
                <Gavel className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-widest text-moonstone-500">Disputes</p>
            <p className="mt-2 text-2xl font-bold text-moonstone-900">
              {stats?.active_disputes || 0} Open
            </p>
            <p className="mt-1 text-xs text-moonstone-500">
              {stats?.resolved_disputes || 0} resolved
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 shadow-glass"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="glass-card flex h-12 w-12 items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-widest text-moonstone-500">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-moonstone-900">
              {stats?.total_users || 0}
            </p>
            <p className="mt-1 text-xs text-moonstone-500">
              +{stats?.new_listings_last_30_days || 0} new listings
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Products */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 shadow-glass"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-moonstone-400">Moderation</p>
                <h2 className="mt-1 text-xl font-semibold text-moonstone-900">Pending Listings</h2>
              </div>
              <span className="glass-card flex h-10 w-10 items-center justify-center text-sm font-bold text-moonstone-600">
                {pendingProducts.length}
              </span>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {pendingProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-moonstone-900">{product.title}</p>
                        <p className="mt-1 text-xs text-moonstone-500">
                          {product.seller.display_name || product.seller.username}
                        </p>
                        <p className="mt-2 text-sm font-bold text-moonstone-700">
                          {product.price} {product.currency}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleProductAction(product.id, "approve")}
                          className="glass-button flex h-10 w-10 items-center justify-center text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProductAction(product.id, "reject")}
                          className="glass-button flex h-10 w-10 items-center justify-center text-rose-600 hover:text-rose-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {pendingProducts.length === 0 && (
                <div className="py-8 text-center text-sm text-moonstone-400">
                  No pending listings
                </div>
              )}
            </div>
          </motion.div>

          {/* Open Disputes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 shadow-glass"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-moonstone-400">Support</p>
                <h2 className="mt-1 text-xl font-semibold text-moonstone-900">Open Disputes</h2>
              </div>
              <span className="glass-card flex h-10 w-10 items-center justify-center text-sm font-bold text-amber-600">
                {openDisputes.length}
              </span>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {openDisputes.map((dispute) => (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-moonstone-500">
                        Dispute #{dispute.id}
                      </p>
                      <div className="glass-card flex h-6 w-6 items-center justify-center">
                        <Gavel className="h-3 w-3 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-sm text-moonstone-700">{dispute.reason}</p>
                    <p className="mt-2 text-xs text-moonstone-500">
                      Reporter: {dispute.reporter.display_name || dispute.reporter.username}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveDispute(dispute)}
                      className="glass-button mt-3 w-full py-2 text-sm font-medium text-amber-700"
                    >
                      Arbitrate
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {openDisputes.length === 0 && (
                <div className="py-8 text-center text-sm text-moonstone-400">
                  No open disputes
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Trending Section */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 shadow-glass"
          >
            <p className="text-xs uppercase tracking-widest text-moonstone-400">Analytics</p>
            <h3 className="mt-2 text-lg font-semibold text-moonstone-900">Top Categories</h3>
            <div className="mt-6 space-y-4">
              {trending?.top_categories.map((item, index) => (
                <div key={item.product__category__name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-moonstone-700">
                      {item.product__category__name}
                    </span>
                    <span className="font-bold text-moonstone-900">{item.total}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-moonstone-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.total / 10) * 100}%` }}
                      transition={{ delay: index * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 shadow-glass"
          >
            <p className="text-xs uppercase tracking-widest text-moonstone-400">Geography</p>
            <h3 className="mt-2 text-lg font-semibold text-moonstone-900">Top Locations</h3>
            <div className="mt-6 space-y-4">
              {trending?.top_locations.map((item, index) => (
                <div key={item.location}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-moonstone-700">{item.location}</span>
                    <span className="font-bold text-moonstone-900">{item.total}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-moonstone-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.total / 10) * 100}%` }}
                      transition={{ delay: index * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dispute Modal */}
      <AnimatePresence>
        {activeDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-moonstone-900/60"
            onClick={() => setActiveDispute(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card mx-4 w-full max-w-md p-6 shadow-glow-moonstone-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-moonstone-900">
                  Dispute #{activeDispute.id}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDispute(null)}
                  className="glass-button flex h-8 w-8 items-center justify-center text-moonstone-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="glass-card mb-4 p-4">
                <p className="text-sm text-moonstone-700">{activeDispute.reason}</p>
                <p className="mt-2 text-xs text-moonstone-500">
                  Reporter: {activeDispute.reporter.display_name || activeDispute.reporter.username}
                </p>
                {activeDispute.target_product && (
                  <p className="mt-1 text-xs text-moonstone-500">
                    Product: {activeDispute.target_product.title}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="glass-input w-full"
                >
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                </select>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Resolution notes"
                  className="glass-input min-h-[120px] w-full resize-none"
                />
                <button
                  type="button"
                  onClick={handleArbitrate}
                  className="glass-button-primary w-full py-3 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
                >
                  Submit Decision
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default AdminDashboard
