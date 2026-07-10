import { AnimatePresence, motion } from "framer-motion"
import { Heart, ShoppingBag, X, MapPin, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import apiClient from "../api/client"
import { useAuth } from "../auth/AuthContext"

interface Product {
  id: number
  title: string
  description: string
  price: string
  currency: string
  location: string
  image_urls: string[]
  is_favorite: boolean
  seller: {
    id: number
    username: string
    display_name: string
    avatar_url: string
    is_verified_seller: boolean
  }
  created_at: string
  view_count: number
  category: number
}

function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true)
      try {
        const response = await apiClient.get<{ results: Product[] }>('/products/favorites/')
        setFavorites(response.data.results || [])
      } catch (error) {
        console.error("Failed to fetch favorites:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchFavorites, 60000)
    return () => clearInterval(interval)
  }, [])

  const removeFavorite = async (productId: number) => {
    try {
      await apiClient.post(`/products/${productId}/favorite/`)
      setFavorites((prev) => prev.filter((item) => item.id !== productId))
    } catch (error) {
      console.error("Failed to remove favorite:", error)
    }
  }

  const timeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-neu-50 pb-20 pt-16">
      <div className="mx-auto max-w-7xl px-4 pt-8">
        {/* Page Header */}
        <div className="neu-card mb-8 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-glow">
              <Heart className="h-8 w-8 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neu-900">Saved Items</h1>
              <p className="text-neu-600 mt-1">
                {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="neu-card h-80 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="neu-card p-16 text-center">
            <Heart className="mx-auto h-24 w-24 text-neu-300" />
            <h2 className="mt-6 text-2xl font-bold text-neu-600">No saved items yet</h2>
            <p className="mt-2 text-neu-500">
              Start saving items you like to see them here
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="neu-button mt-6 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white shadow-glow-blue hover:from-blue-600 hover:to-blue-700"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="neu-card group relative overflow-hidden"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="absolute right-3 top-3 z-10 neu-button bg-white p-2 opacity-0 transition group-hover:opacity-100"
                    title="Remove from favorites"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>

                  {/* Product Image */}
                  <div
                    className="relative h-48 cursor-pointer overflow-hidden bg-neu-200"
                    onClick={() => navigate(`/products/${item.id}`)}
                  >
                    {item.image_urls?.length > 0 ? (
                      <img
                        src={item.image_urls[0]}
                        alt={item.title}
                        className="h-full w-full object-cover transition group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-neu-300" />
                      </div>
                    )}
                    {item.image_urls.length > 1 && (
                      <div className="absolute bottom-2 right-2 neu-button flex items-center gap-1 px-2 py-1 text-xs font-medium">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        +{item.image_urls.length - 1}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 
                      className="cursor-pointer text-lg font-bold text-neu-900 hover:text-blue-600 line-clamp-2"
                      onClick={() => navigate(`/products/${item.id}`)}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                      {item.currency} {item.price}
                    </p>

                    {/* Seller Info */}
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className="neu-card h-8 w-8 cursor-pointer overflow-hidden rounded-full"
                        onClick={() => navigate(`/shop/${item.seller.id}`)}
                      >
                        {item.seller.avatar_url ? (
                          <img
                            src={item.seller.avatar_url}
                            alt={item.seller.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white">
                            {(item.seller.display_name || item.seller.username)
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neu-800 truncate">
                          {item.seller.display_name || item.seller.username}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neu-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{item.location || "Remote"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-neu-500">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo(item.created_at)}</span>
                      <span>•</span>
                      <span>{item.view_count} views</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/products/${item.id}`)}
                        className="neu-button flex-1 bg-gradient-to-r from-blue-500 to-blue-600 py-2 text-sm font-semibold text-white shadow-glow-blue hover:from-blue-600 hover:to-blue-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate("/messages", { state: { product: item, recipient: item.seller } })}
                        className="neu-button bg-gradient-to-r from-green-500 to-green-600 p-2 text-white shadow-glow hover:from-green-600 hover:to-green-700"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage
