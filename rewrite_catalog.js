const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'customer', 'ProductCatalog.js');

let current = fs.readFileSync(file, 'utf8');

// We want to replace the `return (...)` block of ProductCatalog
// We find the `return (` that belongs to the main component.
// The main component return is at the end of the file before `export default ProductCatalog` or just at the end.

const newRender = `
  return (
    <div className="w-full bg-gray-50 min-h-screen relative pb-32">
      {/* ── HEADER / TABS ── */}
      <div className="sticky top-[64px] lg:top-[72px] z-40 bg-white border-b border-gray-200 px-4 py-3 flex gap-6 overflow-x-auto no-scrollbar shadow-sm">
        <button
          onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null) }}
          className={\`whitespace-nowrap font-bold text-sm pb-1 border-b-2 transition-colors \${
            selectedCategory == null ? 'border-[#39772A] text-[#39772A]' : 'border-transparent text-gray-500 hover:text-gray-900'
          }\`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
            className={\`whitespace-nowrap font-bold text-sm pb-1 border-b-2 transition-colors \${
              selectedCategory === cat.id ? 'border-[#39772A] text-[#39772A]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }\`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── HERO DEALS ── */}
      {dealProducts.length > 0 && selectedCategory == null && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-[#39772A] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-md">
             <div>
                <h2 className="text-2xl font-bold mb-2">Exclusive Deals</h2>
                <p className="text-[#D8E9D6]">Save big on your favorite meals today!</p>
             </div>
             <div className="mt-4 md:mt-0 flex gap-4 overflow-x-auto max-w-full pb-2">
                {dealProducts.map(deal => (
                   <div key={deal.proId} className="bg-white rounded-xl overflow-hidden w-48 flex-shrink-0 cursor-pointer text-gray-900" onClick={() => setDetailProduct(deal)}>
                      <img src={deal.proImages?.[0] || '/placeholder-product.jpg'} className="w-full h-28 object-cover" />
                      <div className="p-3">
                         <h3 className="font-bold text-sm truncate">{deal.proName}</h3>
                         <span className="text-[#39772A] font-bold text-sm">{deal.__dealBadge}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTS LIST ── */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedCategory == null ? 'Now open for order' : categories.find(c => String(c.id) === String(selectedCategory))?.name}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {sortedProducts.map(product => {
            const price = parseFloat(product.price) || 0
            const discount = parseFloat(product.discount || 0)
            const img = product.proImages?.[0] || '/placeholder-product.jpg'
            const inWishlist = isInWishlist(product.proId)
            return (
              <div key={product.proId} className="flex p-4 hover:bg-gray-50 cursor-pointer transition-colors relative" onClick={() => setDetailProduct(product)}>
                <div className="flex-1 pr-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight mb-1">{product.proName}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.description || 'Delicious meal.'}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-bold text-gray-900">$\${price.toFixed(2)}</span>
                    {discount > 0 && <span className="text-xs text-[#39772A] bg-[#D8E9D6] px-1.5 py-0.5 rounded font-bold">\${Math.round(discount)}% Off</span>}
                  </div>
                </div>
                <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-gray-100">
                  <img src={img} alt={product.proName} className="w-full h-full object-cover" />
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(product) }}
                    className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-full hover:bg-white transition shadow-sm backdrop-blur-sm"
                  >
                    <Heart className={\`w-4 h-4 \${inWishlist ? 'text-[#39772A] fill-current' : 'text-gray-600'}\`} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailProduct(product) }}
                    className="absolute bottom-1 right-1 w-8 h-8 bg-white text-[#39772A] hover:bg-[#39772A] hover:text-white rounded-full shadow-md flex items-center justify-center transition-colors border border-gray-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
          {sortedProducts.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-medium">No items found in this category.</div>
          )}
        </div>
      </div>

      {/* ── FLOATING CART BUTTON ── */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-4xl pointer-events-auto">
          <button
            onClick={() => { window.location.href = '/customer/cart' }}
            className="w-full bg-[#39772A] text-white rounded-xl py-4 px-5 flex items-center justify-between shadow-2xl hover:bg-[#2E5F22] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold shadow-inner flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> View Cart
              </div>
            </div>
            <div className="font-bold text-base flex items-center gap-2">
               Checkout <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {detailProduct && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-4 bg-black/50 backdrop-blur-sm">
             <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
             >
                <div className="relative h-64 bg-gray-100 flex-shrink-0">
                   <img src={detailProduct.proImages?.[0] || '/placeholder-product.jpg'} className="w-full h-full object-cover" />
                   <button onClick={() => setDetailProduct(null)} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1">
                   <h2 className="text-2xl font-bold text-gray-900">{detailProduct.proName}</h2>
                   <p className="text-gray-500 mt-2 text-sm">{detailProduct.description}</p>
                   <div className="mt-4 font-bold text-xl text-gray-900">$\${parseFloat(detailProduct.price).toFixed(2)}</div>
                   
                   <div className="mt-6 flex items-center justify-center gap-6">
                      <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-[#39772A] hover:bg-gray-50">
                         <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-bold">{modalQty}</span>
                      <button onClick={() => setModalQty(modalQty + 1)} className="w-10 h-10 rounded-full border border-[#39772A] bg-[#39772A]/10 flex items-center justify-center text-[#39772A] hover:bg-[#39772A]/20">
                         <Plus className="w-5 h-5" />
                      </button>
                   </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex-shrink-0">
                   <button onClick={() => { addToCart(detailProduct, modalQty); toast.success('Added to cart'); setDetailProduct(null); setModalQty(1) }} className="w-full bg-[#39772A] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2E5F22] transition-colors shadow-lg">
                      Add \${modalQty} to Cart • $\${(parseFloat(detailProduct.price) * modalQty).toFixed(2)}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default ProductCatalog;
`;

const startIndex = current.indexOf('return (', current.indexOf('const filteredProducts'));
if (startIndex !== -1) {
  const endIndex = current.lastIndexOf('export default ProductCatalog');
  // I need to find exactly where the main return starts.
  // The main return is right after \`const scrollDealsCarousel = ...\` and other renders.
  // Let's use a robust string match.
  const searchStr = '  return (\n    <div className="w-full overflow-x-hidden">';
  const exactStart = current.indexOf(searchStr);
  
  if (exactStart !== -1) {
    const finalContent = current.substring(0, exactStart) + newRender;
    fs.writeFileSync(file, finalContent, 'utf8');
    console.log("Successfully replaced ProductCatalog render block!");
  } else {
    console.log("Could not find the exact start string.");
  }
} else {
  console.log("Could not find return statement.");
}
