import { Heart, MapPin } from "lucide-react"
import { useEffect, useMemo, useState, useCallback, memo } from "react"
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

// Memoized product card component to prevent re-renders
const ProductCard = memo(function ProductCard({ 
  product, 
  isLoading, 
  onClick, 
  onFavoriteClick,
  isFavorite 
}: {
  product: Product
  isLoading: boolean
  onClick: () => void
  onFavoriteClick: (e: React.MouseEvent) => void
  isFavorite: boolean
}) {
  return (
    <article
      key={product.id}
      className="group relative overflow-hidden rounded-2xl glass-card transition hover:shadow-glass-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-44 overflow-hidden rounded-xl bg-moonstone-900/50">
        {isLoading ? (
          <div className="h-full w-full animate-pulse bg-moonstone-800/50" />
        ) : product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.24em] text-moonstone-400">
            Takers
          </div>
        )}
        {!isLoading && (
          <button
            type="button"
            onClick={onFavoriteClick}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md transition-colors hover:bg-slate-800/80"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? "fill-rose-500 text-rose-500" : "text-moonstone-300"
              }`}
            />
          </button>
        )}
      </div>

      <div className="p-3 bg-moonstone-950/30 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <h3 className="line-clamp-2 text-sm font-semibold text-moonstone-100">
            {isLoading ? "Loading" : product.title}
          </h3>
          <p className="text-sm font-semibold text-emerald-400">
            {isLoading ? "--" : `₱${product.price}`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-moonstone-400">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{isLoading ? "Fetching" : product.location || "Remote"}</span>
        </div>
      </div>
    </article>
  )
})

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

  // Stable handlers using useCallback
  const handleProductClick = useCallback((productId: number) => {
    if (!isLoading) navigate(`/products/${productId}`)
  }, [isLoading, navigate])

  const handleFavoriteClick = useCallback((productId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    toggleFavorite(productId)
  }, [toggleFavorite])

  return (
    <section className="mx-auto mt-14 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-moonstone-400">
            Marketplace
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-moonstone-100">
            Live listings for today
          </h2>
        </div>
        <div className="hidden rounded-lg glass-button px-4 py-2 text-xs uppercase tracking-[0.2em] md:block">
          Auto-refresh
        </div>
      </div>

      {error && (
        <div className="mt-6 glass-card border-l-4 border-rose-500 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div
        className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        {displayProducts.map((product, index) => (
          <ProductCard
            key={isLoading ? index : product.id}
            product={product}
            isLoading={isLoading}
            onClick={() => handleProductClick(product.id)}
            onFavoriteClick={(e) => handleFavoriteClick(product.id, e)}
            isFavorite={product.is_favorite}
          />
        ))}
      </div>
    </section>
  )
}

export default ProductGrid
