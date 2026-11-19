import { AnimatePresence, motion } from "framer-motion"
import { Star, Store, UserCircle2, MessageCircle, UserPlus, UserCheck, UserX, Clock, Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import apiClient from "../../api/client"
import { useAuth } from "../../auth/AuthContext"
import { useChat } from "../../contexts/ChatContext"

interface SellerProfile {
  id: number
  username: string
  display_name: string
  avatar_url: string
  is_verified_seller: boolean
  average_rating: number
  review_count: number
  date_joined: string
  is_private: boolean
  total_sales: number
  bio: string
  location: string
}

interface FriendshipStatus {
  id: number
  status: "pending" | "accepted" | "rejected" | "blocked"
  requester_id: number
  receiver_id: number
}

interface ProductCard {
  id: number
  title: string
  price: string
  currency: string
  image_urls: string[]
  location: string
  brand: string
  is_favorite: boolean
}

interface ReviewCard {
  id: number
  reviewer: {
    id: number
    username: string
    display_name: string
    avatar_url: string
    is_verified_seller: boolean
    average_rating: number
  }
  rating: number
  comment: string
  created_at: string
}

function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [listings, setListings] = useState<ProductCard[]>([])
  const [reviews, setReviews] = useState<ReviewCard[]>([])
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null)
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings")
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()
  const { openThreadWithUser } = useChat()
  
  const isOwnProfile = user?.id === seller?.id
  const canMessage = !isOwnProfile && seller && !seller.is_private

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)

      try {
        // Use the new profile endpoint that returns user, products, and reviews
        const profileResponse = await apiClient.get(`/users/${id}/profile/`)
        
        setSeller(profileResponse.data.user)
        setListings(profileResponse.data.products || [])
        setReviews(profileResponse.data.reviews || [])
        
        // Check friendship status
        if (user && user.id !== parseInt(id)) {
          try {
            const friendshipsResponse = await apiClient.get('/friendships/')
            const friendships = Array.isArray(friendshipsResponse.data) 
              ? friendshipsResponse.data 
              : friendshipsResponse.data.results || []
            
            // Find friendship with this user
            const friendship = friendships.find((f: any) => 
              (f.requester.id === user.id && f.receiver.id === parseInt(id)) ||
              (f.receiver.id === user.id && f.requester.id === parseInt(id))
            )
            
            if (friendship) {
              setFriendshipStatus({
                id: friendship.id,
                status: friendship.status,
                requester_id: friendship.requester.id,
                receiver_id: friendship.receiver.id,
              })
            }
          } catch (error) {
            console.error('Failed to fetch friendship status:', error)
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Poll more slowly to avoid API throttling
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [id, user])

  const formatStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${index < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-moonstone-300"}`}
      />
    ))
  }

  const handleUnfriend = async () => {
    if (!friendshipStatus || !confirm('Are you sure you want to remove this friend?')) return
    
    try {
      await apiClient.delete(`/friendships/${friendshipStatus.id}/`)
      setFriendshipStatus(null)
      alert('Friend removed successfully')
    } catch (error) {
      console.error('Failed to remove friend:', error)
      alert('Failed to remove friend')
    }
  }

  const handleAddFriend = async () => {
    if (!seller) return
    
    try {
      const response = await apiClient.post('/friendships/', {
        receiver_id: seller.id
      })
      alert('Friend request sent successfully!')
      const friendship = response.data
      setFriendshipStatus({
        id: friendship.id,
        status: friendship.status,
        requester_id: friendship.requester?.id ?? user?.id ?? 0,
        receiver_id: friendship.receiver?.id ?? seller.id,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.receiver_id?.[0] 
        || error.response?.data?.detail 
        || error.response?.data?.non_field_errors?.[0]
        || 'Failed to send friend request'
      alert(errorMsg)
      console.error('Friend request error:', error.response?.data)
    }
  }

  const toggleFavorite = async (productId: number) => {
    try {
      await apiClient.post(`/products/${productId}/favorite/`)
      setListings((current) =>
        current.map((product) =>
          product.id === productId ? { ...product, is_favorite: !product.is_favorite } : product,
        ),
      )
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  if (loading || !seller) {
    return (
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-28 md:px-10">
        <div className="glass-card rounded-3xl p-10 text-center text-moonstone-500">
          <p>Loading seller shop…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-moonstone-50 to-moonstone-100 pb-24 pt-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Profile Header */}
        <div className="glass-card mb-8 overflow-hidden">
          {/* Cover/Banner */}
          <div className="h-32 bg-gradient-to-r from-moonstone-400 via-moonstone-500 to-moonstone-600"></div>
          
          {/* Profile Info */}
          <div className="relative px-8 pb-8">
            {/* Avatar - overlapping the banner */}
            <div className="absolute -top-16 left-8">
              <div className="glass-card h-32 w-32 overflow-hidden rounded-3xl border-4 border-white/80 shadow-xl">
                {seller.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller.display_name || seller.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600">
                    <UserCircle2 className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Top Right */}
            {!isOwnProfile && seller && (
              <div className="flex justify-end gap-3 pt-4">
                {canMessage && (
                  <button
                    type="button"
                    onClick={() => openThreadWithUser(seller.id)}
                    className="glass-button-primary flex items-center gap-2 px-5 py-2.5 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg active:scale-95"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Message
                  </button>
                )}
                
                {/* Friend Status Buttons */}
                {!seller.is_private && (
                  <>
                    {friendshipStatus?.status === "accepted" ? (
                      // Already Friends - Show dropdown
                      <div className="relative group">
                        <button
                          type="button"
                          className="glass-button-primary flex items-center gap-2 px-5 py-2.5 font-semibold shadow-glow-emerald hover:shadow-glow-emerald-lg"
                        >
                          <UserCheck className="h-5 w-5" />
                          Friends
                        </button>
                        {/* Dropdown on hover */}
                        <div className="absolute right-0 top-full mt-2 hidden w-48 group-hover:block">
                          <button
                            onClick={handleUnfriend}
                            className="glass-card w-full p-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <UserX className="mr-2 inline-block h-4 w-4" />
                            Unfriend
                          </button>
                        </div>
                      </div>
                    ) : friendshipStatus?.status === "pending" ? (
                      // Pending Request
                      <button
                        type="button"
                        disabled
                        className="glass-button flex items-center gap-2 bg-gray-400 px-5 py-2.5 font-semibold text-white opacity-75 cursor-not-allowed"
                      >
                        <Clock className="h-5 w-5" />
                        {friendshipStatus.requester_id === user?.id ? "Request Sent" : "Pending Request"}
                      </button>
                    ) : (
                      // Not Friends - Show Add Friend
                      <button
                        type="button"
                        onClick={handleAddFriend}
                        className="glass-button-primary flex items-center gap-2 px-5 py-2.5 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg active:scale-95"
                      >
                        <UserPlus className="h-5 w-5" />
                        Add Friend
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* User Info */}
            <div className="mt-20">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-moonstone-900">
                  {seller.display_name || seller.username}
                </h1>
                {seller.is_verified_seller && (
                  <span className="flex items-center gap-1 rounded-full glass-card bg-moonstone-100 px-3 py-1 text-sm font-medium text-moonstone-700">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              
              <p className="mt-2 text-sm text-moonstone-600">
                Member since {new Date(seller.date_joined).toLocaleDateString()}
              </p>
              
              {seller.bio && (
                <p className="mt-3 text-moonstone-700">{seller.bio}</p>
              )}
              
              {seller.location && (
                <p className="mt-2 flex items-center gap-1 text-sm text-moonstone-600">
                  <Store className="h-4 w-4" />
                  {seller.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="glass-card p-6 text-center shadow-glass">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              {formatStars(seller.average_rating)}
            </div>
            <p className="mt-2 text-3xl font-bold text-moonstone-900">
              {seller.average_rating.toFixed(1)}
            </p>
            <p className="text-sm text-moonstone-600">Average Rating</p>
          </div>
          
          <div className="glass-card p-6 text-center shadow-glass">
            <p className="text-3xl font-bold text-moonstone-900">{seller.review_count}</p>
            <p className="text-sm text-moonstone-600">Total Reviews</p>
            <p className="mt-1 text-xs text-moonstone-500">Based on completed sales</p>
          </div>
          
          <div className="glass-card p-6 text-center shadow-glass">
            <p className="text-3xl font-bold text-emerald-600">{seller.total_sales}</p>
            <p className="text-sm text-moonstone-600">Items Sold</p>
            <p className="mt-1 text-xs text-moonstone-500">Successful transactions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card mb-6 p-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("listings")}
              className={`flex-1 rounded-xl px-6 py-3 font-semibold transition ${
                activeTab === "listings"
                  ? "glass-button-primary shadow-glow-moonstone"
                  : "glass-button text-moonstone-700"
              }`}
            >
              Active Listings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 rounded-xl px-6 py-3 font-semibold transition ${
                activeTab === "reviews"
                  ? "glass-button-primary shadow-glow-moonstone"
                  : "glass-button text-moonstone-700"
              }`}
            >
              Reviews ({seller.review_count})
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "listings" ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {listings.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((product) => (
                    <div key={product.id} className="glass-card group overflow-hidden transition hover:shadow-xl">
                      <div className="relative h-64 overflow-hidden bg-moonstone-200">
                        {product.image_urls?.length ? (
                          <img 
                            src={product.image_urls[0]} 
                            alt={product.title} 
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-moonstone-400">
                            <Store className="h-16 w-16" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-moonstone-900">{product.title}</h3>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                          ₱{product.price}
                        </p>
                        {product.location && (
                          <p className="mt-2 text-sm text-moonstone-600">{product.location}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleFavorite(product.id)}
                            className={`glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                              product.is_favorite ? "text-rose-600" : "text-moonstone-600 hover:text-rose-600"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${product.is_favorite ? "fill-current" : ""}`} />
                            {product.is_favorite ? "Reacted" : "React"}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="glass-button px-4 py-2 text-sm font-medium text-moonstone-600 hover:text-moonstone-700"
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Store className="mx-auto h-16 w-16 text-moonstone-300" />
                  <p className="mt-4 text-lg font-semibold text-moonstone-600">
                    No active listings
                  </p>
                  <p className="mt-2 text-sm text-moonstone-500">
                    This seller has no products available right now.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Note about review system */}
              <div className="glass-card rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Reviews can only be left by buyers who have completed a purchase from this seller.
                </p>
              </div>

              {reviews.length ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="glass-card p-6 shadow-glass">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="glass-card h-12 w-12 overflow-hidden rounded-full">
                            {review.reviewer.avatar_url ? (
                              <img
                                src={review.reviewer.avatar_url}
                                alt={review.reviewer.display_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-sm font-bold text-white">
                                {(review.reviewer.display_name || review.reviewer.username)
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-moonstone-900">
                              {review.reviewer.display_name || review.reviewer.username}
                            </p>
                            <p className="text-xs text-moonstone-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              className={`h-5 w-5 ${
                                index < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-moonstone-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-4 text-moonstone-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Star className="mx-auto h-16 w-16 text-moonstone-300" />
                  <p className="mt-4 text-lg font-semibold text-moonstone-600">
                    No reviews yet
                  </p>
                  <p className="mt-2 text-sm text-moonstone-500">
                    This seller hasn't received any reviews from buyers.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default UserProfilePage
