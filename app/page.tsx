import Storefront from '@/components/storefront'

export const dynamic = 'force-dynamic'

const PRODUCTS_QUERY = `#graphql
  query Products {
    products(first: 24) {
      nodes {
        id
        title
        productType
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 100) {
          nodes {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

export default async function Page() {
  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN ?? process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '',
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY }),
      next: { revalidate: 60 },
    },
  )

  const payload = await response.json()
  if (!response.ok || payload.errors) {
    throw new Error('Unable to load Shopify products.')
  }

  const products = payload.data.products.nodes.filter(
    (product: { variants: { nodes: { availableForSale: boolean }[] } }) =>
      product.variants.nodes.some((variant) => variant.availableForSale),
  )

  return <Storefront products={products} />
}
