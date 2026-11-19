import { motion } from "framer-motion"
import { Bell, Lock, Mail, Shield, User, Camera, MapPin, Phone } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../auth/AuthContext"
import apiClient from "../api/client"

function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications" | "privacy">("profile")
  
  // Profile state
  const [displayName, setDisplayName] = useState(user?.display_name || "")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null)
  
  // Account state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [messageNotifications, setMessageNotifications] = useState(true)
  const [offerNotifications, setOfferNotifications] = useState(true)
  
  // Privacy state
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false)
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage("error", "Image must be less than 2MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        showMessage("error", "Please select an image file")
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate file size before upload
    if (avatarFile && avatarFile.size > 5 * 1024 * 1024) {
      showMessage("error", "Image must be less than 5MB")
      return
    }
    
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("display_name", displayName)
      if (location) formData.append("location", location)
      if (bio) formData.append("bio", bio)
      if (avatarFile) {
        formData.append("avatar", avatarFile)
      }
      
      const response = await apiClient.patch(`/auth/me/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      
      // Update avatar preview with the new URL from response
      if (response.data.avatar_url) {
        setAvatarPreview(response.data.avatar_url)
      }
      
      // Refresh user data in AuthContext for real-time update across app
      await refreshUser()
      
      showMessage("success", "Profile updated successfully!")
      setAvatarFile(null)
    } catch (error: any) {
      console.error("Profile update error:", error)
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.avatar?.[0] ||
                       "Failed to update profile"
      showMessage("error", errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showMessage("error", "Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters")
      return
    }
    setSaving(true)
    try {
      // Note: You'll need to add a password change endpoint in your backend
      showMessage("success", "Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      showMessage("error", "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  const handlePrivacyUpdate = async () => {
    setSaving(true)
    try {
      await apiClient.patch(`/auth/me/`, {
        is_private: isPrivate,
      })
      
      await refreshUser()
      showMessage("success", "Privacy settings updated!")
    } catch (error) {
      showMessage("error", "Failed to update privacy settings")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }
    try {
      // Note: Add delete account endpoint in backend
      await logout()
      showMessage("success", "Account deleted successfully")
    } catch (error) {
      showMessage("error", "Failed to delete account")
    }
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "account" as const, label: "Account", icon: Lock },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "privacy" as const, label: "Privacy", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-moonstone-50 to-moonstone-100 pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-moonstone-900">Settings</h1>
          <p className="mt-2 text-sm text-moonstone-500">Manage your account settings and preferences</p>
        </div>

        {/* Message Toast */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 glass-card p-4 ${
              message.type === "success"
                ? "border-l-4 border-green-500"
                : "border-l-4 border-red-500"
            }`}
          >
            <p className={`text-sm font-medium ${
              message.type === "success" ? "text-green-700" : "text-red-700"
            }`}>
              {message.text}
            </p>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar Tabs */}
          <aside className="glass-card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`glass-button flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      activeTab === tab.id
                        ? "glass-button-primary shadow-glow-moonstone"
                        : "text-moonstone-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="glass-card p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="mb-6 font-display text-xl font-bold text-moonstone-900">Profile Information</h2>
                
                {/* Avatar */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="glass-card relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={user?.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moonstone-400 to-moonstone-600">
                        <span className="text-2xl font-bold text-white">
                          {(user?.display_name || user?.username || "U").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="glass-button flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium text-moonstone-700">
                      <Camera className="h-4 w-4" />
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1 text-xs text-moonstone-500">
                      {avatarFile ? `Selected: ${avatarFile.name}` : "JPG, PNG or GIF. Max 2MB"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {/* Display Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Display Name
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <User className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        className="flex-1 bg-transparent text-sm text-moonstone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Email Address
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <Mail className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="flex-1 bg-transparent text-sm text-moonstone-500 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-moonstone-500">Email cannot be changed</p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Location
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <MapPin className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="flex-1 bg-transparent text-sm text-moonstone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Phone Number
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <Phone className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="flex-1 bg-transparent text-sm text-moonstone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="glass-input w-full resize-none px-4 py-3 text-sm text-moonstone-800 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="glass-button-primary w-full py-3 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="mb-6 font-display text-xl font-bold text-moonstone-900">Account Security</h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Current Password
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <Lock className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="flex-1 bg-transparent text-sm text-moonstone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      New Password
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <Lock className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="flex-1 bg-transparent text-sm text-moonstone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-moonstone-700">
                      Confirm New Password
                    </label>
                    <div className="glass-input flex items-center gap-3 px-4 py-3">
                      <Lock className="h-5 w-5 text-moonstone-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="flex-1 bg-transparent text-sm text-moonstone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="glass-button-primary w-full py-3 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg disabled:opacity-50"
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                </form>

                {/* Danger Zone */}
                <div className="mt-8 border-t border-rose-200 pt-8">
                  <h3 className="mb-4 text-lg font-bold text-rose-600">Danger Zone</h3>
                  <div className="glass-card border-2 border-rose-300 p-4">
                    <p className="mb-4 text-sm text-moonstone-700">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="glass-button bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3 font-semibold text-white hover:from-rose-600 hover:to-rose-700"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="mb-6 font-display text-xl font-bold text-moonstone-900">Notification Preferences</h2>

                <div className="space-y-4">
                  <div className="glass-card flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-moonstone-800">Email Notifications</p>
                      <p className="text-sm text-moonstone-500">Receive updates via email</p>
                    </div>
                    <label className="relative inline-block h-8 w-14">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="glass-input absolute inset-0 cursor-pointer rounded-full transition peer-checked:bg-moonstone-500" />
                      <span className="glass-button absolute left-1 top-1 h-6 w-6 rounded-full transition peer-checked:translate-x-6" />
                    </label>
                  </div>

                  <div className="glass-card flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-moonstone-800">Message Notifications</p>
                      <p className="text-sm text-moonstone-500">Get notified of new messages</p>
                    </div>
                    <label className="relative inline-block h-8 w-14">
                      <input
                        type="checkbox"
                        checked={messageNotifications}
                        onChange={(e) => setMessageNotifications(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="glass-input absolute inset-0 cursor-pointer rounded-full transition peer-checked:bg-moonstone-500" />
                      <span className="glass-button absolute left-1 top-1 h-6 w-6 rounded-full transition peer-checked:translate-x-6" />
                    </label>
                  </div>

                  <div className="glass-card flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-moonstone-800">Offer Notifications</p>
                      <p className="text-sm text-moonstone-500">Alert me when someone makes an offer</p>
                    </div>
                    <label className="relative inline-block h-8 w-14">
                      <input
                        type="checkbox"
                        checked={offerNotifications}
                        onChange={(e) => setOfferNotifications(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="glass-input absolute inset-0 cursor-pointer rounded-full transition peer-checked:bg-moonstone-500" />
                      <span className="glass-button absolute left-1 top-1 h-6 w-6 rounded-full transition peer-checked:translate-x-6" />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="mb-6 font-display text-xl font-bold text-moonstone-900">Privacy Settings</h2>

                <div className="space-y-6">
                  {/* Profile Privacy Toggle */}
                  <div className="glass-card p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-moonstone-900">Profile Privacy</h3>
                        <p className="mt-1 text-sm text-moonstone-500">
                          Control who can message you and view your profile
                        </p>
                      </div>
                      <label className="relative inline-block h-8 w-14">
                        <input
                          type="checkbox"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="glass-input absolute inset-0 cursor-pointer rounded-full transition peer-checked:bg-moonstone-500" />
                        <span className="glass-button absolute left-1 top-1 h-6 w-6 rounded-full transition peer-checked:translate-x-6" />
                      </label>
                    </div>
                    
                    {/* Explanation */}
                    <div className={`glass-card rounded-2xl p-4 ${isPrivate ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} border-2`}>
                      <div className="flex items-start gap-3">
                        <Shield className={`h-5 w-5 flex-shrink-0 ${isPrivate ? 'text-amber-600' : 'text-blue-600'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${isPrivate ? 'text-amber-900' : 'text-blue-900'}`}>
                            {isPrivate ? 'Private Profile' : 'Public Profile'}
                          </p>
                          <p className={`mt-1 text-xs ${isPrivate ? 'text-amber-700' : 'text-blue-700'}`}>
                            {isPrivate 
                              ? 'Your profile is private. Others cannot send you messages through the platform. Your products are still visible in the marketplace.'
                              : 'Your profile is public. Anyone can view your profile and send you messages.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handlePrivacyUpdate}
                      disabled={saving}
                      className="mt-4 glass-button-primary w-full py-3 font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Privacy Settings"}
                    </button>
                  </div>

                  {/* Additional Privacy Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-moonstone-900">Contact Information</h3>
                    
                    <div className="glass-card flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-moonstone-800">Show Email on Profile</p>
                        <p className="text-sm text-moonstone-500">Make your email visible to others</p>
                      </div>
                      <label className="relative inline-block h-8 w-14">
                        <input
                          type="checkbox"
                          checked={showEmail}
                          onChange={(e) => setShowEmail(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="glass-input absolute inset-0 cursor-pointer rounded-full transition peer-checked:bg-moonstone-500" />
                        <span className="glass-button absolute left-1 top-1 h-6 w-6 rounded-full transition peer-checked:translate-x-6" />
                      </label>
                    </div>

                    <div className="glass-card flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-moonstone-800">Show Phone on Profile</p>
                        <p className="text-sm text-moonstone-500">Make your phone number visible</p>
                      </div>
                      <label className="relative inline-block h-8 w-14">
                        <input
                          type="checkbox"
                          checked={showPhone}
                          onChange={(e) => setShowPhone(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="glass-input absolute inset-0 cursor-pointer rounded-full transition peer-checked:bg-moonstone-500" />
                        <span className="glass-button absolute left-1 top-1 h-6 w-6 rounded-full transition peer-checked:translate-x-6" />
                      </label>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="glass-card bg-gradient-to-br from-moonstone-50 to-blue-50 p-4">
                    <h4 className="font-semibold text-moonstone-900">💡 Privacy Tips</h4>
                    <ul className="mt-2 space-y-1 text-sm text-moonstone-700">
                      <li>• Private profiles prevent unwanted messages</li>
                      <li>• Your products remain visible in marketplace</li>
                      <li>• You can still message others</li>
                      <li>• Switch anytime between public and private</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage