import { motion } from "framer-motion"
import { Heart, MapPin } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import apiClient from "../../api/client"

interface Product {
  id: number
  title: string
  price: string
  currency: string
  location: string
  image_urls: string[]
  is_favorite: boolean
}

interface ProductResponse {
  results: Product[]
}

export interface ProductFilters {
  search: string
  priceMin: number | null
  priceMax: number | null
  categories: number[]
  location: string
}

interface ProductGridProps {
  filters: ProductFilters
  refreshKey: number
}

function ProductGrid({ filters, refreshKey }: ProductGridProps) {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.search) {
      params.set("search", filters.search)
    }
    if (filters.priceMin !== null) {
      params.set("price_min", String(filters.priceMin))
    }
    if (filters.priceMax !== null) {
      params.set("price_max", String(filters.priceMax))
    }
    if (filters.location) {
      params.set("location", filters.location)
    }
    if (filters.categories.length > 0) {
      params.set("category", filters.categories.join(","))
    }
    return params.toString()
  }, [filters])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await apiClient.get<ProductResponse | Product[]>(
          `/products/${queryString ? `?${queryString}` : ""}`,
        )
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results
        setProducts(data)
      } catch (err) {
        setError("Unable to load products")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
    
    // Real-time polling every 30 seconds to avoid rate limiting
    const interval = setInterval(fetchProducts, 30000)
    return () => clearInterval(interval)
  }, [queryString, refreshKey])

  const toggleFavorite = async (productId: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, is_favorite: !product.is_favorite }
          : product,
      ),
    )
    try {
      await apiClient.post(`/products/${productId}/favorite/`)
    } catch (err) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, is_favorite: !product.is_favorite }
            : product,
        ),
      )
    }
  }

  const displayProducts: Product[] = isLoading
    ? Array.from({ length: 8 }).map(
        () => ({
          id: 0,
          title: "",
          price: "",
          currency: "",
          location: "",
          image_urls: [],
          is_favorite: false,
        } as Product),
      )
    : products

  return (
    <section className="mx-auto mt-14 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Marketplace
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            Live listings for today
          </h2>
        </div>
        <div className="hidden rounded-lg border border-white/10 bg-night-800/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 md:block">
          Auto-refresh
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <motion.div
        layout
        className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        {displayProducts.map((product, index) => (
          <motion.article
            key={isLoading ? index : product.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-night-800/80 p-3 shadow-glass transition hover:border-emerald-300/30"
            onClick={() => !isLoading && navigate(`/products/${product.id}`)}
          >
            <div className="relative h-44 overflow-hidden rounded-xl bg-night-700">
              {isLoading ? (
                <div className="h-full w-full animate-pulse bg-white/10" />
              ) : product.image_urls?.[0] ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.24em] text-slate-300">
                  Takers
                </div>
              )}
              {!isLoading && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleFavorite(product.id)
                  }}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-black/50 text-white backdrop-blur"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      product.is_favorite ? "fill-rose-500 text-rose-500" : "" 
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="line-clamp-2 text-sm font-semibold text-white">
                  {isLoading ? "Loading" : product.title}
                </h3>
                <p className="text-sm font-semibold text-emerald-200">
                  {isLoading ? "--" : `₱${product.price}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="h-3 w-3" />
                <span>{isLoading ? "Fetching" : product.location || "Remote"}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}

export default ProductGrid
