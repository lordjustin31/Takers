import { AnimatePresence, motion } from "framer-motion"
import { Paperclip, Send } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import apiClient from "../../api/client"
import { useAuth } from "../../auth/AuthContext"

interface UserSummary {
  id: number
  username: string
  display_name: string
  avatar_url: string
}

interface ProductSummary {
  id: number
  title: string
  price: string
  currency: string
}

interface MessageItem {
  id: number
  thread_id: string
  sender: UserSummary
  recipient: number
  recipient_detail: UserSummary
  product: number | null
  product_detail: ProductSummary | null
  message_type: "general" | "marketplace"
  body: string
  is_read: boolean
  created_at: string
}

interface ThreadSummary {
  threadId: string
  messages: MessageItem[]
  participant: UserSummary
  product: ProductSummary | null
  messageType: "general" | "marketplace"
  unreadCount: number
  lastMessage: MessageItem
}

function ChatHubPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [showOffer, setShowOffer] = useState(false)
  const [offerPrice, setOfferPrice] = useState("")
  const [showDispute, setShowDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")

  const fetchMessages = useCallback(async () => {
    try {
      const response = await apiClient.get<{ results: MessageItem[] }>(
        "/messages/?ordering=-created_at",
      )
      setMessages(response.data?.results || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      setMessages([])
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    // Poll every 30 seconds to avoid rate limiting
    const intervalId = window.setInterval(fetchMessages, 30000)
    return () => window.clearInterval(intervalId)
  }, [fetchMessages])

  const threads = useMemo<ThreadSummary[]>(() => {
    const map = new Map<string, MessageItem[]>()
    ;(messages || []).forEach((message) => {
      const list = map.get(message.thread_id) || []
      list.push(message)
      map.set(message.thread_id, list)
    })

    return Array.from(map.entries()).map(([threadId, threadMessages]) => {
      const sorted = [...threadMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      const lastMessage = sorted[sorted.length - 1]
      const participant =
        lastMessage.sender.id === user?.id ? lastMessage.recipient_detail : lastMessage.sender
      const unreadCount = sorted.filter(
        (message) => !message.is_read && message.recipient === user?.id,
      ).length
      const messageType = lastMessage.message_type || "general"
      return {
        threadId,
        messages: sorted,
        participant,
        product: lastMessage.product_detail,
        messageType,
        unreadCount,
        lastMessage,
      }
    })
  }, [messages, user])

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].threadId)
    }
  }, [activeThreadId, threads])

  const activeThread = threads.find((thread) => thread.threadId === activeThreadId)

  useEffect(() => {
    if (!activeThread || !user) return
    const unreadMessages = activeThread.messages.filter(
      (message) => !message.is_read && message.recipient === user.id,
    )
    unreadMessages.forEach((message) => {
      apiClient.post(`/messages/${message.id}/mark_read/`)
    })
  }, [activeThread, user])

  const handleSend = async () => {
    if (!activeThread || !messageText.trim()) return
    const recipientId = activeThread.participant.id
    const productId = activeThread.product?.id || null
    const response = await apiClient.post<MessageItem>("/messages/", {
      recipient: recipientId,
      product: productId,
      body: messageText,
    })
    setMessages((prev) => [response.data, ...prev])
    setMessageText("")
  }

  const handleOffer = async () => {
    if (!activeThread?.product) return
    await apiClient.post("/offers/", {
      product: activeThread.product.id,
      proposed_price: offerPrice,
    })
    setOfferPrice("")
    setShowOffer(false)
  }

  const handleDispute = async () => {
    if (!activeThread) return
    await apiClient.post("/disputes/", {
      target_user: activeThread.participant.id,
      target_product: activeThread.product?.id || null,
      reason: disputeReason,
    })
    setDisputeReason("")
    setShowDispute(false)
  }

  return (
    <section className="mx-auto flex max-w-6xl gap-6 px-6 pb-20 pt-28 md:px-10">
      <aside className="glass hidden w-80 flex-col gap-4 rounded-3xl border border-white/10 p-5 shadow-glass md:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Messages
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">
            Conversations
          </h2>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {threads.map((thread) => (
            <button
              key={thread.threadId}
              type="button"
              onClick={() => setActiveThreadId(thread.threadId)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                activeThreadId === thread.threadId
                  ? "border-emerald-300/40 bg-emerald-300/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10">
                {thread.participant.avatar_url ? (
                  <img
                    src={thread.participant.avatar_url}
                    alt={thread.participant.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-slate-200">
                    {(thread.participant.display_name || thread.participant.username || "U")
                      ?.slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {thread.participant.display_name || thread.participant.username}
                  </p>
                  {thread.messageType === "marketplace" && (
                    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                      Marketplace
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {thread.lastMessage.body}
                </p>
              </div>
              {thread.unreadCount > 0 && (
                <motion.span
                  key={thread.unreadCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-xs font-semibold text-white"
                >
                  {thread.unreadCount}
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1">
        <div className="glass flex items-center justify-between rounded-3xl border border-white/10 px-6 py-4 shadow-glass">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">
                {activeThread?.participant.display_name || activeThread?.participant.username || "Unknown User"}
              </p>
              {activeThread?.messageType === "marketplace" && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                  Marketplace
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              {activeThread?.product ? activeThread.product.title : "Direct chat"}
            </p>
          </div>
          <div className="flex gap-2">
            {activeThread?.product && (
              <button
                type="button"
                onClick={() => setShowOffer(true)}
                className="rounded-full bg-emerald-300/20 px-3 py-2 text-xs text-emerald-100"
              >
                Make offer
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDispute(true)}
              className="rounded-full bg-amber-300/20 px-3 py-2 text-xs text-amber-100"
            >
              Dispute
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <AnimatePresence>
            {activeThread?.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-glass ${
                  message.sender.id === user?.id
                    ? "ml-auto bg-emerald-300/20 text-emerald-50"
                    : "bg-white/10 text-slate-100"
                }`}
              >
                {message.body}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="glass mt-6 flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 shadow-glass">
          <button type="button" className="text-slate-300">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Write a message"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 rounded-full bg-emerald-300/20 px-4 py-2 text-xs text-emerald-100"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
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
              className="glass w-[min(420px,92vw)] rounded-3xl border border-white/10 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Send offer</p>
                <button
                  type="button"
                  onClick={() => setShowOffer(false)}
                  className="text-xs uppercase tracking-[0.3em] text-slate-400"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={offerPrice}
                  onChange={(event) => setOfferPrice(event.target.value)}
                  placeholder="Proposed price"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleOffer}
                  className="w-full rounded-full bg-emerald-300/20 px-4 py-2 text-sm text-emerald-100"
                >
                  Submit offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDispute && (
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
              className="glass w-[min(420px,92vw)] rounded-3xl border border-white/10 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Open dispute</p>
                <button
                  type="button"
                  onClick={() => setShowDispute(false)}
                  className="text-xs uppercase tracking-[0.3em] text-slate-400"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <textarea
                  value={disputeReason}
                  onChange={(event) => setDisputeReason(event.target.value)}
                  placeholder="Describe the issue"
                  className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleDispute}
                  className="w-full rounded-full bg-amber-300/20 px-4 py-2 text-sm text-amber-100"
                >
                  Submit dispute
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default ChatHubPage
