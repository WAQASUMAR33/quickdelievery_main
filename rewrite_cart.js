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
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full sm:w-[420px] bg-white h-full flex flex-col shadow-2xl"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Cart</h2>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-sm font-bold text-[#39772A] hover:text-[#2E5F22] transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50 pb-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hungry?</h3>
              <p className="text-sm">You haven't added anything to your cart!</p>
              <button onClick={onClose} className="mt-6 font-bold text-[#39772A] px-6 py-2 border border-[#39772A] rounded-lg hover:bg-[#39772A]/5 transition-colors">
                Browse menu
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Items List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                {items.map(item => {
                  const price = parseFloat(item.salePrice) || parseFloat(item.price) || 0;
                  return (
                    <div key={item.proId} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                      <img src={item.proImages?.[0] || '/placeholder-product.jpg'} className="w-16 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">{item.proName}</h3>
                        <div className="font-bold text-gray-900 text-sm mt-1">$\${price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={() => updateQuantity(item.proId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-[#39772A] hover:bg-gray-200 transition-colors">
                           <Minus className="w-4 h-4" />
                         </button>
                         <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.proId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#39772A]/10 text-[#39772A] hover:bg-[#39772A]/20 transition-colors">
                           <Plus className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Apply Voucher */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <Tag className="w-5 h-5 text-[#39772A]" />
                <span className="font-bold text-sm text-[#39772A] flex-1">Apply Voucher</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Bill Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>$\${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Charges</span>
                  <span>$2.99</span>
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
          <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-[#39772A] text-white py-4 rounded-xl font-bold hover:bg-[#2E5F22] transition-colors flex items-center justify-center shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-base"
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
  console.log("Successfully replaced CartPage render block!");
} else {
  console.log("Could not find the exact start string in CartPage.");
}
