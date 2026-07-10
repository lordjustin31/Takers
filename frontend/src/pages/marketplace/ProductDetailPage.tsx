import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, ShieldCheck, Tag, Heart, Share2, Send } from "lucide-react"
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
}

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

interface ProductDetail {
  id: number
  title: string
  description: string
  price: string
  currency: string
  location: string
  brand: string
  image_urls: string[]
  seller: SellerProfile
  is_favorite: boolean
}

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openThreadWithUser } = useChat()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [showOffer, setShowOffer] = useState(false)
  const [offerPrice, setOfferPrice] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [replyDrafts, setReplyDrafts] = useState<{ [key: number]: string }>({})
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      const response = await apiClient.get<ProductDetail>(`/products/${id}/`)
      setProduct(response.data)
    }

    if (id) {
      fetchProduct()
      fetchComments()
      
      // Poll every 60 seconds to avoid rate limiting
      const interval = setInterval(() => {
        fetchProduct()
        fetchComments()
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [id])

  const fetchComments = async () => {
    if (!id) return
    try {
      setLoadingComments(true)
      const response = await apiClient.get<Comment[] | { results: Comment[] }>(`/comments/?product=${id}`)
      // Handle both array and paginated response formats
      const commentsData = Array.isArray(response.data) ? response.data : response.data.results || []
      setComments(commentsData)
    } catch (error) {
      console.error("Failed to fetch comments:", error)
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const refreshComments = async () => {
    await fetchComments()
  }

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !id) return

    try {
      const response = await apiClient.post<Comment>("/comments/", {
        product: parseInt(id),
        body: commentText,
      })
      setComments([response.data, ...comments])
      setCommentText("")
    } catch (error) {
      console.error("Failed to post comment:", error)
    }
  }

  const handleReply = async (commentId: number) => {
    if (!user) {
      navigate("/?auth=1")
      return
    }
    setReplyingCommentId(commentId)
  }

  const handleReplySubmit = async (commentId: number) => {
    const replyBody = replyDrafts[commentId]?.trim()
    if (!replyBody) return

    try {
      const response = await apiClient.post<Comment>(`/comments/${commentId}/reply/`, { body: replyBody })
      const reply = response.data
      setComments((prev) => prev.map((comment) => appendReplyToComment(comment, commentId, reply)))
      setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }))
      setReplyingCommentId(null)
      await refreshComments()
    } catch (error) {
      console.error("Failed to post reply:", error)
    }
  }

  const handleReact = async (commentId: number) => {
    if (!user) {
      navigate("/?auth=1")
      return
    }

    try {
      await apiClient.post(`/comments/${commentId}/react/`, { reaction_type: "like" })
      await refreshComments()
    } catch (error) {
      console.error("Failed to react to comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Delete this comment?")) return

    try {
      await apiClient.delete(`/comments/${commentId}/`)
      await refreshComments()
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  const handleTogglePrivacy = async (comment: Comment) => {
    try {
      await apiClient.post(`/comments/${comment.id}/toggle_privacy/`, {
        is_private: !comment.is_private,
      })
      await refreshComments()
    } catch (error) {
      console.error("Failed to update comment privacy:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!product || !user) {
      navigate("/?auth=1")
      return
    }
    try {
      await apiClient.post(`/products/${product.id}/favorite/`)
      setProduct({ ...product, is_favorite: !product.is_favorite })
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  const handleShare = () => {
    if (!product) return
    const url = `${window.location.origin}/products/${product.id}`
    navigator.clipboard.writeText(url)
    // Could add a toast notification here
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

  const isOwner = Boolean(product && user?.id === product.seller.id)
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

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`flex gap-3 ${depth > 0 ? "ml-3 sm:ml-6" : ""}`}>
      <div
        className="h-8 w-8 overflow-hidden rounded-full bg-white/10 flex-shrink-0 cursor-pointer"
        onClick={() => navigate(`/shop/${comment.user.id}`)}
      >
        {comment.user.avatar_url ? (
          <img
            src={comment.user.avatar_url}
            alt={comment.user.display_name || comment.user.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-slate-200">
            {(comment.user.display_name || comment.user.username).slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-sm text-white truncate">
              {comment.user.display_name || comment.user.username}
            </p>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 flex-shrink-0">
              {comment.is_private && <span>Private</span>}
              <span>{timeAgo(comment.created_at)}</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-1 break-words whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 px-1 text-xs text-slate-400">
          <button type="button" onClick={() => handleReact(comment.id)} className="rounded-full border border-white/10 px-3 py-1 hover:border-emerald-300/50 hover:text-emerald-200">
            React {comment.reaction_count ? `(${comment.reaction_count})` : ""}
          </button>
          <button type="button" onClick={() => handleReply(comment.id)} className="rounded-full border border-white/10 px-3 py-1 hover:border-sky-300/50 hover:text-sky-200">
            Reply {comment.reply_count ? `(${comment.reply_count})` : ""}
          </button>
          {canManageComment(comment) && (
            <button type="button" onClick={() => handleDeleteComment(comment.id)} className="rounded-full border border-white/10 px-3 py-1 hover:border-rose-300/50 hover:text-rose-200">
              Delete
            </button>
          )}
          {user && user.id === comment.user.id && (
            <button type="button" onClick={() => handleTogglePrivacy(comment)} className="rounded-full border border-white/10 px-3 py-1 hover:border-amber-300/50 hover:text-amber-200">
              {comment.is_private ? "Make Public" : "Make Private"}
            </button>
          )}
        </div>
        {replyingCommentId === comment.id && user && (
          <div className="mt-3 rounded-lg border border-white/10 bg-night-900/60 p-3">
            <textarea
              value={replyDrafts[comment.id] || ""}
              onChange={(event) =>
                setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))
              }
              placeholder="Write a reply..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-night-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingCommentId(null)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReplySubmit(comment.id)}
                disabled={!replyDrafts[comment.id]?.trim()}
                className="rounded-lg bg-sky-500 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        )}
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  )

  const handleOffer = async () => {
    if (!user) {
      navigate("/?auth=1")
      return
    }
    if (!product || !offerPrice) return
    await apiClient.post("/offers/", {
      product: product.id,
      proposed_price: offerPrice,
    })
    setShowOffer(false)
    setOfferPrice("")
  }

  const handleMessage = () => {
    if (!user) {
      navigate("/?auth=1")
      return
    }
    if (!product) return
    
    // Open FloatingChat with this seller and product
    openThreadWithUser(product.seller.id, product.id)
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-28 md:px-10">
        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-8">
          <p className="text-sm text-slate-200">Loading listing...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-28 md:grid-cols-[1.1fr_0.9fr] md:px-10">
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-night-800/80 p-4 shadow-glass"
        >
          <div className="relative h-[420px] overflow-hidden rounded-xl bg-night-700">
            {product.image_urls?.length ? (
              <img
                src={product.image_urls[activeImage]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs uppercase tracking-[0.24em] text-slate-300">
                Takers
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {product.image_urls?.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`h-16 w-20 overflow-hidden rounded-lg border ${
                  activeImage === index
                    ? "border-emerald-300/70"
                    : "border-white/10"
                }`}
              >
                <img src={url} alt="Thumbnail" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-6 shadow-glass">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100">
              Live
            </span>
            {product.seller.is_verified_seller && (
              <span className="flex items-center gap-2 rounded-lg border border-sky-300/40 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-100">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-white">
            {product.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">{product.description}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold text-emerald-200">
              ₱{product.price}
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <Tag className="h-3 w-3" />
              {product.location}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-6 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Seller
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10">
              {product.seller.avatar_url ? (
                <img
                  src={product.seller.avatar_url}
                  alt={product.seller.display_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-slate-200">
                  {product.seller.display_name?.slice(0, 2) ||
                    product.seller.username.slice(0, 2)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {product.seller.display_name || product.seller.username}
              </p>
              <p className="text-xs text-slate-300">{product.brand}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/shop/${product.seller.id}`)}
              className="group flex items-center gap-2 rounded-xl border-2 border-white/20 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-100 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-slate-800/70 active:scale-95"
            >
              View Seller Shop
            </button>
            <button
              type="button"
              onClick={() => (isOwner ? null : handleMessage())}
              disabled={isOwner}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-600 hover:to-blue-700 hover:shadow-xl hover:shadow-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              Chat with Seller
            </button>
            <button
              type="button"
              onClick={() => (isOwner ? null : setShowOffer(true))}
              disabled={isOwner}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-green-700 hover:shadow-xl hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              Make an Offer
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`group flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                product.is_favorite
                  ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                  : "border-white/20 bg-slate-800/50 text-slate-100 hover:border-rose-500/50 hover:bg-rose-500/10"
              }`}
            >
              <Heart className={`h-4 w-4 ${product.is_favorite ? "fill-current" : ""}`} />
              {product.is_favorite ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="group flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-all hover:border-green-500/50 hover:bg-green-500/10 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-6 shadow-glass">
          <h3 className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-4">
            Comments ({comments.length})
          </h3>

          {/* Comment Input */}
          {user ? (
            <div className="flex gap-3 mb-6">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10 flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-slate-200">
                    {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleCommentSubmit()
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg border border-white/10 bg-night-900/70 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:from-sky-600 hover:to-blue-700 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5 text-center">
              <p className="text-sm text-slate-300">
                <button
                  onClick={() => navigate("/?auth=1")}
                  className="text-sky-400 hover:text-sky-300 underline"
                >
                  Login
                </button>{" "}
                to comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingComments ? (
              <div className="text-center py-4 text-sm text-slate-400">Loading comments...</div>
            ) : comments.length > 0 ? (
              comments.map((comment) => renderComment(comment))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-[min(420px,92vw)] rounded-2xl border border-white/10 bg-night-800/95 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Make an offer</p>
                <button
                  type="button"
                  onClick={() => setShowOffer(false)}
                  className="text-xs uppercase tracking-[0.2em] text-slate-400"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={offerPrice}
                  onChange={(event) => setOfferPrice(event.target.value)}
                  placeholder="Offer price"
                  className="w-full rounded-lg border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleOffer}
                  className="w-full rounded-lg bg-emerald-300/20 px-4 py-2 text-sm text-emerald-100"
                >
                  Send offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default ProductDetailPage
