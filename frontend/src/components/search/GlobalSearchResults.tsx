import { AnimatePresence } from "framer-motion"
import { Search, User, ShoppingBag, X, MessageCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/AuthContext"
import { useChat } from "../../contexts/ChatContext"

interface SearchUser {
  id: number
  username: string
  display_name: string
  avatar_url: string
  is_verified_seller: boolean
  is_private: boolean
  total_sales: number
}

interface SearchProduct {
  id: number
  title: string
  price: string
  currency: string
  image_urls: string[]
  seller: {
    username: string
    display_name: string
  }
}

interface GlobalSearchResultsProps {
  isOpen: boolean
  onClose: () => void
  query: string
  users: SearchUser[]
  products: SearchProduct[]
  isLoading: boolean
}

function GlobalSearchResults({
  isOpen,
  onClose,
  query,
  users,
  products,
  isLoading,
}: GlobalSearchResultsProps) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { openThreadWithUser } = useChat()

  const handleUserClick = (userId: number) => {
    navigate(`/shop/${userId}`)
    onClose()
  }

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`)
    onClose()
  }

  const handleMessageUser = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation() // Prevent navigation to profile
    openThreadWithUser(userId)
    onClose()
  }

  if (!isOpen || !query) return null

  const hasResults = users.length > 0 || products.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-150"
            style={{ opacity: 1 }}
            onClick={onClose}
          />

          {/* Results Panel */}
          <div
            className="fixed left-1/2 top-20 z-50 w-[min(600px,90vw)] -translate-x-1/2 glass-card max-h-[70vh] overflow-hidden p-4 shadow-glow-moonstone-lg transition-all duration-150"
            style={{ opacity: 1, transform: 'translateX(-50%) translateY(0)' }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-moonstone-200 pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-moonstone-600" />
                <h3 className="text-lg font-bold text-moonstone-900">
                  Search Results for "{query}"
                </h3>
              </div>
              <button
                onClick={onClose}
                className="glass-button rounded-full p-2 hover:bg-moonstone-100"
              >
                <X className="h-5 w-5 text-moonstone-500" />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-moonstone-500 border-t-transparent"></div>
                <p className="text-sm text-moonstone-500">Searching...</p>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !hasResults && (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-3 h-16 w-16 text-moonstone-300" />
                <p className="text-sm font-medium text-moonstone-700">No results found</p>
                <p className="mt-1 text-xs text-moonstone-500">
                  Try searching with different keywords
                </p>
              </div>
            )}

            {/* Results */}
            {!isLoading && hasResults && (
              <div className="max-h-[calc(70vh-100px)] space-y-4 overflow-y-auto">
                {/* Users Section */}
                {users.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-moonstone-600" />
                      <h4 className="text-sm font-semibold text-moonstone-700">
                        Users ({users.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {users.map((user) => {
                        const canMessage = currentUser && user.id !== currentUser.id && !user.is_private
                        
                        return (
                          <div
                            key={user.id}
                            className="glass-button flex w-full items-center gap-3 p-3 transition hover:shadow-glass"
                          >
                            <button
                              onClick={() => handleUserClick(user.id)}
                              className="flex flex-1 items-center gap-3 text-left"
                            >
                              <div className="glass-card flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-moonstone-400 to-moonstone-600">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={user.display_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-white">
                                    {(user.display_name || user.username)
                                      ?.slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-moonstone-900">
                                    {user.display_name || user.username}
                                  </p>
                                  {user.is_verified_seller && (
                                    <svg
                                      className="h-4 w-4 text-moonstone-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {user.is_private && (
                                    <span className="glass-button text-xs font-medium text-moonstone-600 px-2 py-0.5">
                                      Private
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-moonstone-500">
                                  @{user.username} • {user.total_sales} sold
                                </p>
                              </div>
                            </button>
                            
                            {/* Message Button */}
                            {canMessage && (
                              <button
                                onClick={(e) => handleMessageUser(e, user.id)}
                                className="glass-button-primary flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Message
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Products Section */}
                {products.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-moonstone-600" />
                      <h4 className="text-sm font-semibold text-moonstone-700">
                        Products ({products.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="glass-button flex w-full items-center gap-3 p-3 text-left transition hover:shadow-glass"
                        >
                          {/* Product Image */}
                          <div className="glass-card flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-moonstone-100">
                            {product.image_urls && product.image_urls.length > 0 ? (
                              <img
                                src={product.image_urls[0]}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-8 w-8 text-moonstone-400" />
                            )}
                          </div>
                          {/* Product Info */}
                          <div className="flex-1">
                            <p className="line-clamp-1 font-semibold text-moonstone-900">
                              {product.title}
                            </p>
                            <p className="text-sm font-bold text-emerald-600">
                              {product.currency} {product.price}
                            </p>
                            <p className="text-xs text-moonstone-500">
                              by {product.seller.display_name || product.seller.username}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default GlobalSearchResults
