const categoryNames = { men: 'Men', women: 'Women', 'limited-editions': 'Limited', automatic: 'Automatic', chronographs: 'Chronograph' }

export function mapApiProduct(product) {
  const slug = product.category?.slug || product.category
  return {
    ...product,
    id: product.slug || product.id || product._id,
    backendId: product.id || product._id,
    category: categoryNames[slug] || slug,
    reviews: product.reviewCount ?? product.reviews ?? 0,
    colors: product.colors || [],
    gallery: product.gallery?.length ? product.gallery : [product.image],
  }
}
