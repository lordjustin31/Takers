import { AnimatePresence, motion } from "framer-motion"
import { ImagePlus, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import apiClient from "../../api/client"

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  title: string
  description: string
  price: string
  currency: string
  location: string
  category: number
}

interface SellItemModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  productToEdit?: Product | null
}

interface UploadPreview {
  id: string
  preview: string
  file: File
}

const steps = ["Core", "Logistics", "Media"]

function sanitizeInput(value: string) {
  return value.replace(/<[^>]*>/g, "").trim()
}

function SellItemModal({ isOpen, onClose, onCreated, productToEdit }: SellItemModalProps) {
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<number | "">("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [uploads, setUploads] = useState<UploadPreview[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await apiClient.get<{ results: Category[] } | Category[]>(
        "/categories/",
      )
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results
      setCategories(data)
    }

    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setTitle(productToEdit.title)
        setCategoryId(productToEdit.category || "")
        setDescription(productToEdit.description)
        setPrice(productToEdit.price)
        setLocation(productToEdit.location || "")
      } else {
        setTitle("")
        setCategoryId("")
        setDescription("")
        setPrice("")
        setLocation("")
      }
      setUploads([])
      setStep(0)
      setError("")
    }
  }, [isOpen, productToEdit])

  const descriptionCount = useMemo(() => description.length, [description])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setUploads((prev) => [
          ...prev,
          { id: `${file.name}-${file.size}-${Date.now()}`, preview: result, file },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id))
  }

  const validateStep = (current: number) => {
    if (current === 0) {
      if (!title.trim()) return "Title is required"
      if (!categoryId) return "Category is required"
      if (descriptionCount < 20) return "Description must be at least 20 characters"
    }
    if (current === 1) {
      const priceValue = Number(price)
      if (!price || Number.isNaN(priceValue) || priceValue <= 0) {
        return "Enter a valid price"
      }
      if (!sanitizeInput(location)) {
        return "Location is required"
      }
    }
    return ""
  }

  const handleNext = () => {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    setStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleSubmit = async () => {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    const formData = new FormData()
    formData.append("title", sanitizeInput(title))
    formData.append("category", String(categoryId))
    formData.append("description", sanitizeInput(description))
    formData.append("price", Number(price).toString())
    formData.append("currency", "PHP")
    formData.append("location", sanitizeInput(location))

    uploads.forEach((item) => {
      formData.append("images", item.file)
    })

    if (productToEdit) {
      await apiClient.patch(`/products/${productToEdit.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    } else {
      await apiClient.post("/products/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    }
    onCreated()
    setStep(0)
    setTitle("")
    setCategoryId("")
    setDescription("")
    setPrice("")
    setLocation("")
    setUploads([])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="w-[min(620px,92vw)] rounded-2xl glass-card p-6 shadow-glass-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">
                Sell item
              </p>
              <button
                type="button"
                onClick={onClose}
                className="glass-button rounded-lg px-4 py-2 text-xs uppercase tracking-[0.2em] text-moonstone-500"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs uppercase tracking-[0.2em] ${
                    index === step
                      ? "border-moonstone-400/60 bg-moonstone-600/80 text-moonstone-100 font-semibold"
                      : "border-moonstone-700/50 bg-moonstone-900/40 text-moonstone-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-6 min-h-[260px]">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Listing title"
                    className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                  />
                  <select
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value ? Number(event.target.value) : "")
                    }
                    className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40 bg-moonstone-900/90"
                  >
                    <option value="" className="bg-moonstone-900 text-moonstone-100">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="bg-moonstone-900 text-moonstone-100">
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={500}
                      placeholder="Describe your item (supports markdown)"
                      className="glass-input min-h-[140px] w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                    />
                    <p className="mt-2 text-xs text-moonstone-400">
                      {descriptionCount} / 500 characters
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Price"
                    className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                  />
                  <input
                    value={location}
                    onChange={(event) => setLocation(sanitizeInput(event.target.value))}
                    placeholder="Location"
                    className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <label className="glass-card flex flex-col items-center justify-center rounded-xl border border-dashed border-moonstone-700/50 bg-moonstone-900/40 px-6 py-8 text-sm text-moonstone-300 cursor-pointer hover:bg-moonstone-900/60 transition">
                    <ImagePlus className="h-6 w-6" />
                    <span className="mt-2">Drag & drop or browse</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleFiles(event.target.files)}
                    />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {uploads.map((item) => (
                      <div
                        key={item.id}
                        className="relative overflow-hidden rounded-lg glass-card"
                      >
                        <img src={item.preview} alt="Upload" className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeUpload(item.id)}
                          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md glass-button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {error && (
              <div className="mt-3 glass-card border-l-4 border-rose-500 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                className="text-xs uppercase tracking-[0.2em] text-moonstone-400"
              >
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="glass-button-primary rounded-lg px-4 py-2 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="glass-button-primary rounded-lg px-4 py-2 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
                >
                  Submit listing
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SellItemModal
