const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'customer', 'ProductCatalog.js');
let current = fs.readFileSync(file, 'utf8');

const newRender = `
  return (
    <div className="w-full bg-[#f4f7f4] min-h-screen relative pb-32 font-sans">
      
      {/* ── TOP SECTION (Now open for order) ── */}
      <div className="bg-white px-4 pt-6 pb-6 shadow-sm mb-2 rounded-b-3xl">
         <h2 className="text-xl font-bold text-gray-900 mb-4">Now <span className="text-[#39772A]">open</span> for order</h2>
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            
            {/* Example Card 1 */}
            <div className="w-48 flex-shrink-0 cursor-pointer">
               <div className="relative h-32 rounded-2xl overflow-hidden mb-2">
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="food" />
                  <div className="absolute top-2 left-2 bg-[#39772A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                     20% OFF
                  </div>
               </div>
               <div className="flex justify-between items-start">
                  <div>
                     <h3 className="font-bold text-sm text-gray-900">Healthy Havoc</h3>
                     <p className="text-[10px] text-gray-500">Vegetarian, Healthy Food</p>
                  </div>
                  <div className="flex items-center text-[10px] text-gray-700">
                     <Star className="w-3 h-3 text-[#39772A] fill-[#39772A] mr-0.5" /> 4.8
                  </div>
               </div>
               <div className="mt-1 flex items-center gap-1">
                  <span className="bg-[#39772A] text-white text-[9px] px-1.5 py-0.5 rounded">FREE DELIVERY</span>
               </div>
            </div>

            {/* Example Card 2 */}
            <div className="w-48 flex-shrink-0 cursor-pointer">
               <div className="relative h-32 rounded-2xl overflow-hidden mb-2">
                  <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="food" />
                  <div className="absolute top-2 left-2 bg-[#39772A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                     20% OFF
                  </div>
               </div>
               <div className="flex justify-between items-start">
                  <div>
                     <h3 className="font-bold text-sm text-gray-900">Asian Panacoti</h3>
                     <p className="text-[10px] text-gray-500">Asian, Healthy Food</p>
                  </div>
                  <div className="flex items-center text-[10px] text-gray-700">
                     <Star className="w-3 h-3 text-[#39772A] fill-[#39772A] mr-0.5" /> 4.9
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* ── RESTAURANT HERO (Healthy Havoc) ── */}
      <div className="relative bg-white pt-2 pb-4 shadow-sm">
         <div className="relative h-48 w-full bg-gray-100">
            <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Restaurant Header" />
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Header Icons */}
            <div className="absolute top-4 left-4 w-8 h-8 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/50">
               <ChevronRight className="w-5 h-5 rotate-180" />
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/50">
               <Heart className="w-4 h-4" />
            </div>

            <h1 className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold tracking-tight">
               Healthy Havoc
            </h1>
         </div>

         {/* ── HEADER / TABS ── */}
         <div className="sticky top-[64px] lg:top-[72px] z-40 bg-white border-b border-gray-100 px-4 pt-4 flex gap-6 overflow-x-auto no-scrollbar shadow-sm">
           <button
             onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null) }}
             className={\`whitespace-nowrap font-semibold text-xs pb-2 border-b-2 transition-colors \${
               selectedCategory == null ? 'border-[#39772A] text-[#39772A]' : 'border-transparent text-gray-400 hover:text-gray-900'
             }\`}
           >
             All
           </button>
           {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
               className={\`whitespace-nowrap font-semibold text-xs pb-2 border-b-2 transition-colors \${
                 selectedCategory === cat.id ? 'border-[#39772A] text-[#39772A]' : 'border-transparent text-gray-400 hover:text-gray-900'
               }\`}
             >
               {cat.name}
             </button>
           ))}
         </div>

         {/* ── PRODUCTS LIST ── */}
         <div className="max-w-4xl mx-auto px-4 mt-2 bg-white">
           <div className="divide-y divide-gray-100">
             {sortedProducts.map(product => {
               const price = parseFloat(product.price) || 0
               const img = product.proImages?.[0] || '/placeholder-product.jpg'
               return (
                 <div key={product.proId} className="flex py-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => addToCart(product)}>
                   <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                     <img src={img} alt={product.proName} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 pl-4 flex flex-col justify-center">
                     <div className="flex justify-between items-start">
                       <h3 className="font-bold text-gray-900 text-sm leading-tight pr-4">{product.proName}</h3>
                       <span className="font-bold text-gray-900 text-sm">$\${price.toFixed(2)}</span>
                     </div>
                     <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">{product.description || 'Vegetable healthy food with olive oil.'}</p>
                   </div>
                 </div>
               )
             })}
             {sortedProducts.length === 0 && (
               <div className="p-8 text-center text-gray-400 text-sm font-medium">No items found.</div>
             )}
           </div>
         </div>
      </div>

      {/* ── PILL FLOATING CART BUTTON ── */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto">
            <button
              onClick={() => { window.location.href = '/customer/cart' }}
              className="w-full bg-[#39772A] text-white rounded-full py-3.5 px-6 flex items-center justify-between shadow-2xl hover:bg-[#2E5F22] transition-colors"
            >
              <div className="text-sm font-bold tracking-wide">
                {getTotalItems()} Items in Cart
              </div>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#39772A] shadow-inner">
                 <ShoppingBag className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal (hidden/simplified for now, since addToCart is direct) */}
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

const searchStr = '  return (\n    <div className="w-full';
const exactStart = current.indexOf(searchStr);

if (exactStart !== -1) {
  const finalContent = current.substring(0, exactStart) + newRender;
  fs.writeFileSync(file, finalContent, 'utf8');
  console.log("Successfully replaced ProductCatalog render block with pixel perfect version!");
} else {
  console.log("Could not find the exact start string.");
}
