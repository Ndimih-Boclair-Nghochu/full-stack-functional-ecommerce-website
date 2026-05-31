import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatXAF, getProductImage, resolveAssetUrl } from '../utils/format'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProductCard({ product, addToCart, toggleWishlist, isInWishlist }) {
  const { t, translateProduct } = useLanguage()
  const displayProduct = translateProduct(product)
  const stock = Number(product.stock || 0)
  const outOfStock = stock <= 0
  const mainImage = getProductImage(product)
  const wished = isInWishlist?.(product.id)

  const subImages = (product.images || []).filter((img) => img?.url)
  const [activeImage, setActiveImage] = useState(mainImage)

  const handleThumbClick = (event, url) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveImage(resolveAssetUrl(url) || url)
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <img
            src={activeImage}
            alt={displayProduct.displayName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            decoding="async"
            loading="lazy"
            onError={(event) => {
              const fallback = getProductImage({})
              if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-950/55 to-transparent" />
          {outOfStock && (
            <div className="absolute inset-x-0 top-0 bg-red-600 py-2 text-center text-xs font-bold text-white">
              {t('outOfStock')}
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {product.isNew && <span className="rounded-full bg-amber-700 px-2 py-1 text-[11px] font-bold text-gray-950">{t('new')}</span>}
            {product.mostOrdered && <span className="rounded-full bg-stone-900 px-2 py-1 text-[11px] font-bold text-white">{t('popular')}</span>}
          </div>
        </div>

        {subImages.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto px-3 pt-2 pb-0 scrollbar-none">
            {subImages.map((img, index) => {
              const resolved = resolveAssetUrl(img.url) || img.url
              const isActive = activeImage === resolved
              return (
                <button
                  key={`${img.url}-${index}`}
                  type="button"
                  onClick={(event) => handleThumbClick(event, img.url)}
                  className={`h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border-2 transition duration-200 ${
                    isActive ? 'border-amber-700 opacity-100' : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-stone-400'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={resolved}
                    alt={`${displayProduct.displayName} view ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              )
            })}
          </div>
        )}

        <div className="space-y-2 p-3 sm:p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 line-clamp-1">
            {displayProduct.displayCategory || t('product')}
          </p>
          <h2 className="min-h-[2.5rem] text-sm font-black leading-tight text-gray-950 line-clamp-2 sm:text-base">
            {displayProduct.displayName}
          </h2>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <span className="text-base font-black text-stone-900 sm:text-lg">{formatXAF(product.price)}</span>
            <span className={`text-[11px] font-bold ${outOfStock ? 'text-red-700' : 'text-green-700'}`}>
              {outOfStock ? t('unavailable') : t('left', { count: stock })}
            </span>
          </div>
          {!outOfStock && (
            <div className="h-1.5 rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-stone-900" style={{ width: `${Math.min(stock, 100)}%` }} />
            </div>
          )}
        </div>
      </Link>

      <div className="mt-auto grid grid-cols-[1fr_42px] gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => addToCart(product)}
          className="rounded-xl bg-stone-900 px-2 py-2 text-xs font-black text-white transition hover:bg-stone-950 disabled:bg-gray-300 disabled:text-gray-500 sm:text-sm"
        >
          {t('addToCart')}
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className={`rounded-xl border text-lg font-black transition ${wished ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          aria-label={wished ? t('removeWishlist') : t('addWishlist')}
        >
          &hearts;
        </button>
      </div>
    </article>
  )
}
