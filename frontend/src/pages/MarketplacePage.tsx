import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

import apiClient from "../api/client"
import ProductGrid from "../components/marketplace/ProductGrid"
import type { ProductFilters } from "../components/marketplace/ProductGrid"

interface Category {
  id: number
  name: string
}

const locations = ["New York", "Los Angeles", "Berlin", "Tokyo", "Lagos", "Dubai"]

function MarketplacePage({ refreshKey }: { refreshKey: number }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(5000)

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await apiClient.get<{ results: Category[] } | Category[]>(
        "/categories/",
      )
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results
      setCategories(data)
    }

    fetchCategories()
  }, [])

  const filters = useMemo<ProductFilters>(
    () => ({
      search,
      priceMin,
      priceMax,
      categories: selectedCategories,
      location,
    }),
    [search, priceMin, priceMax, selectedCategories, location],
  )

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 pb-20 pt-28 md:px-10 lg:pl-24">
      <aside className="sticky top-28 hidden h-fit w-72 flex-col gap-6 glass-card p-5 lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-moonstone-400">
            Filters
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold text-moonstone-100">
            Refine your feed
          </h3>
        </div>

        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-moonstone-300">
            Search
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try headphones"
            className="glass-input w-full px-5 py-4 text-sm text-moonstone-100 placeholder:text-moonstone-400"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-moonstone-300">
            Location
          </label>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="glass-input w-full px-5 py-4 text-sm text-moonstone-100 bg-moonstone-900/90"
          >
            <option value="" className="bg-moonstone-900 text-moonstone-100">All locations</option>
            {locations.map((city) => (
              <option key={city} value={city} className="bg-moonstone-900 text-moonstone-100">
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-moonstone-300">
            Price range
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={5000}
              value={priceMin}
              onChange={(event) => {
                const value = Number(event.target.value)
                setPriceMin(value)
                if (value > priceMax) {
                  setPriceMax(value)
                }
              }}
              className="w-full accent-moonstone-400"
            />
            <input
              type="range"
              min={0}
              max={5000}
              value={priceMax}
              onChange={(event) => {
                const value = Number(event.target.value)
                setPriceMax(value)
                if (value < priceMin) {
                  setPriceMin(value)
                }
              }}
              className="w-full accent-moonstone-400"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-moonstone-300">
            <span>₱{priceMin}</span>
            <span>₱{priceMax}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-moonstone-300">
            Categories
          </label>
          <div className="grid gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center justify-between glass-card px-4 py-3 text-sm text-moonstone-200 cursor-pointer hover:text-moonstone-100 transition"
              >
                <span>{category.name}</span>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="h-4 w-4 rounded border-moonstone-600/50 bg-moonstone-900/50 text-moonstone-400 focus:ring-moonstone-500/40"
                />
              </label>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl glass-card px-8 py-10 shadow-glass"
        >
          <div className="absolute inset-y-0 left-0 w-1 bg-moonstone-400" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-moonstone-400 font-semibold">
              Social Commerce
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-moonstone-100 md:text-4xl">
              Take what you want, sell what you don't.
            </h1>
            <p className="mt-3 text-sm text-moonstone-300">
              Discover trending picks, negotiate instantly, and build your
              marketplace presence with verified sellers.
            </p>
          </div>
        </motion.div>

        <ProductGrid filters={filters} refreshKey={refreshKey} />
      </section>
    </div>
  )
}

export default MarketplacePage