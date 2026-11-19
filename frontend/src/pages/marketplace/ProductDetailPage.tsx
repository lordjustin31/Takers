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
  const [isPrivate, setIsPrivate] = useState(false)
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
        is_private: isPrivate,
      })
      setComments([response.data, ...comments])
      setCommentText("")
      setIsPrivate(false)
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
        <div className="mt-2 flex flex-wrap gap-2 px-1 text-xs text-moonstone-400">
          <button type="button" onClick={() => handleReact(comment.id)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-emerald-400">
            React {comment.reaction_count ? `(${comment.reaction_count})` : ""}
          </button>
          <button type="button" onClick={() => handleReply(comment.id)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-blue-400">
            Reply {comment.reply_count ? `(${comment.reply_count})` : ""}
          </button>
          {canManageComment(comment) && (
            <button type="button" onClick={() => handleDeleteComment(comment.id)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-rose-400">
              Delete
            </button>
          )}
          {user && user.id === comment.user.id && (
            <button type="button" onClick={() => handleTogglePrivacy(comment)} className="glass-button rounded-full px-3 py-1 text-xs hover:text-amber-400">
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
                className="glass-button rounded-lg px-3 py-2 text-xs uppercase tracking-[0.18em] text-moonstone-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReplySubmit(comment.id)}
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
        <div className="glass-card p-8">
          <p className="text-sm text-moonstone-500">Loading listing...</p>
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
          className="overflow-hidden rounded-2xl glass-card p-4 shadow-glass"
        >
          <div className="relative h-[420px] overflow-hidden rounded-xl bg-moonstone-100">
            {product.image_urls?.length ? (
              <img
                src={product.image_urls[activeImage]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs uppercase tracking-[0.24em] text-moonstone-400">
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
                    ? "border-moonstone-500"
                    : "border-moonstone-200"
                }`}
              >
                <img src={url} alt="Thumbnail" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 shadow-glass">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-moonstone-800/60 border border-moonstone-700/50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-moonstone-300">
              Live
            </span>
            {product.seller.is_verified_seller && (
              <span className="flex items-center gap-2 rounded-lg bg-blue-950/60 border border-blue-800/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-300">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-moonstone-100">
            {product.title}
          </h1>
          <p className="mt-2 text-sm text-moonstone-200">{product.description}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold text-emerald-400">
              {product.currency} {product.price}
            </span>
            <span className="flex items-center gap-2 rounded-lg glass-input px-3 py-1 text-xs text-moonstone-300">
              <Tag className="h-3 w-3" />
              {product.location}
            </span>
          </div>
        </div>

        <div className="glass-card p-6 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-moonstone-400">
            Seller
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="glass-card h-12 w-12 overflow-hidden rounded-full">
              {product.seller.avatar_url ? (
                <img
                  src={product.seller.avatar_url}
                  alt={product.seller.display_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-xs font-bold text-white">
                  {product.seller.display_name?.slice(0, 2) ||
                    product.seller.username.slice(0, 2)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-moonstone-100">
                {product.seller.display_name || product.seller.username}
              </p>
              <p className="text-xs text-moonstone-400">{product.brand}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/shop/${product.seller.id}`)}
              className="glass-button flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-moonstone-200"
            >
              View Seller Shop
            </button>
            <button
              type="button"
              onClick={() => (isOwner ? null : handleMessage())}
              disabled={isOwner}
              className="glass-button-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              Chat with Seller
            </button>
            <button
              type="button"
              onClick={() => (isOwner ? null : setShowOffer(true))}
              disabled={isOwner}
              className="glass-button-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              Make an Offer
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                product.is_favorite
                  ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                  : "glass-button hover:border-rose-500/50 hover:bg-rose-500/10 text-moonstone-200"
              }`}
            >
              <Heart className={`h-4 w-4 ${product.is_favorite ? "fill-current" : ""}`} />
              {product.is_favorite ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="glass-button flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold text-moonstone-200 transition-all hover:border-green-500/50 hover:bg-green-500/10 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="glass-card p-6 shadow-glass">
          <h3 className="text-xs uppercase tracking-[0.24em] text-moonstone-400 mb-4">
            Comments ({comments.length})
          </h3>

          {/* Comment Input */}
          {user ? (
            <div className="flex gap-3 mb-6">
              <div className="glass-card h-10 w-10 overflow-hidden rounded-full flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-xs font-bold text-white">
                    {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-2">
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
                    placeholder={isPrivate ? "Write a private comment to seller..." : "Write a public comment..."}
                    className={`flex-1 glass-input px-4 py-2 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none ${
                      isPrivate ? "border-amber-400/50 placeholder:text-amber-300" : ""
                    }`}
                  />
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                    className="glass-button-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-moonstone-400">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-moonstone-200 transition">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-moonstone-400/40 text-moonstone-500 focus:ring-moonstone-500/50"
                    />
                    <span>Private comment (visible to seller only)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 glass-card p-4 text-center">
              <p className="text-sm text-moonstone-400">
                <button
                  onClick={() => navigate("/?auth=1")}
                  className="text-moonstone-300 hover:text-moonstone-100 underline"
                >
                  Login
                </button>{" "} to comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingComments ? (
              <div className="text-center py-4 text-sm text-moonstone-400">Loading comments...</div>
            ) : comments.length > 0 ? (
              comments.map((comment) => renderComment(comment))
            ) : (
              <div className="text-center py-8 text-sm text-moonstone-400">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-moonstone-900/60"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-[min(420px,92vw)] glass-card p-5 shadow-glow-moonstone-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-moonstone-900">Make an offer</p>
                <button
                  type="button"
                  onClick={() => setShowOffer(false)}
                  className="glass-button text-xs uppercase tracking-[0.2em] text-moonstone-500"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={offerPrice}
                  onChange={(event) => setOfferPrice(event.target.value)}
                  placeholder="Offer price"
                  className="w-full glass-input px-4 py-3 text-sm text-moonstone-800"
                />
                <button
                  type="button"
                  onClick={handleOffer}
                  className="glass-button-primary w-full py-2 text-sm disabled:opacity-50"
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
