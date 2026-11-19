import { AnimatePresence, motion } from "framer-motion"
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Clock,
  Flame,
  Users,
  Send,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import apiClient from "../api/client"
import { useAuth } from "../auth/AuthContext"
import SellItemModal from "../components/marketplace/SellItemModal"
import HomePageSidebar from "../components/layout/HomePageSidebar"

interface Comment {
  id: number
  user: {
    id: number
    username: string
    display_name: string
    avatar_url: string
  }
  body: string
  is_private: boolean
  created_at: string
  reply_count: number
  reaction_count: number
  user_reaction: string | null
  replies: Comment[]
}

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
  comments_count?: number
  favorites_count?: number
}

function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [feed, setFeed] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "friends" | "trending" | "new">("friends")
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({})
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})
  const [commentText, setCommentText] = useState<{ [key: number]: string }>({})
  const [replyDrafts, setReplyDrafts] = useState<{ [key: number]: string }>({})
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null)
  const [loadingComments, setLoadingComments] = useState<{ [key: number]: boolean }>({})
  const [shareMenu, setShareMenu] = useState<number | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [activePostMenu, setActivePostMenu] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const handleOutsideClick = () => {
      setActivePostMenu(null)
    }
    window.addEventListener("click", handleOutsideClick)
    return () => window.removeEventListener("click", handleOutsideClick)
  }, [])

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true)
      try {
        let endpoint = '/products/?moderation_status=approved&is_active=true'
        
        if (activeFilter === "friends") {
          // Fetch products from friends only
          endpoint = '/products/friends_feed/'
        } else {
          const ordering = activeFilter === "new" ? "-created_at" : "-view_count"
          endpoint += `&ordering=${ordering}&page_size=20`
        }
        
        const response = await apiClient.get<{ results: Product[] }>(endpoint)
        setFeed(response.data.results || [])
      } catch (error) {
        console.error("Failed to fetch feed:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
    
    // Auto-refresh every 30 seconds to avoid rate limiting
    const interval = setInterval(fetchFeed, 30000)
    return () => clearInterval(interval)
  }, [activeFilter, refreshTrigger])

  const handleEditPost = (item: Product) => {
    setProductToEdit(item)
    setIsEditModalOpen(true)
  }

  const handleDeletePost = async (productId: number) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return
    try {
      await apiClient.delete(`/products/${productId}/`)
      setFeed((prev) => prev.filter((item) => item.id !== productId))
    } catch (error) {
      console.error("Failed to delete post:", error)
      alert("Failed to delete post. Please try again.")
    }
  }

  const toggleFavorite = async (productId: number) => {
    try {
      await apiClient.post(`/products/${productId}/favorite/`)
      setFeed((prev) =>
        prev.map((item) =>
          item.id === productId
            ? {
                ...item,
                is_favorite: !item.is_favorite,
                favorites_count: item.is_favorite
                  ? Math.max(0, (item.favorites_count || 1) - 1)
                  : (item.favorites_count || 0) + 1,
              }
            : item
        )
      )
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
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

  const fetchComments = async (productId: number) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [productId]: true }))
      const response = await apiClient.get<Comment[] | { results: Comment[] }>(`/comments/?product=${productId}`)
      const commentsData = Array.isArray(response.data) ? response.data : response.data.results || []
      setComments((prev) => ({ ...prev, [productId]: commentsData }))
    } catch (error) {
      console.error("Failed to fetch comments:", error)
      setComments((prev) => ({ ...prev, [productId]: [] }))
    } finally {
      setLoadingComments((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const refreshComments = async (productId: number) => {
    await fetchComments(productId)
  }

  const toggleComments = async (productId: number) => {
    const isShowing = showComments[productId]
    setShowComments((prev) => ({ ...prev, [productId]: !isShowing }))
    
    if (!isShowing && !comments[productId]) {
      await fetchComments(productId)
    }
  }

  const handleCommentSubmit = async (productId: number) => {
    const text = commentText[productId]?.trim()
    if (!text) return

    try {
      const response = await apiClient.post<Comment>("/comments/", {
        product: productId,
        body: text,
      })
      
      setComments((prev) => {
        const existingComments = prev[productId] || []
        return {
          ...prev,
          [productId]: [response.data, ...existingComments],
        }
      })
      setCommentText((prev) => ({ ...prev, [productId]: "" }))
    } catch (error) {
      console.error("Failed to post comment:", error)
    }
  }

  const handleReply = async (_productId: number, commentId: number) => {
    if (!user) {
      navigate("/?auth=1")
      return
    }

    setReplyingCommentId(commentId)
  }

  const handleReplySubmit = async (productId: number, commentId: number) => {
    const replyBody = replyDrafts[commentId]?.trim()
    if (!replyBody) return

    try {
      const response = await apiClient.post<Comment>(`/comments/${commentId}/reply/`, { body: replyBody })
      const reply = response.data
      setComments((prev) => {
        const existingComments = prev[productId] || []
        return {
          ...prev,
          [productId]: existingComments.map((comment) => appendReplyToComment(comment, commentId, reply)),
        }
      })
      setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }))
      setReplyingCommentId(null)
      await refreshComments(productId)
    } catch (error) {
      console.error("Failed to post reply:", error)
    }
  }

  const handleReact = async (productId: number, commentId: number) => {
    if (!user) {
      navigate("/?auth=1")
      return
    }

    try {
      await apiClient.post(`/comments/${commentId}/react/`, { reaction_type: "like" })
      await refreshComments(productId)
    } catch (error) {
      console.error("Failed to react to comment:", error)
    }
  }

  const handleDeleteComment = async (productId: number, commentId: number) => {
    if (!window.confirm("Delete this comment?")) return

    try {
      await apiClient.delete(`/comments/${commentId}/`)
      await refreshComments(productId)
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  const handleTogglePrivacy = async (productId: number, comment: Comment) => {
    try {
      await apiClient.post(`/comments/${comment.id}/toggle_privacy/`, {
        is_private: !comment.is_private,
      })
      await refreshComments(productId)
    } catch (error) {
      console.error("Failed to update comment privacy:", error)
    }
  }

  const handleMessage = (product: Product) => {
    if (!user) {
      navigate("/auth")
      return
    }
    navigate("/messages", { state: { product, recipient: product.seller } })
  }

  const handleShare = (productId: number) => {
    setShareMenu(shareMenu === productId ? null : productId)
  }

  const canManageComment = (comment: Comment) => Boolean(user && (user.id === comment.user.id || user.is_staff))

  const appendReplyToComment = (comment: Comment, parentId: number, reply: Comment): Comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        reply_count: (comment.reply_count || 0) + 1,
        replies: [...(comment.replies || []), reply],
      }
    }

    return {
      ...comment,
      replies: (comment.replies || []).map((child) => appendReplyToComment(child, parentId, reply)),
    }
  }

  const renderComment = (productId: number, comment: Comment, depth = 0) => (
    <div key={comment.id} className={`flex gap-3 ${depth > 0 ? "ml-3 sm:ml-6" : ""}`}>
      <div
        className="glass-card h-8 w-8 overflow-hidden rounded-full flex-shrink-0 cursor-pointer"
        onClick={() => navigate(`/shop/${comment.user.id}`)}
      >
        {comment.user.avatar_url ? (
          <img
            src={comment.user.avatar_url}
            alt={comment.user.display_name || comment.user.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-xs font-bold text-white">
            {(comment.user.display_name || comment.user.username).slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="glass-card p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-sm text-moonstone-100 truncate">
              {comment.user.display_name || comment.user.username}
            </p>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-moonstone-400 flex-shrink-0">
              {comment.is_private && <span>Private</span>}
              <span>{timeAgo(comment.created_at)}</span>
            </div>
          </div>
          <p className="text-sm text-moonstone-200 mt-1 break-words whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 px-2 text-xs text-moonstone-400">
          <button type="button" onClick={() => handleReact(productId, comment.id)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-emerald-400">
            React {comment.reaction_count ? `(${comment.reaction_count})` : ""}
          </button>
          <button type="button" onClick={() => handleReply(productId, comment.id)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-blue-400">
            Reply {comment.reply_count ? `(${comment.reply_count})` : ""}
          </button>
          {canManageComment(comment) && (
            <button type="button" onClick={() => handleDeleteComment(productId, comment.id)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-rose-400">
              Delete
            </button>
          )}
          {user && user.id === comment.user.id && (
            <button type="button" onClick={() => handleTogglePrivacy(productId, comment)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-amber-400">
              {comment.is_private ? "Make Public" : "Make Private"}
            </button>
          )}
        </div>
        {replyingCommentId === comment.id && user && (
          <div className="mt-3 glass-card p-3">
            <textarea
              value={replyDrafts[comment.id] || ""}
              onChange={(event) =>
                setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))
              }
              placeholder="Write a reply..."
              rows={3}
              className="w-full glass-input px-3 py-2 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingCommentId(null)}
                className="glass-button rounded-lg px-3 py-2 text-xs uppercase tracking-[0.18em] text-moonstone-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReplySubmit(productId, comment.id)}
                disabled={!replyDrafts[comment.id]?.trim()}
                className="glass-button-primary rounded-lg px-3 py-2 text-xs uppercase tracking-[0.18em] disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        )}
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(productId, reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  )

  const copyLink = (productId: number) => {
    const url = `${window.location.origin}/products/${productId}`
    navigator.clipboard.writeText(url)
    setShareMenu(null)
    // You could add a toast notification here
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-moonstone-50 to-moonstone-100 pb-20 pt-16">
      {/* Beautiful Collapsible Sidebar */}
      <HomePageSidebar />

      {/* Main Feed - With responsive margin for sidebar */}
      <main className="transition-all duration-300 lg:ml-[280px]">
        <div className="mx-auto max-w-[680px] px-4 pt-8 lg:px-6">
            {/* Filter Bar */}
            <div className="glass-card mb-6 flex items-center gap-3 p-3">
              <button
                onClick={() => setActiveFilter("friends")}
                className={`glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "friends"
                    ? "glass-button-primary shadow-glow-moonstone"
                    : "text-moonstone-200"
                }`}
              >
                <Users className="h-4 w-4" />
                Friends
              </button>
              <button
                onClick={() => setActiveFilter("all")}
                className={`glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "all"
                    ? "glass-button-primary shadow-glow-moonstone"
                    : "text-moonstone-200"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                All Items
              </button>
              <button
                onClick={() => setActiveFilter("trending")}
                className={`glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "trending"
                    ? "glass-button-primary shadow-glow-moonstone"
                    : "text-moonstone-200"
                }`}
              >
                <Flame className="h-4 w-4" />
                Trending
              </button>
              <button
                onClick={() => setActiveFilter("new")}
                className={`glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "new"
                    ? "glass-button-primary shadow-glow-moonstone"
                    : "text-moonstone-200"
                }`}
              >
                <Clock className="h-4 w-4" />
                New Arrivals
              </button>
            </div>

            {/* Feed Posts */}
            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-96 animate-pulse p-6" />
                ))
              ) : (
                <AnimatePresence>
                  {feed.map((item, index) => (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="glass-card h-12 w-12 cursor-pointer overflow-hidden rounded-full"
                            onClick={() => navigate(`/shop/${item.seller.id}`)}
                          >
                            {item.seller.avatar_url ? (
                              <img
                                src={item.seller.avatar_url}
                                alt={`${item.seller.display_name || item.seller.username}'s profile picture`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-sm font-bold text-white">
                                {(item.seller.display_name || item.seller.username)
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="flex items-center gap-2 font-semibold text-moonstone-100">
                              {item.seller.display_name || item.seller.username}
                              {item.seller.is_verified_seller && (
                                <svg
                                  className="h-4 w-4 text-moonstone-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-moonstone-400">
                              <Clock className="h-3 w-3" />
                              {timeAgo(item.created_at)}
                              <span>•</span>
                              <MapPin className="h-3 w-3" />
                              {item.location || "Remote"}
                            </div>
                          </div>
                        </div>
                        {user && (user.id === item.seller.id || user.is_staff) ? (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePostMenu(activePostMenu === item.id ? null : item.id);
                              }}
                              className="glass-button p-2 text-moonstone-300 hover:text-moonstone-100"
                            >
                              <svg
                                className="h-5 w-5 fill-current"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {activePostMenu === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 rounded-xl glass-card p-1 z-30 shadow-glass">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPost(item);
                                    setActivePostMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-moonstone-200 hover:bg-white/10 rounded-lg flex items-center gap-2"
                                >
                                  Edit Post
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(item.id);
                                    setActivePostMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-9 h-9" />
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="px-4 pb-3">
                        <h2 className="text-lg font-bold text-moonstone-100">{item.title}</h2>
                        <p className="mt-1 text-2xl font-bold text-emerald-400">
                          {item.currency} {item.price}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-moonstone-200">
                          {item.description}
                        </p>
                      </div>

                      {/* Post Image */}
                      {item.image_urls?.length > 0 && (
                        <div
                          className="relative cursor-pointer overflow-hidden bg-moonstone-900/60"
                          style={{ aspectRatio: "16 / 10" }}
                          onClick={() => navigate(`/products/${item.id}`)}
                        >
                          <img
                            src={item.image_urls[0]}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                          {item.image_urls.length > 1 && (
                            <div className="absolute bottom-4 right-4 glass-button flex items-center gap-1 px-3 py-1 text-sm font-medium text-moonstone-100">
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
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
                      )}

                      {/* Post Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-moonstone-200/20 p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className={`glass-button flex items-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium transition ${
                              item.is_favorite
                                ? "text-rose-400"
                                : "text-moonstone-200 hover:text-rose-400"
                            }`}
                          >
                            <Heart
                              className={`h-5 w-5 ${item.is_favorite ? "fill-current" : ""}`}
                            />
                            <span className="hidden sm:inline">{item.is_favorite ? "Saved" : "Save"}</span>
                          </button>
                          <button 
                            onClick={() => toggleComments(item.id)}
                            className="glass-button flex items-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-moonstone-200 hover:text-blue-400"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span className="hidden sm:inline">Comment</span>
                          </button>
                          <div className="relative">
                            <button 
                              onClick={() => handleShare(item.id)}
                              className="glass-button flex items-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-moonstone-200 hover:text-green-400"
                            >
                              <Share2 className="h-5 w-5" />
                              <span className="hidden sm:inline">Share</span>
                            </button>
                            {shareMenu === item.id && (
                              <div className="absolute left-0 top-full mt-2 w-48 glass-card p-2 z-30 shadow-glass">
                                <button
                                  onClick={() => copyLink(item.id)}
                                  className="w-full text-left px-3 py-2 text-sm text-moonstone-200 hover:bg-white/10 rounded-lg"
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={() => {
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/products/${item.id}`, '_blank')
                                    setShareMenu(null)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-moonstone-200 hover:bg-white/10 rounded-lg"
                                >
                                  Share to Facebook
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 sm:flex-initial items-center justify-end gap-2">
                          <button
                            onClick={() => handleMessage(item)}
                            className="glass-button-primary flex-1 sm:flex-initial px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg whitespace-nowrap"
                          >
                            Message Seller
                          </button>
                          <button
                            onClick={() => navigate(`/products/${item.id}`)}
                            className="glass-button-primary flex-1 sm:flex-initial px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {showComments[item.id] && (
                        <div className="border-t border-moonstone-200/20 p-4 bg-moonstone-950/40">
                          {/* Comment Input */}
                          {user && (
                            <div className="flex gap-3 mb-4">
                              <div className="glass-card h-10 w-10 overflow-hidden rounded-full flex-shrink-0">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={`Your profile picture`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-xs font-bold text-white">
                                    {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={commentText[item.id] || ""}
                                  onChange={(e) =>
                                    setCommentText((prev) => ({ ...prev, [item.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      handleCommentSubmit(item.id)
                                    }
                                  }}
                                  placeholder="Write a comment..."
                                  className="flex-1 glass-input px-4 py-2 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleCommentSubmit(item.id)}
                                  disabled={!commentText[item.id]?.trim()}
                                  className="glass-button-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Comments List */}
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loadingComments[item.id] ? (
                              <div className="text-center py-4 text-sm text-moonstone-400">Loading comments...</div>
                            ) : comments[item.id]?.length > 0 ? (
                              comments[item.id].map((comment) => renderComment(item.id, comment))
                            ) : (
                              <div className="text-center py-4 text-sm text-moonstone-400">
                                No comments yet. Be the first to comment!
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="border-t border-moonstone-200/20 px-4 py-3 text-xs text-moonstone-400">
                        <div className="flex items-center gap-4">
                          <span>{item.view_count} views</span>
                          <span>•</span>
                          <span>{item.favorites_count || 0} saves</span>
                          <span>•</span>
                          <span>
                            {comments[item.id] !== undefined 
                              ? comments[item.id].length 
                              : (item.comments_count || 0)} comments
                          </span>
                          <span>•</span>
                          <span>Posted {timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              )}

              {!loading && feed.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <ShoppingBag className="mx-auto h-16 w-16 text-moonstone-300" />
                  <p className="mt-4 text-lg font-semibold text-moonstone-600">
                    {activeFilter === "friends" 
                      ? "No posts from friends yet" 
                      : "No items in the feed yet"}
                  </p>
                  <p className="mt-2 text-sm text-moonstone-500">
                    {activeFilter === "friends"
                      ? "Add friends and wait for them to post products!"
                      : "Start selling to see your posts here!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <SellItemModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setProductToEdit(null)
          }}
          onCreated={() => {
            setIsEditModalOpen(false)
            setProductToEdit(null)
            setRefreshTrigger((prev) => prev + 1)
          }}
          productToEdit={productToEdit}
        />
      </div>
    )
  }

export default HomePage
