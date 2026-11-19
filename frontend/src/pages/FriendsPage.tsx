import { UserCheck, UserX, Users, Clock, Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import apiClient from "../api/client"
import { useAuth } from "../auth/AuthContext"

interface FriendshipData {
  id: number
  requester: {
    id: number
    username: string
    display_name: string
    avatar_url: string
    is_verified_seller: boolean
  }
  receiver: {
    id: number
    username: string
    display_name: string
    avatar_url: string
    is_verified_seller: boolean
  }
  status: "pending" | "accepted" | "rejected" | "blocked"
  created_at: string
}

function FriendsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState<FriendshipData[]>([])
  const [acceptedFriends, setAcceptedFriends] = useState<FriendshipData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("requests")

  useEffect(() => {
    fetchFriendships()
    // Auto-refresh every 30 seconds to avoid rate limiting
    const interval = setInterval(fetchFriendships, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchFriendships = async () => {
    try {
      // Get all friendships
      const response = await apiClient.get<FriendshipData[] | { results: FriendshipData[] }>("/friendships/")
      const allFriendships = Array.isArray(response.data) ? response.data : response.data.results || []
      
      // Filter pending requests (received by me)
      const pending = allFriendships.filter(
        (f: FriendshipData) => f.status === "pending" && f.receiver.id === user?.id
      )
      setPendingRequests(pending)
      
      // Filter accepted friends
      const accepted = allFriendships.filter((f: FriendshipData) => f.status === "accepted")
      setAcceptedFriends(accepted)
    } catch (error) {
      console.error("Failed to fetch friendships:", error)
    } finally {
      setLoading(false)
    }
  }

  const acceptRequest = async (friendshipId: number) => {
    try {
      await apiClient.post(`/friendships/${friendshipId}/accept/`)
      fetchFriendships()
    } catch (error) {
      console.error("Failed to accept request:", error)
    }
  }

  const rejectRequest = async (friendshipId: number) => {
    try {
      await apiClient.post(`/friendships/${friendshipId}/reject/`)
      fetchFriendships()
    } catch (error) {
      console.error("Failed to reject request:", error)
    }
  }

  const removeFriend = async (friendshipId: number) => {
    if (!confirm("Are you sure you want to remove this friend?")) return
    
    try {
      await apiClient.delete(`/friendships/${friendshipId}/`)
      fetchFriendships()
    } catch (error) {
      console.error("Failed to remove friend:", error)
    }
  }

  const timeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-moonstone-50 to-moonstone-100 pb-24 pt-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="glass-card p-12 text-center">
            <p className="text-moonstone-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-moonstone-50 to-moonstone-100 pb-24 pt-28">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-moonstone-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-moonstone-400 to-moonstone-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            Friends
          </h1>
          <p className="mt-2 text-moonstone-600">Manage your friend requests and connections</p>
        </div>

        {/* Tabs */}
        <div className="glass-card mb-6 p-3">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
                activeTab === "requests"
                  ? "glass-button-primary shadow-glow-moonstone"
                  : "glass-button text-moonstone-700"
              }`}
            >
              <Clock className="h-5 w-5" />
              Requests ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
                activeTab === "friends"
                  ? "glass-button-primary shadow-glow-moonstone"
                  : "glass-button text-moonstone-700"
              }`}
            >
              <UserCheck className="h-5 w-5" />
              Friends ({acceptedFriends.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "requests" ? (
            <div
              key="requests"
              className="space-y-4"
            >
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <article
                    key={request.id}
                    className="glass-card overflow-hidden transition hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4 p-6">
                      {/* Avatar */}
                      <div
                        className="glass-card h-16 w-16 cursor-pointer overflow-hidden rounded-2xl"
                        onClick={() => navigate(`/shop/${request.requester.id}`)}
                      >
                        {request.requester.avatar_url ? (
                          <img
                            src={request.requester.avatar_url}
                            alt={request.requester.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-xl font-bold text-white">
                            {(request.requester.display_name || request.requester.username)
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className="cursor-pointer text-lg font-bold text-moonstone-900 hover:text-moonstone-600"
                            onClick={() => navigate(`/shop/${request.requester.id}`)}
                          >
                            {request.requester.display_name || request.requester.username}
                          </h3>
                          {request.requester.is_verified_seller && (
                            <svg className="h-5 w-5 text-moonstone-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-moonstone-600">Sent {timeAgo(request.created_at)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => acceptRequest(request.id)}
                          className="glass-button-primary flex items-center gap-2 px-5 py-2.5 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg active:scale-95"
                        >
                          <Check className="h-5 w-5" />
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="glass-button bg-gradient-to-r from-rose-500 to-rose-600 flex items-center gap-2 px-5 py-2.5 font-semibold text-white shadow-glow-rose hover:shadow-glow-rose-lg active:scale-95"
                        >
                          <X className="h-5 w-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="glass-card p-12 text-center">
                  <Clock className="mx-auto h-16 w-16 text-moonstone-300" />
                  <p className="mt-4 text-lg font-semibold text-moonstone-600">No pending requests</p>
                  <p className="mt-2 text-sm text-moonstone-500">
                    You don't have any friend requests at the moment.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              key="friends"
              className="grid gap-4 sm:grid-cols-2"
            >
              {acceptedFriends.length > 0 ? (
                acceptedFriends.map((friendship) => {
                  const friend =
                    friendship.requester.id === user?.id
                      ? friendship.receiver
                      : friendship.requester

                  return (
                    <article
                      key={friendship.id}
                      className="glass-card overflow-hidden transition hover:shadow-xl"
                    >
                      <div className="flex items-center gap-4 p-6">
                        {/* Avatar */}
                        <div
                          className="glass-card h-16 w-16 cursor-pointer overflow-hidden rounded-2xl"
                          onClick={() => navigate(`/shop/${friend.id}`)}
                        >
                          {friend.avatar_url ? (
                            <img
                              src={friend.avatar_url}
                              alt={friend.display_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600 text-xl font-bold text-white">
                              {(friend.display_name || friend.username).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className="cursor-pointer font-bold text-moonstone-900 hover:text-moonstone-600"
                              onClick={() => navigate(`/shop/${friend.id}`)}
                            >
                              {friend.display_name || friend.username}
                            </h3>
                            {friend.is_verified_seller && (
                              <svg className="h-4 w-4 text-moonstone-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-moonstone-600">Friends since {timeAgo(friendship.created_at)}</p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFriend(friendship.id)}
                          className="glass-button p-2 text-rose-600 hover:bg-rose-50"
                          title="Remove friend"
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="glass-card col-span-2 p-12 text-center">
                  <UserCheck className="mx-auto h-16 w-16 text-moonstone-300" />
                  <p className="mt-4 text-lg font-semibold text-moonstone-600">No friends yet</p>
                  <p className="mt-2 text-sm text-moonstone-500">
                    Start adding friends to build your network!
                  </p>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  )
}

export default FriendsPage

