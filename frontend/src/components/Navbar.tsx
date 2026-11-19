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
      <nav className="glass-nav fixed left-1/2 top-6 z-50 flex w-[min(1200px,92vw)] -translate-x-1/2 items-center justify-between rounded-full px-6 py-3 shadow-glass">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-moonstone-500 via-moonstone-400 to-moonstone-300" />
            <span className="font-display text-xl font-semibold text-moonstone-900">
              Takers
            </span>
          </div>

          <div className="relative hidden items-center gap-3 lg:flex">
            <button
              type="button"
              className="glass-button px-4 py-2 text-sm"
              onClick={() =>
                setOpenDropdown((prev) =>
                  prev === "categories" ? null : "categories",
                )
              }
            >
              Categories
              <ChevronDown className="h-4 w-4" />
            </button>
            <span className="glass-button px-4 py-2 text-sm">
              Marketplace
            </span>
            <AnimatePresence>
              {openDropdown === "categories" && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute left-0 top-14 w-80 rounded-2xl glass-card p-4 shadow-glass"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-moonstone-500">
                    Explore
                  </p>
                  <div className="mt-4 grid gap-4">
                    {categories.map((category) => (
                      <div key={category.name}>
                        <p className="text-sm font-semibold text-moonstone-900">
                          {category.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {category.sub.map((item) => (
                            <span
                              key={item}
                              className="glass-button px-3 py-1 text-xs"
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
          <div className="hidden items-center gap-3 glass-input md:flex">
            <Search className="h-4 w-4 text-moonstone-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setOpenDropdown("search")}
              onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
              placeholder="Search products, brands, or locations"
              className="w-full bg-transparent text-sm text-moonstone-900 placeholder:text-moonstone-500 focus:outline-none"
            />
          </div>
          <AnimatePresence>
            {openDropdown === "search" && (
              <motion.div
                {...dropdownMotion}
                className="absolute left-6 right-6 top-12 hidden rounded-2xl glass-card p-4 shadow-glass md:block"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-moonstone-500">
                  Suggestions
                </p>
                <div className="mt-3 grid gap-2">
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="glass-card px-3 py-2 text-left text-sm text-moonstone-900 transition hover:shadow-glass-lg"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-moonstone-500">
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
            className="hidden items-center gap-2 glass-button-primary px-4 py-2 text-sm md:flex"
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
            className="relative glass-button h-10 w-10"
          >
            <Heart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-moonstone-500 text-[10px] font-semibold text-white">
              3
            </span>
          </button>

          <button
            type="button"
            className="relative glass-button h-10 w-10"
            onClick={() => setIsChatOpen((prev) => !prev)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-moonstone-500 text-[10px] font-semibold text-white">
              2
            </span>
          </button>

          <div className="relative">
            <button
              type="button"
              className="relative glass-button h-10 w-10"
              onClick={() =>
                setOpenDropdown((prev) =>
                  prev === "notifications" ? null : "notifications",
                )
              }
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-moonstone-500 text-[10px] font-semibold text-white">
                5
              </span>
            </button>
            <AnimatePresence>
              {openDropdown === "notifications" && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute right-0 top-12 w-72 rounded-2xl glass-card p-4 shadow-glass"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-moonstone-500">
                    Activity
                  </p>
                  <div className="mt-3 grid gap-3">
                    {notifications.map((item) => (
                      <div
                        key={item.title}
                        className="glass-card px-3 py-2 text-sm text-moonstone-900"
                      >
                        <p className="font-medium text-moonstone-900">{item.title}</p>
                        <p className="text-xs text-moonstone-600">{item.detail}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-moonstone-500">
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
              className="flex items-center gap-2 glass-button px-3 py-2 text-sm"
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
                  className="absolute right-0 top-12 w-56 rounded-2xl glass-card p-4 shadow-glass"
                >
                  <button
                    type="button"
                    className="w-full glass-button text-left"
                  >
                    My Shop
                  </button>
                  <button
                    type="button"
                    className="w-full glass-button text-left"
                  >
                    Purchases
                  </button>
                  <button
                    type="button"
                    className="w-full glass-button text-left"
                  >
                    Analytics
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="glass-button h-10 w-10"
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
            className="glass-card fixed right-6 top-24 z-40 w-72 rounded-2xl p-4 shadow-glass"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-moonstone-900">Messages</p>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.3em] text-emerald-600"
                onClick={() => setIsChatOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {messages.map((item) => (
                <div
                  key={item.name}
                  className="glass-card rounded-xl px-3 py-2 text-sm text-moonstone-900"
                >
                  <p className="font-medium text-moonstone-900">{item.name}</p>
                  <p className="text-xs text-moonstone-500">{item.preview}</p>
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
              className="glass-card w-[min(520px,90vw)] rounded-3xl p-6 shadow-glass-xl"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
                  Sell item
                </p>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.3em] text-moonstone-400"
                  onClick={() => dispatch(closeSellModal())}
                >
                  Close
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {sellStep === 0 && (
                  <div>
                    <p className="text-lg font-semibold text-moonstone-900">
                      Choose a category
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          className="glass-button rounded-2xl px-4 py-3 text-left text-sm text-moonstone-700"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {sellStep === 1 && (
                  <div>
                    <p className="text-lg font-semibold text-moonstone-900">
                      Add listing details
                    </p>
                    <div className="mt-3 space-y-3">
                      <input
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm text-moonstone-800 placeholder:text-moonstone-400 focus:outline-none"
                        placeholder="Title"
                      />
                      <input
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm text-moonstone-800 placeholder:text-moonstone-400 focus:outline-none"
                        placeholder="Price"
                      />
                      <textarea
                        className="glass-input min-h-[120px] w-full rounded-xl px-4 py-3 text-sm text-moonstone-800 placeholder:text-moonstone-400 focus:outline-none"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                )}
                {sellStep === 2 && (
                  <div>
                    <p className="text-lg font-semibold text-moonstone-900">
                      Review & publish
                    </p>
                    <p className="mt-2 text-sm text-moonstone-500">
                      Your listing goes live instantly and appears in the
                      marketplace feed.
                    </p>
                    <div className="mt-4 glass-card rounded-2xl p-4 text-sm text-moonstone-700">
                      Premium streetwear bundle · ₱13,200 · Ready to publish
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.3em] text-moonstone-400"
                  disabled={sellStep === 0}
                  onClick={() => setSellStep((prev) => Math.max(prev - 1, 0))}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="glass-button-primary rounded-full px-4 py-2 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
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
