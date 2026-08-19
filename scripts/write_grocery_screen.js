const fs = require('fs');

const groceryScreenCode = `import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/debug_logger.dart';
import '../../providers/cart_provider.dart';
import '../catalog/product_detail_screen.dart';
import 'cart_checkout_screen.dart';

class GroceryScreen extends StatefulWidget {
  const GroceryScreen({super.key});

  @override
  State<GroceryScreen> createState() => _GroceryScreenState();
}

class _GroceryScreenState extends State<GroceryScreen> {
  final TextEditingController _searchController = TextEditingController();

  List<dynamic> _groceryMarts = [];
  List<dynamic> _groceryProducts = [];
  List<dynamic> _groceryDeals = [];
  final Set<String> _favoriteMarts = {};
  bool _isLoading = true;

  // Theme Colors matching the Food & Grocery Design
  static const Color headerPink = Color(0xFFD81B60);
  static const Color pricePink = Color(0xFFD81B60);
  static const Color badgePink = Color(0xFFFFEBF2);
  static const Color tagPink = Color(0xFFE91E63);

  @override
  void initState() {
    super.initState();
    DebugLogger.lifecycle('GroceryScreen', 'initState()');
    _loadLiveGroceryData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // ─── Live Database Data Loader ───
  Future<void> _loadLiveGroceryData() async {
    setState(() => _isLoading = true);
    try {
      // 1. Fetch live Grocery Products, Vendors, and Deals from Database
      final results = await Future.wait([
        ApiService.getGroceryVendors(),
        ApiService.getGroceryProducts(),
        ApiService.getGroceryDeals(),
      ]);

      final vendorsRes = results[0];
      final productsRes = results[1];
      final dealsRes = results[2];

      if (!mounted) return;

      setState(() {
        _isLoading = false;

        // Populate Marts / Supermarkets
        if (vendorsRes['success'] == true && vendorsRes['data'] is List && (vendorsRes['data'] as List).isNotEmpty) {
          _groceryMarts = List.from(vendorsRes['data']);
        } else {
          // Fallback initial marts if DB is bootstrapping
          _groceryMarts = [
            {
              'businessName': 'Pandamart - Bahria Town (RWP)',
              'urlLogo': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200',
              'deliveryTime': 'From 15 min',
              'cashbackBadge': '40% cashback',
              'uid': 'vendor_pandamart_bahria'
            },
            {
              'businessName': 'Assetz Mart',
              'urlLogo': 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200',
              'deliveryTime': 'From 15 min',
              'cashbackBadge': '40% cashback',
              'uid': 'vendor_assetz_mart'
            },
            {
              'businessName': 'Al-Fatah (Bahria Town Phase 7)',
              'urlLogo': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200',
              'deliveryTime': 'From 20 min',
              'cashbackBadge': '15% discount',
              'uid': 'vendor_alfatah_bahria'
            }
          ];
        }

        // Populate Products
        if (productsRes['success'] == true && productsRes['data'] is List && (productsRes['data'] as List).isNotEmpty) {
          _groceryProducts = List.from(productsRes['data']);
        } else if (productsRes['products'] is List) {
          _groceryProducts = List.from(productsRes['products']);
        }

        // Populate Deals
        if (dealsRes['success'] == true && dealsRes['data'] is List && (dealsRes['data'] as List).isNotEmpty) {
          _groceryDeals = List.from(dealsRes['data']);
        }
      });
    } catch (e, stack) {
      DebugLogger.error('GroceryScreen', 'Failed to load live grocery data', e, stack);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _parsePrice(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? 0.0;
  }

  String _getProductImage(dynamic item) {
    if (item['proImages'] is List && (item['proImages'] as List).isNotEmpty) {
      return item['proImages'][0].toString();
    }
    if (item['image'] != null && item['image'].toString().isNotEmpty) {
      return item['image'].toString();
    }
    if (item['imageUrl'] != null && item['imageUrl'].toString().isNotEmpty) {
      return item['imageUrl'].toString();
    }
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
  }

  void _toggleFavorite(String martId) {
    setState(() {
      if (_favoriteMarts.contains(martId)) {
        _favoriteMarts.remove(martId);
      } else {
        _favoriteMarts.add(martId);
      }
    });
  }

  void _addToCart(dynamic product) {
    final proName = product['proName'] ?? product['name'] ?? 'Grocery Item';
    final price = _parsePrice(product['salePrice'] ?? product['price']);
    final proId = product['proId'] ?? product['id'] ?? 101;
    final image = _getProductImage(product);

    CartProvider.instance.addItem({
      'proId': proId,
      'id': proId,
      'name': proName,
      'proName': proName,
      'price': price,
      'salePrice': price,
      'image': image,
      'vertical': 'GROCERY',
      'vendor': {'businessName': product['vendor']?['businessName'] ?? 'Pandamart'},
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text('$proName added to cart!', maxLines: 1, overflow: TextOverflow.ellipsis)),
          ],
        ),
        backgroundColor: headerPink,
        duration: const Duration(seconds: 2),
        action: SnackBarAction(
          label: 'View Cart',
          textColor: Colors.white,
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const CartCheckoutScreen()),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // ─── 1. Header (Foodpanda / QuickDelivery Brand Pink) ───
            _buildTopHeader(),

            // ─── 2. Scrollable Body with Live Database Content ───
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: headerPink))
                  : RefreshIndicator(
                      onRefresh: _loadLiveGroceryData,
                      color: headerPink,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        padding: const EdgeInsets.only(bottom: 100),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // ─── Section 1: Assetz Mart Quick Top Card ───
                            _buildAssetzMartHeaderCard(),

                            const SizedBox(height: 14),

                            // ─── Section 2: Pandamart Showcase Card with Horizontal Product Shelf ───
                            _buildPandamartShowcaseCard(),

                            const SizedBox(height: 24),

                            // ─── Section 3: "Save big on your groceries" Promo Carousel ───
                            _buildSaveBigDealsSection(),

                            const SizedBox(height: 24),

                            // ─── Section 4: Al-Fatah & More Grocery Marts ───
                            _buildMoreMartsSection(),
                          ],
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Top Header with Brand Magenta & Search Input ───
  Widget _buildTopHeader() {
    return Container(
      color: headerPink,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 6,
        left: 16,
        right: 16,
        bottom: 14,
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.black87, size: 22),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      decoration: const InputDecoration(
                        hintText: 'Search for shops and products',
                        hintStyle: TextStyle(
                          color: Colors.black54,
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Filter / Settings Tune Button
          InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(20),
            child: Container(
              height: 40,
              width: 40,
              decoration: const BoxDecoration(shape: BoxShape.circle),
              child: const Icon(Icons.tune, color: Colors.white, size: 24),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Section 1: Assetz Mart Quick Top Card ───
  Widget _buildAssetzMartHeaderCard() {
    final assetz = _groceryMarts.firstWhere(
      (m) => (m['businessName'] ?? '').toString().contains('Assetz'),
      orElse: () => _groceryMarts.isNotEmpty ? _groceryMarts.first : {},
    );

    final name = assetz['businessName'] ?? 'Assetz Mart';
    final martId = (assetz['uid'] ?? assetz['id'] ?? 'assetz').toString();
    final isFav = _favoriteMarts.contains(martId);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Store Logo
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 58,
                      height: 58,
                      color: Colors.black,
                      child: Image.network(
                        assetz['urlLogo'] ?? 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.black,
                          child: const Icon(Icons.store, color: Colors.white, size: 28),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: InkWell(
                      onTap: () => _toggleFavorite(martId),
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.8),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isFav ? Icons.favorite : Icons.favorite_border,
                          color: isFav ? Colors.red : Colors.black87,
                          size: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              // Mart Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    const Text('From 15 min', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.motorcycle, size: 14, color: Colors.black54),
                        const SizedBox(width: 4),
                        const Text(
                          'Rs. 189 ',
                          style: TextStyle(fontSize: 12, color: Colors.black54, decoration: TextDecoration.lineThrough),
                        ),
                        const Text(
                          'Free',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: badgePink,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.confirmation_number_outlined, size: 13, color: tagPink),
                          SizedBox(width: 4),
                          Text('40% cashback', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: tagPink)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('+10 more', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 13)),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black87,
                  side: BorderSide(color: Colors.grey.shade400),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                  minimumSize: const Size(80, 34),
                ),
                child: const Text('See all', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Section 2: Pandamart Showcase Card with Horizontal Product Shelf ───
  Widget _buildPandamartShowcaseCard() {
    final pandamart = _groceryMarts.firstWhere(
      (m) => (m['businessName'] ?? '').toString().contains('Pandamart'),
      orElse: () => _groceryMarts.isNotEmpty ? _groceryMarts.first : {},
    );

    final name = pandamart['businessName'] ?? 'Pandamart - Bahria Town (RWP)';
    final martId = (pandamart['uid'] ?? pandamart['id'] ?? 'pandamart').toString();
    final isFav = _favoriteMarts.contains(martId);

    // Products belonging to Pandamart or all grocery products
    final shelfProducts = _groceryProducts.isNotEmpty ? _groceryProducts : _getSampleGroceryProducts();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Store Header Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Mart Avatar with Favorite Icon
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      width: 64,
                      height: 64,
                      color: const Color(0xFFE8F5E9),
                      child: Image.network(
                        pandamart['urlLogo'] ?? 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: headerPink,
                          child: const Center(
                            child: Text('pandamart', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: InkWell(
                      onTap: () => _toggleFavorite(martId),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isFav ? Icons.favorite : Icons.favorite_border,
                          color: isFav ? Colors.red : Colors.black87,
                          size: 15,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              // Name, Delivery, Badges
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    const Text('From 15 min', style: TextStyle(fontSize: 12.5, color: Colors.black54)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.motorcycle, size: 14, color: Colors.black54),
                        const SizedBox(width: 4),
                        const Text(
                          'Rs. 169 ',
                          style: TextStyle(fontSize: 12.5, color: Colors.black54, decoration: TextDecoration.lineThrough),
                        ),
                        const Text(
                          'Free',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: badgePink,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.confirmation_number_outlined, size: 13, color: tagPink),
                              SizedBox(width: 4),
                              Text('40% cashback', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: tagPink)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: badgePink,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.local_offer_outlined, size: 13, color: tagPink),
                              SizedBox(width: 4),
                              Text('Pandamart', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: tagPink)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Arrow Navigation Icon
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.black54),
                onPressed: () {},
              ),
            ],
          ),

          const SizedBox(height: 18),

          // ─── Horizontal Product Shelf Carousel (Matching Screenshot) ───
          SizedBox(
            height: 245,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: shelfProducts.length,
              itemBuilder: (context, index) {
                final product = shelfProducts[index];
                return _buildShelfProductCard(product);
              },
            ),
          ),
        ],
      ),
    );
  }

  // ─── Horizontal Product Item Card (Matching Exact Screenshot) ───
  Widget _buildShelfProductCard(dynamic product) {
    final proName = (product['proName'] ?? product['name'] ?? 'Item').toString();
    final price = _parsePrice(product['salePrice'] ?? product['price']);
    final origPrice = _parsePrice(product['price']);
    final discount = _parsePrice(product['discount']);
    final imageUrl = _getProductImage(product);
    final isDiscounted = (discount > 0) || (origPrice > price && origPrice > 0);
    final discountLabel = discount > 0 ? '\${discount.toInt()}% off' : 'Sale';

    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Product Image Card with Add Button
          Stack(
            children: [
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => ProductDetailScreen(product: product)),
                  );
                },
                child: Container(
                  height: 130,
                  width: 140,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F7F7),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: const Color(0xFFF7F7F7),
                        child: const Icon(Icons.shopping_bag_outlined, color: Colors.grey, size: 36),
                      ),
                    ),
                  ),
                ),
              ),
              // Floating Add (+) button on bottom right of image
              Positioned(
                bottom: 8,
                right: 8,
                child: InkWell(
                  onTap: () => _addToCart(product),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.15),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.add, color: headerPink, size: 18),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // 2. Price Row (Bold Pink Price + Crossed-out Price)
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'Rs. \${price.toStringAsFixed(2)} ',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: pricePink,
                  ),
                ),
                if (isDiscounted && origPrice > price)
                  TextSpan(
                    text: 'Rs. \${origPrice.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Colors.grey,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
              ],
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 3),

          // 3. Discount Percentage Badge
          if (isDiscounted)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: badgePink,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                discountLabel,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: tagPink,
                ),
              ),
            ),

          const SizedBox(height: 3),

          // 4. Product Title & Pack Size
          Text(
            proName,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
              height: 1.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ─── Section 3: "Save big on your groceries" Promo Carousel ───
  Widget _buildSaveBigDealsSection() {
    final dealsList = _groceryDeals.isNotEmpty ? _groceryDeals : _getSampleGroceryDeals();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Save big on your groceries',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 175,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: dealsList.length,
            itemBuilder: (context, index) {
              final deal = dealsList[index];
              return _buildPromoDealBanner(deal, index);
            },
          ),
        ),
      ],
    );
  }

  // ─── Promo Deal Banner Card ───
  Widget _buildPromoDealBanner(dynamic deal, int index) {
    final title = deal['customTitle'] ?? 'Azaadi Deals';
    final badge = deal['badgeLabel'] ?? deal['customPriceLabel'] ?? 'Up to 25% off';
    final colors = [
      const Color(0xFFE91E63), // Vibrant Pink
      const Color(0xFF00897B), // Emerald
      const Color(0xFFD81B60), // Magenta
    ];
    final cardColor = colors[index % colors.length];

    return Container(
      width: 145,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            cardColor,
            cardColor.withValues(alpha: 0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: cardColor.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Top Pill Tag
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              title,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Center Discount Text
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                badge,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  height: 1.1,
                ),
              ),
              const Text(
                'groceries',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          // Bottom Terms
          const Text(
            'T&Cs apply.',
            style: TextStyle(color: Colors.white70, fontSize: 9),
          ),
        ],
      ),
    );
  }

  // ─── Section 4: Al-Fatah & More Grocery Marts ───
  Widget _buildMoreMartsSection() {
    final alfatah = _groceryMarts.firstWhere(
      (m) => (m['businessName'] ?? '').toString().contains('Al-Fatah'),
      orElse: () => _groceryMarts.length > 2 ? _groceryMarts[2] : {},
    );

    final name = alfatah['businessName'] ?? 'Al-Fatah (Bahria Town Phase 7)';
    final martId = (alfatah['uid'] ?? alfatah['id'] ?? 'alfatah').toString();
    final isFav = _favoriteMarts.contains(martId);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Store Logo
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 58,
                  height: 58,
                  color: const Color(0xFF1B5E20),
                  child: Image.network(
                    alfatah['urlLogo'] ?? 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: const Color(0xFF1B5E20),
                      child: const Icon(Icons.store, color: Colors.white, size: 28),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 2,
                right: 2,
                child: InkWell(
                  onTap: () => _toggleFavorite(martId),
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.8),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      color: isFav ? Colors.red : Colors.black87,
                      size: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          // Mart Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                const Text('From 20 min', style: TextStyle(fontSize: 12, color: Colors.black54)),
                const SizedBox(height: 4),
                Row(
                  children: const [
                    Icon(Icons.motorcycle, size: 14, color: Colors.black54),
                    SizedBox(width: 4),
                    Text(
                      'Rs. 149 Free',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.black54),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // ─── Realistic Fallback Products Matching Screenshot ───
  List<dynamic> _getSampleGroceryProducts() {
    return [
      {
        'proId': 101,
        'proName': 'brightfarms Fresh Eggs 12 Pieces',
        'price': 300.0,
        'salePrice': 270.0,
        'discount': 10.0,
        'image': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
      },
      {
        'proId': 102,
        'proName': "Olper's Full Cream Milk 1000ml",
        'price': 380.0,
        'salePrice': 357.20,
        'discount': 6.0,
        'image': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      },
      {
        'proId': 103,
        'proName': 'brightfarm fresh banana half dozen',
        'price': 240.0,
        'salePrice': 199.0,
        'discount': 17.0,
        'image': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
      },
      {
        'proId': 104,
        'proName': 'Prema Pure Pasteurized Milk 425g',
        'price': 245.0,
        'salePrice': 220.0,
        'discount': 10.0,
        'image': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
      },
      {
        'proId': 105,
        'proName': 'Pepsi Cola 1.5 Litre Bottle',
        'price': 210.0,
        'salePrice': 189.0,
        'discount': 10.0,
        'image': 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
      },
      {
        'proId': 106,
        'proName': '7UP Lemon Lime 1.5 Litre Bottle',
        'price': 210.0,
        'salePrice': 189.0,
        'discount': 10.0,
        'image': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
      },
    ];
  }

  // ─── Realistic Fallback Deals Matching Screenshot ───
  List<dynamic> _getSampleGroceryDeals() {
    return [
      {
        'customTitle': 'Azaadi Deals',
        'badgeLabel': 'Up to 25% off',
      },
      {
        'customTitle': 'Fresh Mart',
        'badgeLabel': 'Up to 10% off',
      },
      {
        'customTitle': 'pandamart',
        'badgeLabel': 'Up to 15% Off beverages',
      },
    ];
  }
}
`;

const targetPath = '/Users/turabali/Documents/quickdelivery_customer/lib/screens/dashboard/grocery_screen.dart';
fs.writeFileSync(targetPath, groceryScreenCode, 'utf8');
console.log('✅ Successfully wrote grocery_screen.dart');
