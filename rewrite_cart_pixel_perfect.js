const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'customer', 'CartPage.js');
let current = fs.readFileSync(file, 'utf8');

const newRender = `
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end font-sans"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full sm:w-[420px] bg-[#f4f7f4] h-full flex flex-col shadow-2xl"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center p-4 bg-white relative">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-[#39772A] transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-base font-bold text-gray-900 flex-1 text-center pr-10">Cart</h2>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto pb-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hungry?</h3>
              <p className="text-sm">You haven't added anything to your cart!</p>
              <button onClick={onClose} className="mt-6 font-bold text-white px-6 py-2 bg-[#39772A] rounded-lg hover:bg-[#2E5F22] transition-colors">
                Browse menu
              </button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              
              {/* Items List */}
              <div className="bg-white px-4 divide-y divide-gray-100">
                {items.map(item => {
                  const price = parseFloat(item.salePrice) || parseFloat(item.price) || 0;
                  return (
                    <div key={item.proId} className="py-4 flex">
                      <img src={item.proImages?.[0] || '/placeholder-product.jpg'} className="w-14 h-14 object-cover rounded-xl bg-gray-100 flex-shrink-0 mr-3" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                           <h3 className="font-semibold text-sm text-gray-900 pr-2 leading-tight">{item.proName}</h3>
                           <div className="font-semibold text-gray-900 text-sm">$\${price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                           <button onClick={() => updateQuantity(item.proId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-[#39772A] hover:bg-gray-200 transition-colors">
                             <Minus className="w-4 h-4" />
                           </button>
                           <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.proId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#39772A] text-white hover:bg-[#2E5F22] transition-colors shadow-sm">
                             <Plus className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Apply Voucher */}
              <div className="bg-white p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <Tag className="w-5 h-5 text-[#39772A]" />
                <span className="font-semibold text-sm text-gray-900 flex-1">Apply Voucher</span>
                <ChevronRight className="w-5 h-5 text-[#39772A]" />
              </div>

              {/* Bill Summary */}
              <div className="bg-white p-4 space-y-3 pb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">$\${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-gray-900">$2.99</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-base text-gray-900">
                  <span>Total Amount</span>
                  <span>$\${(getTotalPrice() + 2.99).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {items.length > 0 && (
          <div className="p-4 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] border-t border-gray-100">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-[#39772A] text-white py-3.5 rounded-xl font-bold hover:bg-[#2E5F22] transition-colors flex items-center justify-center shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-base tracking-wide"
            >
              {loading ? 'Processing...' : 'Review payment and address'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default CartPage;
`;

const searchStr = '  return (\n    <motion.div';
const exactStart = current.indexOf(searchStr);

if (exactStart !== -1) {
  const finalContent = current.substring(0, exactStart) + newRender;
  fs.writeFileSync(file, finalContent, 'utf8');
  console.log("Successfully replaced CartPage render block with pixel perfect version!");
} else {
  console.log("Could not find the exact start string in CartPage.");
}
