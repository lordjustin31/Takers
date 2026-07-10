import { AnimatePresence, motion } from "framer-motion"
import {
  Bell,
  ChevronDown,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react"
import { useMemo, useState } from "react"

import { closeSellModal, openSellModal, toggleTheme } from "../features/uiSlice"
import { useAppDispatch, useAppSelector } from "../store"

const categories = [
  { name: "Electronics", sub: ["Phones", "Laptops", "Gaming", "Audio"] },
  { name: "Fashion", sub: ["Streetwear", "Sneakers", "Watches"] },
  { name: "Home", sub: ["Decor", "Appliances", "Smart Home"] },
  { name: "Vehicles", sub: ["Cars", "Motorcycles", "Parts"] },
]

const notifications = [
  { title: "Offer accepted", detail: "Vintage Leica M6", time: "2m ago" },
  { title: "Listing approved", detail: "Aether Pro Backpack", time: "1h ago" },
  { title: "New follower", detail: "Kara Studio", time: "3h ago" },
]

const messages = [
  { name: "Jae Brook", preview: "Can you hold it until Friday?" },
  { name: "Nova Mall", preview: "Payment confirmed. Shipping today." },
]

const suggestions = [
  { label: "Sony WH-1000XM6", meta: "Product" },
  { label: "Vintage Cameras", meta: "Category" },
  { label: "Tokyo, Japan", meta: "Location" },
  { label: "Aether Pro Backpack", meta: "Product" },
  { label: "PixelFold 2", meta: "Brand" },
]

const dropdownMotion = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
}

function Navbar() {
  const dispatch = useAppDispatch()
  const isSellModalOpen = useAppSelector((state) => state.ui.isSellModalOpen)

  const [openDropdown, setOpenDropdown] = useState<
    "categories" | "profile" | "notifications" | "search" | null
  >(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [sellStep, setSellStep] = useState(0)

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) {
      return suggestions.slice(0, 4)
    }
    return suggestions.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query])

  return (
    <>
      <nav className="glass fixed left-1/2 top-6 z-50 flex w-[min(1200px,92vw)] -translate-x-1/2 items-center justify-between rounded-full px-6 py-3 shadow-glass">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-300 via-sky-300 to-amber-300" />
            <span className="font-display text-xl font-semibold text-white">
              Takers
            </span>
          </div>

          <div className="relative hidden items-center gap-3 lg:flex">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
              onClick={() =>
                setOpenDropdown((prev) =>
                  prev === "categories" ? null : "categories",
                )
              }
            >
              Categories
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
              Marketplace
            </div>
            <AnimatePresence>
              {openDropdown === "categories" && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute left-0 top-14 w-80 rounded-2xl border border-white/10 bg-night-800/90 p-4 shadow-glass"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                    Explore
                  </p>
                  <div className="mt-4 grid gap-4">
                    {categories.map((category) => (
                      <div key={category.name}>
                        <p className="text-sm font-semibold text-white">
                          {category.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {category.sub.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative flex-1 px-6">
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-300" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setOpenDropdown("search")}
              onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
              placeholder="Search products, brands, or locations"
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <AnimatePresence>
            {openDropdown === "search" && (
              <motion.div
                {...dropdownMotion}
                className="absolute left-6 right-6 top-12 hidden rounded-2xl border border-white/10 bg-night-800/95 p-4 shadow-glass md:block"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Suggestions
                </p>
                <div className="mt-3 grid gap-2">
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-emerald-300/50"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {item.meta}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full bg-emerald-300/20 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-glow transition hover:bg-emerald-300/30 md:flex"
            onClick={() => {
              setSellStep(0)
              dispatch(openSellModal())
            }}
          >
            <Plus className="h-4 w-4" />
            Sell item
          </button>

          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200"
          >
            <Heart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-400 text-[10px] font-semibold text-night-900">
              3
            </span>
          </button>

          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200"
            onClick={() => setIsChatOpen((prev) => !prev)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-sky-400 text-[10px] font-semibold text-night-900">
              2
            </span>
          </button>

          <div className="relative">
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200"
              onClick={() =>
                setOpenDropdown((prev) =>
                  prev === "notifications" ? null : "notifications",
                )
              }
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-orange-400 text-[10px] font-semibold text-night-900">
                5
              </span>
            </button>
            <AnimatePresence>
              {openDropdown === "notifications" && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute right-0 top-12 w-72 rounded-2xl border border-white/10 bg-night-800/95 p-4 shadow-glass"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Activity
                  </p>
                  <div className="mt-3 grid gap-3">
                    {notifications.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                      >
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-xs text-slate-300">{item.detail}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                          {item.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              onClick={() =>
                setOpenDropdown((prev) => (prev === "profile" ? null : "profile"))
              }
            >
              <User className="h-4 w-4" />
              Profile
              <ChevronDown className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {openDropdown === "profile" && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute right-0 top-12 w-56 rounded-2xl border border-white/10 bg-night-800/95 p-4 shadow-glass"
                >
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10"
                  >
                    My Shop
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10"
                  >
                    Purchases
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10"
                  >
                    Analytics
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200"
            onClick={() => dispatch(toggleTheme())}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isChatOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="glass fixed right-6 top-24 z-40 w-72 rounded-2xl border border-white/10 p-4 shadow-glass"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Messages</p>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.3em] text-emerald-200/70"
                onClick={() => setIsChatOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {messages.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                >
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-300">{item.preview}</p>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSellModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="glass w-[min(520px,90vw)] rounded-3xl border border-white/10 p-6 shadow-glass"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
                  Sell item
                </p>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.3em] text-slate-400"
                  onClick={() => dispatch(closeSellModal())}
                >
                  Close
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {sellStep === 0 && (
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Choose a category
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {sellStep === 1 && (
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Add listing details
                    </p>
                    <div className="mt-3 space-y-3">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 focus:outline-none"
                        placeholder="Title"
                      />
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 focus:outline-none"
                        placeholder="Price"
                      />
                      <textarea
                        className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 focus:outline-none"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                )}
                {sellStep === 2 && (
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Review & publish
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Your listing goes live instantly and appears in the
                      marketplace feed.
                    </p>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
                      Premium streetwear bundle · $220 · Ready to publish
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.3em] text-slate-400"
                  disabled={sellStep === 0}
                  onClick={() => setSellStep((prev) => Math.max(prev - 1, 0))}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-full bg-emerald-300/20 px-4 py-2 text-sm font-semibold text-emerald-100"
                  onClick={() =>
                    setSellStep((prev) => (prev === 2 ? 0 : prev + 1))
                  }
                >
                  {sellStep === 2 ? "Publish" : "Next"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
