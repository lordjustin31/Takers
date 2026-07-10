import { motion } from "framer-motion"

const filters = [
  "For You",
  "Trending",
  "Verified Sellers",
  "Nearby",
  "New Drops",
]

const products = [
  {
    title: "Aether Pro Backpack",
    price: "$180",
    location: "Berlin, DE",
    tag: "Featured",
  },
  {
    title: "Sony XM6 Headphones",
    price: "$340",
    location: "Los Angeles, CA",
    tag: "Verified",
  },
  {
    title: "Lumen Smart Desk",
    price: "$420",
    location: "Toronto, CA",
    tag: "Hot",
  },
  {
    title: "Roadster 2024",
    price: "$22,900",
    location: "Seoul, KR",
    tag: "New",
  },
  {
    title: "Studio Vibes Sneaker",
    price: "$260",
    location: "Paris, FR",
    tag: "Rare",
  },
  {
    title: "Navi 4K Drone",
    price: "$780",
    location: "Austin, TX",
    tag: "Trending",
  },
]

function MarketplaceGrid() {
  return (
    <section className="mx-auto mt-16 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Discover
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            Marketplace picks curated for you
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${
                index === 0
                  ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/40"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product, index) => (
          <motion.article
            key={product.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.05 }}
            className="glass group overflow-hidden rounded-3xl border border-white/10 p-4 shadow-glass"
          >
            <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/20 via-emerald-400/20 to-orange-400/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),_transparent_60%)]" />
              <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-100">
                {product.tag}
              </span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {product.title}
                </h3>
                <p className="text-sm text-slate-300">{product.location}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">
                  {product.price}
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  Live
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded-full bg-emerald-300/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-100"
              >
                Offer
              </button>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.3em] text-slate-400 transition group-hover:text-slate-200"
              >
                View details
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

export default MarketplaceGrid
