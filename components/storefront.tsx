'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, ShoppingBag } from 'lucide-react'

type Variant = {
  id: string
  title: string
  availableForSale: boolean
  selectedOptions: { name: string; value: string }[]
  price: { amount: string; currencyCode: string }
}

type Product = {
  id: string
  title: string
  productType: string
  featuredImage: { url: string; altText: string | null } | null
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
  variants: { nodes: Variant[] }
}

function cartUrl(variantId: string) {
  const numericVariantId = variantId.split('/').pop()
  if (!numericVariantId) throw new Error('A Shopify variant ID is required.')
  return `https://jvnni.com/cart/${numericVariantId}:1`
}

function buyNow(event: React.MouseEvent<HTMLAnchorElement>, variantId: string) {
  event.preventDefault()
  window.location.assign(cartUrl(variantId))
}

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount))
}

function sizeOptions(product: Product) {
  const variants = product.variants.nodes.filter((variant) => variant.availableForSale)
  const optionName = variants[0]?.selectedOptions.find((option) => /size/i.test(option.name))?.name
  return variants.filter((variant) => !optionName || variant.selectedOptions.some((option) => option.name === optionName))
}

function ProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  const variants = sizeOptions(product)
  const [selectedVariant, setSelectedVariant] = useState(variants[0])

  if (!selectedVariant) return null

  const size = selectedVariant.selectedOptions.find((option) => /size/i.test(option.name))?.value ?? selectedVariant.title

  return (
    <article className="product-card">
      <button className="product-image-button" onClick={onSelect} aria-label={`View ${product.title}`}>
        {product.featuredImage && <img src={product.featuredImage.url} alt={product.featuredImage.altText ?? product.title} />}
        <span className="product-index">{String(variants.indexOf(selectedVariant) + 1).padStart(2, '0')}</span>
        <span className="image-arrow"><ArrowUpRight size={18} /></span>
      </button>
      <div className="product-meta">
        <div><p className="eyebrow">{product.productType || 'Collection'}</p><h3>{product.title}</h3></div>
        <p className="price">{formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}</p>
      </div>
      <div className="size-row" aria-label={`Select size for ${product.title}`}>
        <span className="size-label">Size</span>
        {variants.map((variant) => <button key={variant.id} className={selectedVariant.id === variant.id ? 'size active' : 'size'} onClick={() => setSelectedVariant(variant)} aria-pressed={selectedVariant.id === variant.id}>{variant.selectedOptions.find((option) => /size/i.test(option.name))?.value ?? variant.title}</button>)}
      </div>
      <a className="buy-link" href={cartUrl(selectedVariant.id)} onClick={(event) => buyNow(event, selectedVariant.id)}>Buy Now <ArrowUpRight size={16} /></a>
    </article>
  )
}

export default function Storefront({ products }: { products: Product[] }) {
  const firstProduct = products[0]
  const firstVariants = firstProduct ? sizeOptions(firstProduct) : []
  const [selectedProduct, setSelectedProduct] = useState(firstProduct)
  const [selectedVariant, setSelectedVariant] = useState(firstVariants[0])
  const selectedCartUrl = useMemo(() => selectedVariant ? cartUrl(selectedVariant.id) : '#collection', [selectedVariant])

  function selectProduct(product: Product) {
    const variants = sizeOptions(product)
    setSelectedProduct(product)
    setSelectedVariant(variants[0])
  }

  if (!selectedProduct || !selectedVariant) return null
  const selectedSize = selectedVariant.selectedOptions.find((option) => /size/i.test(option.name))?.value ?? selectedVariant.title

  return (
    <main>
      <nav className="nav shell"><a className="wordmark" href="#top">JVNNI<span>.</span></a><div className="nav-links"><a href="#collection">Collection</a><a href="#about">About</a></div><a className="bag-link" href="#collection"><ShoppingBag size={17} /> Bag <span>0</span></a></nav>
      <section className="hero shell" id="top"><p className="eyebrow">New York / 2026</p><h1>Less, but<br /><em>better.</em></h1><div className="hero-footer"><p>Considered clothing for the<br />everyday rotation.</p><a href="#collection">Explore collection <ArrowUpRight size={17} /></a></div></section>
      <section className="detail shell" id="about"><div className="detail-copy"><p className="eyebrow">01 — The edit</p><h2>Built around<br /><em>your rhythm.</em></h2><p className="detail-description">Quiet forms, precise cuts, and materials that get better with time. Each piece is designed to move through your week without asking for attention.</p></div><div className="detail-buy"><p className="detail-name">{selectedProduct.title}</p><p className="detail-price">{formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}</p><div className="detail-size-label">Select size</div><div className="detail-sizes">{sizeOptions(selectedProduct).map((variant) => <button key={variant.id} className={selectedVariant.id === variant.id ? 'size active' : 'size'} onClick={() => setSelectedVariant(variant)} aria-pressed={selectedVariant.id === variant.id}>{variant.selectedOptions.find((option) => /size/i.test(option.name))?.value ?? variant.title}</button>)}</div><a className="primary-button" href={selectedCartUrl} onClick={(event) => buyNow(event, selectedVariant.id)}>Buy Now <ArrowUpRight size={17} /></a><span className="sr-only">Selected size: {selectedSize}</span></div></section>
      <section className="collection shell" id="collection"><div className="section-heading"><p className="eyebrow">02 — Collection</p><p className="section-note">Three forms. One point of view.</p></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onSelect={() => selectProduct(product)} />)}</div></section>
      <footer className="footer shell"><a className="wordmark" href="#top">JVNNI<span>.</span></a><p>Made for repeat wear.</p><p>© 2026 Jvnni Studio</p></footer>
    </main>
  )
}
