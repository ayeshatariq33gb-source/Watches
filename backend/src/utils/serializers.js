function serializeProduct(product) {
  const record = typeof product.toObject === 'function' ? product.toObject() : product
  const category = record.category && typeof record.category === 'object' ? record.category : null
  const categorySlug = category?.slug || record.categorySlug || record.category
  const categoryNames = { men: 'Men', women: 'Women', 'limited-editions': 'Limited', automatic: 'Automatic', chronographs: 'Chronograph' }
  return {
    ...record,
    id: String(record._id || record.id),
    category: categoryNames[categorySlug] || categorySlug,
    categoryName: category?.name || record.categoryName || '',
    reviews: record.reviewCount ?? record.reviews ?? 0,
  }
}

function serializeOrder(order) {
  const record = typeof order.toObject === 'function' ? order.toObject() : order
  return { ...record, id: String(record._id || record.id) }
}

module.exports = { serializeProduct, serializeOrder }