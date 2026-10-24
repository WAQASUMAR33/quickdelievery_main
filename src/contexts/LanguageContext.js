'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Top utility ribbon
    deliverTo: 'Deliver to:',
    allRegions: 'Pakistan (All Regions)',
    liveStatus: 'Live Verified High-Speed Cloud Storefront',
    partnerWithUs: 'Partner with Us',
    zeroFee: '0% FEE',
    trackOrder: 'Track Order',
    support247: 'Support 24/7',
    expressNotice: 'Express Delivery across Pakistan • Free on orders over Rs. 1,500',

    // Header & Search
    allCollections: 'All Collections',
    searchPlaceholder: 'Search across 161+ tech, computing, groceries, chef dishes…',
    signIn: 'Sign In',
    myAccount: 'My Account',
    bag: 'Bag',

    // Department pills
    deptAll: '✦ All Collections',
    deptDrops: '⚡ Flash Drops',
    deptMobile: '📱 Mobile & Tech',
    deptComputers: '💻 Computing & Laptops',
    deptGrocery: '🛒 Pantry & Organic',
    deptDining: '🍔 Chef Dining',
    deptBakery: '🥐 French Bakery',
    deptBoutiques: '🏬 Brand Boutiques',

    // Hero slides
    slide1Badge: 'TECH & NEXT-GEN MOBILITY',
    slide1Title: 'Power Up with Official Mobile Gear',
    slide1Subtitle: 'GaN 100W Fast Chargers, Braided Type-C Cables, ANC Earbuds & Smartwatch Bands',
    slide1Cta: 'Explore Mobile Tech',

    slide2Badge: 'PRO WORKSTATIONS & GAMING',
    slide2Title: 'Unleash Next-Gen Gaming & Computing',
    slide2Subtitle: 'Core i7/Ryzen Laptops, Mechanical RGB Keyboards, NVMe SSDs & Precision Mice',
    slide2Cta: 'Shop Computing',

    slide3Badge: 'FARM DIRECT & ORGANIC PANTRY',
    slide3Title: 'Everyday Fresh Groceries at Fair Prices',
    slide3Subtitle: 'Farm-fresh organic produce, dairy essentials, cold-pressed oils & basmati grains',
    slide3Cta: 'Order Pantry',

    slide4Badge: 'ARTISAN PATISSERIE & CHEF DINING',
    slide4Title: 'Handcrafted Angus Burgers & French Pastries',
    slide4Subtitle: 'Smashed double beef patties, wood-fired Neapolitan pizza, French croissants & macarons',
    slide4Cta: 'Taste Gourmet',

    // Bento cards
    limitedDrops: 'Limited Drops',
    closingIn: 'CLOSING IN',
    curatedDropDiscounts: 'Curated Drop Discounts',
    dropSubtitle: 'Save up to 45% on mobile tech, workstations & groceries!',
    exploreDrops: 'Explore Drops',
    bespokeMall: 'Bespoke Multi-Vendor Mall',
    authenticGuarantee: '100% Authentic Brand Guarantees',
    authenticSubtitle: 'Verified boutiques: ElectroZone, Apex Computers, Metro Fresh, and gourmet kitchens.',
    easyReturns: '7-Day Easy Returns',
    viewBoutiques: 'View Boutiques →',

    // Departments section
    exploreDepartments: 'Explore Departments',
    items: 'items',

    // Flash sale
    flashDrops: 'FLASH DROPS',
    endsIn: 'Ends in:',
    exploreAllDrops: 'EXPLORE ALL DROPS',

    // Boutiques section
    verifiedBoutiques: 'Featured Stores & Restaurants',
    genuineBrandsSubtitle: '100% verified merchants, restaurants & supermarkets',
    verified: 'Verified',
    productsCount: 'Products',
    visitBoutique: 'Visit Store →',
    viewingBoutique: 'Viewing Store',

    // Filter sidebar
    filterCatalog: 'Filter Catalog',
    resetAll: 'Reset all',
    departments: 'Departments',
    allDepartments: 'All Departments',
    officialBoutiques: 'Featured Stores & Restaurants',
    priceRangePkr: 'Price Range (PKR)',
    serviceRating: 'Service & Rating',
    starsAbove: '4.0 Stars & Above',
    onSaleOnly: 'On Sale / Flash Drops',
    freeExpressDelivery: 'Free Express Delivery',

    // Catalog grid
    catalogResults: 'Catalog Results',
    showing: 'Showing',
    of: 'of',
    sortBy: 'Sort by:',
    sortRelevance: 'Relevance',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortRating: 'Highest Rated',
    sortNewest: 'Newest Arrivals',
    noProductsFound: 'No products found',
    noProductsSubtitle: 'No items matched your current filters. Try resetting the filters or modifying your search terms.',

    // Product card & modal
    inStock: 'In Stock',
    freeDelivery: 'Free Delivery',
    standardShipping: 'Standard Shipping',
    addToBasket: 'Add to Basket',
    buyNow: 'Buy Now',
    selectOption: 'Select Option:',
    quantity: 'Quantity:',
    reviews: 'Reviews',

    // AI & WhatsApp
    askAi: '✦ Ask AI Concierge',
    aiAssistantTitle: 'QuickAI Shopping Concierge',
    aiSubtitle: 'Your intelligent assistant for product discovery, bundle creation & meal kits',
    whatsappSupport: 'WhatsApp Live Support',
    onlineNow: 'Online Now',

    // Footer
    expressFastDelivery: 'Express Fast Delivery',
    expressFastDeliverySub: 'Live order tracking with verified dispatchers',
    genuineBrands: '100% Genuine Brands',
    genuineBrandsSub: 'Verified official boutiques & authorized sellers',
    easyReturnsSub: 'Hassle-free refunds & money-back guarantee',
    supportSub: 'Live chat, order support & dedicated helpline',
    footerAbout: 'Your bespoke e-commerce hub for high-performance computing, mobile tech, organic supermarket groceries, and chef-curated dining.',
    quickNav: 'Quick Navigation',
    becomePartner: 'Become a Partner',
    sellZeroComm: 'Sell on QuickDelivery (0% Comm)',
    registerDriver: 'Register as Delivery Partner',
    customerCare: 'Customer Care',
    copyright: 'QuickDelivery Multi-Vendor Marketplace. High-Speed Cloud Storefront.',

    // MegaMenu & Categories
    allDepartmentsCollections: 'All Departments & Collections',
    browseCompleteCatalog: 'Browse our complete catalog of verified vendor products.',
    browseAllCatalog: 'Browse all catalog items',
    featuredDepartments: 'Featured Departments',
    clickAboveToBrowse: 'Click above to browse all products in',
    subcategories: 'Subcategories',

    // Wishlist
    loginRequired: 'Login Required',
    pleaseLoginWishlist: 'Please login to view your wishlist',
    remove: 'Remove',
    savedForLater: 'saved for later',
    searchWishlistPlaceholder: 'Search wishlist...',
    sortOldest: 'Oldest First',
    sortName: 'Name A-Z',
    wishlistEmpty: 'Your wishlist is empty',
    wishlistEmptySub: 'Start adding products you love to keep track of them and purchase later.',
    browseProducts: 'Browse Products',
    noItemsFound: 'No items found',
    adjustSearchOrFilters: 'Try adjusting your search or filters',

    // Profile & Account
    personalInformation: 'Personal Information',
    editProfile: 'Edit Profile',
    saving: 'Saving...',
    save: 'Save',
    cancel: 'Cancel',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'Zip Code',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    selectGender: 'Select Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    myProfile: 'My Profile',
    manageAccountSettings: 'Manage your account settings and preferences',
    profile: 'Profile',
    security: 'Security',
    notifications: 'Notifications',
    payment: 'Payment',
    customer: 'Customer',
    verifiedCustomer: 'Verified Customer',
    unverified: 'Unverified',
    addressLocationDetails: 'Address & Location Details',
    accountMetadata: 'Account Metadata',

    // Product View & Merchant Details
    officialKitchen: 'Official Restaurant Kitchen',
    officialMerchant: 'Official Verified Merchant',
    specialty: 'Specialty',
    diningKitchen: 'Dining & Kitchen',
    retailBoutique: 'Retail Boutique',
    kitchenProfile: 'Kitchen Profile',
    storeProfile: 'Store Profile',
    chatWithSeller: 'Chat with Seller',
    frequentlyBoughtTogether: 'Frequently Bought Together:',
    saveRs: 'Save Rs.',
    descriptionFeatures: 'Description & Features',
    supplierKitchenInfo: 'Supplier & Kitchen Info',
    specifications: 'Specifications',
    onlyItemsReady: 'Only limited items ready in kitchen!',

    // Footer & Links
    customerAccountSignIn: 'Customer Account & Sign In',
    createCustomerAccount: 'Create Free Customer Account',
    trackActiveOrders: 'Track Active Orders',
    vendorPortal: 'Vendor Merchant Portal',
    driverPortal: 'Driver Operations Login',
    liveDispatchHours: 'Live Dispatch Hours: 24/7 Nationwide',
    footerOrderHelp: 'Need help with an existing order? Access live tracking or message customer care directly in your',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    merchantAgreement: 'Merchant Agreement',
  },

  ar: {
    // Top utility ribbon & header
    deliverTo: 'التوصيل إلى:',
    allRegions: 'باكستان (جميع المناطق)',
    liveStatus: 'معتمد وموثق سحابياً بأعلى سرعة',
    highSpeedCdn: 'شبكة CDN فائقة السرعة • متوافق مع المتاجر المتعددة',
    partnerWithUs: 'انضم كشريك معنا',
    zeroFee: 'عمولة 0%',
    trackOrder: 'تتبع الطلب',
    support247: 'دعم العملاء 24/7',
    expressNotice: 'توصيل فائق السرعة لجميع المناطق • شحن مجاني للطلبات فوق 1,500 روبية',
    allCollections: 'جميع المجموعات',
    searchPlaceholder: 'ابحث في أكثر من 161 منتجاً من الإلكترونيات، الحواسيب، البقالة، وأطباق الشيف…',
    searchItemsPlaceholder: 'ابحث في أكثر من 161 منتجاً، وجبات، تكنولوجيا…',
    signIn: 'تسجيل الدخول',
    signInRegister: 'تسجيل الدخول / فتح حساب جديد',
    myAccount: 'حسابي الشخصي',
    bag: 'السلة',
    cart: 'السلة',
    myBasket: 'سلتي',
    tapToViewBill: 'اضغط لعرض الفاتورة وإتمام الطلب',
    items: 'منتجات',
    item: 'منتج',
    checkout: 'إتمام الطلب',
    curatedMarketplace: 'سوق متكامل للمتاجر والمطاعم المعتمدة',
    boutiqueMall: 'سوق المتاجر المعتمدة',
    menu: 'القائمة ▾',
    askAi: '✦ استشر المساعد الذكي',
    aiPro: 'احترافي',
    welcome: 'أهلاً بك،',
    mainMenu: 'القائمة الرئيسية',
    exploreHome: 'الرئيسية والاستكشاف',
    myOrders: 'طلباتي',
    favourites: 'المفضلة',
    wishlist: 'قائمة الرغبات',
    profileSettings: 'إعدادات الحساب',
    signOut: 'تسجيل الخروج',
    lightMode: 'الوضع النهاري',
    darkMode: 'الوضع الليلي',
    goodMorning: 'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening: 'مساء الخير',
    allProducts: 'جميع المنتجات المتوفرة',

    // Department pills & categories
    allDepartments: 'جميع الأقسام',
    departments: 'الأقسام الرئيسية',
    deptAll: '✦ كل المجموعات',
    deptDrops: '⚡ عروض البرق',
    deptMobile: '📱 إلكترونيات وهواتف',
    deptComputers: '💻 حواسيب ولابتوب',
    deptGrocery: '🛒 بقالة وخضار طازجة',
    deptDining: '🍔 وجبات شيف فاخرة',
    deptBakery: '🥐 مخبوزات فرنسية',
    deptBoutiques: '🏬 المتاجر المعتمدة',
    brandBoutiques: 'المتاجر والمطاعم المعتمدة',
    flashDrops: 'عروض البرق الحصرية',
    officialBoutiques: 'المتاجر والمطاعم المميزة',
    featuredStores: 'المتاجر والمطاعم المميزة',

    // Specific Database Category Names
    Restaurant: 'مطاعم ومأكولات فاخرة',
    'Fresh Groceries': 'بقالة وخضار طازجة',
    'Bakery & Desserts': 'مخبوزات وحلويات فاخرة',
    'Electronics & Tech': 'إلكترونيات وأجهزة ذكية',
    'Grocery & Supermarket': 'بقالة وسوبرماركت',
    'Bakery & Patisserie': 'مخبوزات ومعجنات فرنسية',
    'Electronics & Technology': 'إلكترونيات وتكنولوجيا',
    'Clothing & Fashion': 'أزياء وملابس عصرية',
    'Healthcare & Pharmacy': 'صيدلية ورعاية صحية',
    'Home & Living': 'مستلزمات المنزل والديكور',
    'Beauty & Personal Care': 'جمال وعناية شخصية',

    // Hero slides
    slide1Badge: 'تكنولوجيا وأجهزة الجيل القادم',
    slide1Title: 'انطلق بأحدث إكسسوارات الهواتف الأصلية',
    slide1Subtitle: 'شواحن GaN فائقة السرعة بقوة 100 واط، كابلات Type-C وسماعات مانعة للضوضاء',
    slide1Cta: 'تسوق التكنولوجيا',

    slide2Badge: 'حواسيب وأجهزة الألعاب الاحترافية',
    slide2Title: 'أطلق العنان لقوة الألعاب ومحطات العمل',
    slide2Subtitle: 'لابتوبات Core i7 و Ryzen، لوحات مفاتيح ميكانيكية ووحدات تخزين NVMe فائقة السرعة',
    slide2Cta: 'استكشف الحواسيب',

    slide3Badge: 'بقالة عضوية مباشرة من المزارع',
    slide3Title: 'أفضل المنتجات الغذائية الطازجة بأسعار عادلة',
    slide3Subtitle: 'خضار وفواكه عضوية، ألبان طازجة، زيوت معصورة على البارد وأرز بسمتي فاخر',
    slide3Cta: 'اطلب البقالة الطازجة',

    slide4Badge: 'مخبوزات فرنسية ومطاعم شيف عالمية',
    slide4Title: 'برغر أنغوس مصنوع يدوياً ومعجنات فرنسية',
    slide4Subtitle: 'برغر لحم بقري مدخن، بيتزا نابولية بالحطب، كرواسون وماكرون فاخر',
    slide4Cta: 'تذوق أطباق الشيف',

    // Bento cards & trust badges
    limitedDrops: 'عروض حصرية محدودة',
    closingIn: 'ينتهي خلال',
    curatedDropDiscounts: 'تخفيضات مختارة لك',
    dropSubtitle: 'وفر حتى 45% على معدات التكنولوجيا، الحواسيب والبقالة الطازجة!',
    exploreDrops: 'استكشف العروض الحصرية',
    bespokeMall: 'سوق الماركات الفاخرة متعدد المتاجر',
    authenticGuarantee: 'ضمان منتجات أصلية 100% معتمدة',
    authenticSubtitle: 'متاجر موثقة: ElectroZone و Apex Computers و Metro Fresh وأشهر المطابخ العالمية.',
    easyReturns: 'إرجاع سهل ومضمون خلال 7 أيام',
    viewBoutiques: 'عرض المتاجر والمطاعم ←',
    exploreDepartments: 'استكشف الأقسام الرئيسية',
    endsIn: 'ينتهي في:',
    exploreAllDrops: 'عرض كل التخفيضات ←',
    verifiedBoutiques: 'المتاجر والمطاعم المميزة',
    genuineBrandsSubtitle: 'متاجر ومطاعم وسوبرماركت معتمدة وموثقة 100%',
    verified: 'معتمد وموثق',
    productsCount: 'منتجات',
    visitBoutique: 'زيارة المتجر ←',
    viewingBoutique: 'أنت تتصفح هذا المتجر الآن',
    verifiedMenus: 'قوائم طعام معتمدة',
    upToOff: 'خصم يصل إلى',
    productsInStock: 'منتجات متوفرة بالمخزن',

    // Filter sidebar
    filterCatalog: 'تصفية المنتجات',
    resetAll: 'إعادة ضبط',
    resetAllFilters: 'إعادة ضبط جميع الفلاتر',
    halalCertified: 'ذبح حلال معتمد 100%',
    pureVeg: 'أطباق نباتية طازجة',
    fastPrep: 'تحضير سريع بالمطبخ (أقل من 20 دقيقة)',
    priceRangePkr: 'نطاق السعر (روبية)',
    under1k: 'أقل من 1,000',
    '1kTo3k': '1,000 - 3,000',
    '3kTo10k': '3,000 - 10,000',
    '10kPlus': 'أكثر من 10,000',
    serviceRating: 'الخدمة والتقييم',
    starsAbove: '4.0 نجوم فأكثر',
    onSaleOnly: 'عروض التخفيض فقط',
    freeExpressDelivery: 'توصيل مجاني سريع',
    inStockOnly: 'المتوفر بالمخزن فقط',
    officialWarranty: 'ضمان الوكيل الرسمي المعتمد',
    brands: 'العلامات التجارية',
    searchBrands: 'ابحث في العلامات التجارية...',
    clear: 'مسح',
    clearAll: 'مسح الكل',
    filters: 'الفلاتر',

    // Catalog grid & Sorting
    catalogResults: 'نتائج البحث',
    showing: 'عرض',
    of: 'من أصل',
    sortBy: 'ترتيب حسب:',
    sortRelevance: 'الأكثر صلة',
    sortPriceLow: 'السعر: من الأقل للأعلى',
    sortPriceHigh: 'السعر: من الأعلى للأقل',
    sortRating: 'الأعلى تقييماً',
    sortDiscount: 'أعلى نسبة خصم %',
    sortNewest: 'أحدث المنتجات',
    noProductsFound: 'لم يتم العثور على منتجات',
    noProductsSubtitle: 'لا توجد منتجات تطابق اختياراتك الحالية. جرب إعادة تعيين الفلاتر أو تغيير كلمة البحث.',

    // Product card & modal
    inStock: 'متوفر بالمخزن',
    inStockReady: 'متوفر بالمخزن وجاهز للشحن الفوري',
    freeDelivery: 'توصيل مجاني',
    standardShipping: 'شحن قياسي',
    expressCourier: 'توصيل سريع خلال 30 دقيقة',
    fromRs: 'ابتداءً من',
    addToBasket: 'أضف إلى السلة',
    addToCart: 'أضف إلى السلة',
    buyNow: 'شراء الآن',
    viewDetails: 'عرض التفاصيل',
    officialBoutique: 'متجر معتمد',
    selectOption: 'اختر الصنف / القياس:',
    quantity: 'الكمية:',
    reviews: 'تقييمات العملاء',
    viewFullPage: 'عرض صفحة المنتج الكاملة مع التقييمات والمواصفات ←',

    // AI & WhatsApp
    askAiTitle: '✦ مستشار التسوق بالذكاء الاصطناعي',
    aiAssistantTitle: 'مساعد التسوق بالذكاء الاصطناعي',
    aiSubtitle: 'مساعدك الذكي لاكتشاف المنتجات، اقتراح باقات التوفير وإعداد وجبات الطعام',
    whatsappSupport: 'دعم مباشر عبر واتساب',
    onlineNow: 'متصل الآن',

    // Footer
    expressFastDelivery: 'توصيل فائق السرعة والموثوقية',
    expressFastDeliverySub: 'تتبع مباشر ولحظي مع مناديب توصيل معتمدين',
    genuineBrands: 'ماركات أصلية 100%',
    genuineBrandsSub: 'متاجر وبائعون معتمدون ومرخصون رسمياً',
    easyReturnsSub: 'استرجاع فوري للأموال دون تعقيدات وضمان شامل',
    supportSub: 'محادثة مباشرة وخط مساعدة مخصص على مدار الساعة',
    footerAbout: 'منصتك المتميزة للأجهزة والحواسيب ومستلزمات البقالة الطازجة وأرقى مأكولات الشيف العالمية.',
    quickNav: 'روابط سريعة',
    becomePartner: 'انضم كشريك معنا',
    sellZeroComm: 'بع منتجاتك مع QuickDelivery (0% عمولة)',
    registerDriver: 'سجل كسائق توصيل معتمد',
    customerCare: 'خدمة ودعم العملاء',
    copyright: 'سوق QuickDelivery متعدد المتاجر. منصة سحابية فائقة السرعة.',

    // Cart & Checkout
    orderSummary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    serviceFee: 'رسوم الخدمة',
    deliveryFee: 'رسوم التوصيل',
    totalAmount: 'المبلغ الإجمالي',
    proceedToCheckout: 'متابعة الدفع والطلب',
    cashOnDelivery: 'الدفع عند الاستلام',
    cardPayment: 'بطاقة ائتمان / مدى',
    shippingAddress: 'عنوان التوصيل',
    deliveryNotes: 'ملاحظات التوصيل للسائق',
    phoneNumber: 'رقم الهاتف للتواصل',
    placeOrder: 'تأكيد وإرسال الطلب',
    cartEmpty: 'سلة المشتريات فارغة',
    cartEmptySubtitle: 'يبدو أنك لم تضف أي منتجات إلى سلتك بعد.',
    startShopping: 'ابدأ التسوق الآن',

    // MegaMenu & Categories
    allDepartmentsCollections: 'جميع الأقسام والمجموعات',
    browseCompleteCatalog: 'تصفح تشكيلتنا الكاملة من منتجات المتاجر المعتمدة',
    browseAllCatalog: 'تصفح جميع المنتجات',
    featuredDepartments: 'الأقسام المميزة',
    clickAboveToBrowse: 'اضغط أعلاه لتصفح جميع منتجات',
    subcategories: 'الأقسام الفرعية',

    // Wishlist
    loginRequired: 'تسجيل الدخول مطلوب',
    pleaseLoginWishlist: 'يرجى تسجيل الدخول لعرض قائمة الرغبات الخاصة بك',
    remove: 'إزالة',
    savedForLater: 'تم حفظها لوقت لاحق',
    searchWishlistPlaceholder: 'ابحث في قائمة الرغبات...',
    sortOldest: 'الأقدم أولاً',
    sortName: 'الاسم: أ - ي',
    wishlistEmpty: 'قائمة الرغبات فارغة',
    wishlistEmptySub: 'ابدأ بإضافة المنتجات التي تحبها لتتبعها وشرائها لاحقاً.',
    browseProducts: 'تصفح المنتجات',
    noItemsFound: 'لم يتم العثور على عناصر',
    adjustSearchOrFilters: 'جرب تعديل البحث أو الفلاتر',

    // Profile & Account
    personalInformation: 'المعلومات الشخصية',
    editProfile: 'تعديل الملف الشخصي',
    saving: 'جارٍ الحفظ...',
    save: 'حفظ',
    cancel: 'إلغاء',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    city: 'المدينة',
    state: 'المنطقة / المحافظة',
    zipCode: 'الرمز البريدي',
    dateOfBirth: 'تاريخ الميلاد',
    gender: 'الجنس',
    selectGender: 'اختر الجنس',
    male: 'ذكر',
    female: 'أنثى',
    other: 'أخرى',
    myProfile: 'ملفي الشخصي',
    manageAccountSettings: 'إدارة إعدادات حسابك وتفضيلاتك',
    profile: 'الملف الشخصي',
    security: 'الأمان',
    notifications: 'الإشعارات',
    payment: 'الدفع',
    customer: 'عميل',
    verifiedCustomer: 'عميل موثق',
    unverified: 'غير موثق',
    addressLocationDetails: 'تفاصيل العنوان والموقع',
    accountMetadata: 'بيانات الحساب',

    // Product View & Merchant Details
    officialKitchen: 'مطبخ ومطعم رسمي معتمد',
    officialMerchant: 'متجر معتمد وموثق رسمياً',
    specialty: 'التخصص',
    diningKitchen: 'مأكولات ومطبخ',
    retailBoutique: 'متجر تجزئة',
    kitchenProfile: 'ملف المطبخ',
    storeProfile: 'ملف المتجر',
    chatWithSeller: 'محادثة البائع',
    frequentlyBoughtTogether: 'يتم شراؤها معاً بشكل متكرر:',
    saveRs: 'وفر',
    descriptionFeatures: 'الوصف والمميزات',
    supplierKitchenInfo: 'معلومات المورد والمطبخ',
    specifications: 'المواصفات',
    onlyItemsReady: 'تبقت قطع محدودة فقط جاهزة في المطبخ!',

    // Footer & Links
    customerAccountSignIn: 'حساب العميل وتسجيل الدخول',
    createCustomerAccount: 'إنشاء حساب عميل مجاناً',
    trackActiveOrders: 'تتبع الطلبات النشطة',
    vendorPortal: 'بوابة البائعين والتجار',
    driverPortal: 'تسجيل دخول عمليات المناديب',
    liveDispatchHours: 'ساعات العمل والإرسال: على مدار الساعة طوال أيام الأسبوع',
    footerOrderHelp: 'هل تحتاج مساعدة بطلب قائم؟ يمكنك التتبع المباشر أو التواصل مع الدعم في قسم',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    merchantAgreement: 'اتفاقية التاجر',

    // ── Direct Natural English Phrase Mappings for instant drop-in resolution ──
    'Explore & Home': 'الرئيسية واستكشاف المنتجات',
    'My Orders': 'طلباتي',
    'Favourites': 'المفضلة',
    'Wishlist': 'قائمة الرغبات',
    'Profile Settings': 'إعدادات الحساب',
    'All Collections': 'جميع المجموعات',
    'Flash Drops': 'عروض البرق الحصرية',
    'Mobile & Tech': 'إلكترونيات وهواتف',
    'Computing & Laptops': 'حواسيب ولابتوب',
    'Pantry & Organic': 'بقالة وخضار طازجة',
    'Chef Dining': 'وجبات شيف فاخرة',
    'French Bakery': 'مخبوزات فرنسية',
    'Brand Boutiques': 'المتاجر المعتمدة',
    'Good morning': 'صباح الخير',
    'Good afternoon': 'مساء الخير',
    'Good evening': 'مساء الخير',
    'Deliver to:': 'التوصيل إلى:',
    'Sign In': 'تسجيل الدخول',
    'My Account': 'حسابي',
    'Bag': 'السلة',
    'Cart': 'السلة',
    'Menu ▾': 'القائمة ▾',
    'High-Speed CDN • Multi-Store Ready': 'شبكة CDN فائقة السرعة • دعم المتاجر المتعددة',
    'Curated Multi-Vendor Marketplace': 'سوق متكامل للمتاجر المتعددة',
    'BOUTIQUE MALL': 'سوق الماركات',
    '0% FEE': 'عمولة 0%',
    'PRO': 'احترافي',
    'Filters': 'الفلاتر',
    'Clear All': 'مسح الكل',
    'Clear': 'مسح',
    'In Stock Only': 'المتوفر فقط بالمخزن',
    'Official Brand Warranty': 'ضمان رسمي معتمد',
    'Free Express Delivery': 'توصيل مجاني سريع',
    'On Sale / Flash Drops': 'عروض التخفيض فقط',
    '4.0 Stars & Above': '4.0 نجوم فأكثر',
    'Price Range (PKR)': 'نطاق السعر (روبية)',
    'Service & Rating': 'الخدمة والتقييم',
    'Search brands...': 'ابحث في الماركات...',
    'Under 1k': 'أقل من 1,000',
    '1k - 3k': '1,000 - 3,000',
    '3k - 10k': '3,000 - 10,000',
    '10k+': 'أكثر من 10,000',
    'Halal Certified Only': 'ذبح حلال معتمد فقط',
    'Vegetarian Dishes': 'أطباق نباتية طازجة',
    'Fast Kitchen Prep (< 20m)': 'تحضير سريع بالمطبخ (< 20 دقيقة)',
    'Free Delivery': 'توصيل مجاني',
    'Standard Shipping': 'شحن قياسي',
    'From Rs.': 'ابتداءً من',
    'Add to Basket': 'أضف إلى السلة',
    'View Details': 'عرض التفاصيل',
    'Buy Now': 'شراء الآن',
    'Select Option:': 'اختر الصنف:',
    'Quantity:': 'الكمية:',
    'Reviews': 'تقييمات',
    'In Stock': 'متوفر بالمخزن',
    'Verified': 'معتمد وموثق',
    'Products': 'منتجات',
    'Reset all': 'إعادة ضبط',
    'Reset All Filters': 'إعادة ضبط جميع الفلاتر',
    'Sort:': 'ترتيب حسب:',
    'Relevance': 'الأكثر صلة',
    'Price: Low to High': 'السعر: من الأقل للأعلى',
    'Price: High to Low': 'السعر: من الأعلى للأقل',
    'Highest Rated': 'الأعلى تقييماً',
    'Biggest Discount %': 'أعلى نسبة خصم %',
    'Newest Arrivals': 'أحدث المنتجات',
    'No products found': 'لم يتم العثور على منتجات',
    'Ends in:': 'ينتهي في:',
    'EXPLORE ALL DROPS': 'عرض كل التخفيضات ←',
    'Limited Drops': 'عروض حصرية محدودة',
    'CLOSING IN': 'ينتهي قريباً',
    'Curated Drop Discounts': 'تخفيضات مختارة لك',
    'Explore Drops': 'استكشف العروض',
    '100% Authentic Brand Guarantees': 'ضمان منتجات أصلية 100%',
    '7-Day Easy Returns': 'إرجاع سهل خلال 7 أيام',
    'View Stores & Restaurants →': 'عرض المتاجر والمطاعم ←',
    'Visit Store →': 'زيارة المتجر ←',
    'Viewing Store': 'أنت تتصفح هذا المتجر',
    'Featured Stores & Restaurants': 'المتاجر والمطاعم المميزة',
    '100% verified merchants, restaurants & supermarkets': 'تجار ومطاعم وسوبرماركت معتمدة 100%',
    'Explore Departments': 'استكشف الأقسام الرئيسية',
    'items': 'منتجات',
    'My Basket': 'سلتي',
    'Tap to view bill & checkout': 'اضغط لعرض الفاتورة وإتمام الطلب',
    'Sign In / Register': 'تسجيل الدخول / إنشاء حساب',
    'Express Delivery across Pakistan • Free on orders over Rs. 1,500': 'توصيل سريع لجميع المناطق • شحن مجاني للطلبات فوق 1,500 روبية',
    'View Full Product Page with Reviews & Specifications →': 'عرض صفحة المنتج الكاملة مع التقييمات والمواصفات ←',
    'Order Summary': 'ملخص الطلب',
    'Subtotal': 'المجموع الفرعي',
    'Service Fee': 'رسوم الخدمة',
    'Delivery Fee': 'رسوم التوصيل',
    'Total Amount': 'المبلغ الإجمالي',
    'Proceed to Checkout': 'متابعة الدفع',
    'Cash on Delivery': 'الدفع عند الاستلام',
    'Credit / Debit Card': 'بطاقة ائتمان / مدى',
    'Shipping Address': 'عنوان التوصيل',
    'Delivery Notes': 'ملاحظات التوصيل للسائق',
    'Phone Number': 'رقم الهاتف للتواصل',
    'Place Order': 'تأكيد وإرسال الطلب',
    'Your Cart is Empty': 'سلة المشتريات فارغة',
    'Looks like you haven\'t added anything to your cart yet.': 'يبدو أنك لم تضف أي منتجات إلى سلتك بعد.',
    'Start Shopping': 'ابدأ التسوق الآن',
    'Categories': 'الأقسام والتصنيفات',
    'Personal Information': 'المعلومات الشخصية',
    'Edit Profile': 'تعديل الملف الشخصي',
    'My Profile': 'ملفي الشخصي',
    'Manage your account settings and preferences': 'إدارة إعدادات حسابك وتفضيلاتك',
    'Profile': 'الملف الشخصي',
    'Security': 'الأمان',
    'Notifications': 'الإشعارات',
    'Payment': 'الدفع',
    'First Name': 'الاسم الأول',
    'Last Name': 'اسم العائلة',
    'Email': 'البريد الإلكتروني',
    'Phone': 'رقم الهاتف',
    'Address': 'العنوان',
    'City': 'المدينة',
    'State': 'المنطقة / المحافظة',
    'Zip Code': 'الرمز البريدي',
    'Date of Birth': 'تاريخ الميلاد',
    'Gender': 'الجنس',
    'Save': 'حفظ',
    'Cancel': 'إلغاء',
    'Search wishlist...': 'ابحث في قائمة الرغبات...',
    'Your wishlist is empty': 'قائمة الرغبات فارغة',
    'Start adding products you love to keep track of them and purchase later.': 'ابدأ بإضافة المنتجات التي تحبها لتتبعها وشرائها لاحقاً.',
    'Browse Products': 'تصفح المنتجات',
    'No items found': 'لم يتم العثور على عناصر',
    'Try adjusting your search or filters': 'جرب تعديل البحث أو الفلاتر',
    'Description & Features': 'الوصف والمميزات',
    'Supplier & Kitchen Info': 'معلومات المورد والمطبخ',
    'Specifications': 'المواصفات',
    'Customer Reviews': 'تقييمات العملاء',
    'Frequently Bought Together:': 'يتم شراؤها معاً بشكل متكرر:',
    'Chat with Seller': 'محادثة البائع',
    'Kitchen Profile': 'ملف المطبخ',
    'Store Profile': 'ملف المتجر',
    'Official Restaurant Kitchen': 'مطبخ ومطعم رسمي معتمد',
    'Official Verified Merchant': 'متجر معتمد وموثق رسمياً',
    'Specialty': 'التخصص',
    'Dining & Kitchen': 'مأكولات ومطبخ',
    'Retail Boutique': 'متجر تجزئة',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms of Service': 'شروط الخدمة',
    'Merchant Agreement': 'اتفاقية التاجر',
    'Customer Account & Sign In': 'حساب العميل وتسجيل الدخول',
    'Create Free Customer Account': 'إنشاء حساب عميل مجاناً',
    'Track Active Orders': 'تتبع الطلبات النشطة',
    'Vendor Merchant Portal': 'بوابة البائعين والتجار',
    'Driver Operations Login': 'تسجيل دخول عمليات المناديب',
    'Live Dispatch Hours: 24/7 Nationwide': 'ساعات العمل والإرسال: على مدار الساعة طوال أيام الأسبوع',
  },

  fr: {
    // Top utility ribbon
    deliverTo: 'Livrer à :',
    allRegions: 'Pakistan (Toutes régions)',
    liveStatus: 'Vérifié en direct Storefront Cloud',
    partnerWithUs: 'Devenir Partenaire',
    zeroFee: '0% FRAIS',
    trackOrder: 'Suivre Commande',
    support247: 'Support 24/7',
    expressNotice: 'Livraison express • Gratuite dès 1 500 Rs',

    // Header & Search
    allCollections: 'Toutes les collections',
    searchPlaceholder: 'Recherchez parmi 161+ produits high-tech, épicerie, plats gourmet…',
    signIn: 'Connexion',
    myAccount: 'Mon Compte',
    bag: 'Panier',

    // Department pills
    deptAll: '✦ Collections',
    deptDrops: '⚡ Ventes Flash',
    deptMobile: '📱 High-Tech & Mobile',
    deptComputers: '💻 PC & Ordinateurs',
    deptGrocery: '🛒 Épicerie & Bio',
    deptDining: '🍔 Plats Gastronomiques',
    deptBakery: '🥐 Boulangerie Française',
    deptBoutiques: '🏬 Boutiques Officielles',

    // Hero slides
    slide1Badge: 'TECH & MOBILITÉ NOUVELLE GÉNÉRATION',
    slide1Title: 'Équipez-vous en Accessoires Mobiles Officiels',
    slide1Subtitle: 'Chargeurs GaN 100W, câbles Type-C tressés, écouteurs antibruit & bracelets connectés',
    slide1Cta: 'Explorer la Tech',

    slide2Badge: 'STATIONS PRO & GAMING',
    slide2Title: 'Libérez la Puissance du Gaming & PC',
    slide2Subtitle: 'Laptops Core i7/Ryzen, claviers mécaniques RGB, SSD NVMe ultra-rapides & souris pro',
    slide2Cta: 'Voir les PC',

    slide3Badge: 'DIRECT PRODUCTEURS & BIO',
    slide3Title: 'Vos Produits Frais du Quotidien à Prix Juste',
    slide3Subtitle: 'Fruits & légumes bio, produits laitiers, huiles pressées à froid & riz basmati fin',
    slide3Cta: 'Commander Épicerie',

    slide4Badge: 'PÂTISSERIE ARTISANALE & BISTRONOMIE',
    slide4Title: 'Burgers Pur Bœuf Angus & Pâtisseries Fines',
    slide4Subtitle: 'Burgers gourmet smashés, pizzas napolitaines au feu de bois, viennoiseries & macarons',
    slide4Cta: 'Déguster Gourmet',

    // Bento cards
    limitedDrops: 'Ventes Limitées',
    closingIn: 'SE TERMINE DANS',
    curatedDropDiscounts: 'Remises Exclusives',
    dropSubtitle: 'Jusqu’à 45% d’économies sur la tech, le PC et l’épicerie !',
    exploreDrops: 'Voir les Ventes',
    bespokeMall: 'Mall Multi-Vendeurs d’Élite',
    authenticGuarantee: 'Garantie 100% Produits Authentiques',
    authenticSubtitle: 'Boutiques vérifiées : ElectroZone, Apex Computers, Metro Fresh et chefs traiteurs.',
    easyReturns: 'Retours Faciles sous 7 Jours',
    viewBoutiques: 'Voir Boutiques →',

    // Departments section
    exploreDepartments: 'Explorer les Rayons',
    items: 'articles',

    // Flash sale
    flashDrops: 'VENTES FLASH',
    endsIn: 'Expire dans :',
    exploreAllDrops: 'TOUTES LES OFFRES',

    // Boutiques section
    verifiedBoutiques: 'Commerces & Restaurants Partenaires',
    genuineBrandsSubtitle: 'Commerçants, restaurants et supermarchés 100% vérifiés',
    verified: 'Vérifié',
    productsCount: 'Produits',
    visitBoutique: 'Visiter le commerce →',
    viewingBoutique: 'Commerce actif',

    // Filter sidebar
    filterCatalog: 'Filtrer le Catalogue',
    resetAll: 'Réinitialiser',
    departments: 'Rayons',
    allDepartments: 'Tous les rayons',
    officialBoutiques: 'Commerces & Restaurants Partenaires',
    priceRangePkr: 'Prix (PKR)',
    serviceRating: 'Services & Notes',
    starsAbove: '4.0 étoiles & plus',
    onSaleOnly: 'En promotion uniquement',
    freeExpressDelivery: 'Livraison Express Gratuite',

    // Catalog grid
    catalogResults: 'Résultats Catalogue',
    showing: 'Affichage de',
    of: 'sur',
    sortBy: 'Trier par :',
    sortRelevance: 'Pertinence',
    sortPriceLow: 'Prix : Croissant',
    sortPriceHigh: 'Prix : Décroissant',
    sortRating: 'Meilleures Notes',
    sortNewest: 'Nouveautés',
    noProductsFound: 'Aucun produit trouvé',
    noProductsSubtitle: 'Aucun article ne correspond à vos filtres actuels. Essayez de réinitialiser.',

    // Product card & modal
    inStock: 'En Stock',
    freeDelivery: 'Livraison Gratuite',
    standardShipping: 'Livraison Standard',
    addToBasket: 'Ajouter au Panier',
    buyNow: 'Acheter Maintenant',
    selectOption: 'Sélectionner l’Option :',
    quantity: 'Quantité :',
    reviews: 'Avis',

    // AI & WhatsApp
    askAi: '✦ Concierge IA Shopping',
    aiAssistantTitle: 'Assistant Shopping Intelligent',
    aiSubtitle: 'Votre expert IA pour découvrir des pépites, créer des packs & composer vos repas',
    whatsappSupport: 'Support WhatsApp Direct',
    onlineNow: 'En Ligne',

    // Footer
    expressFastDelivery: 'Livraison Express & Précise',
    expressFastDeliverySub: 'Suivi de commande en temps réel avec livreurs agréés',
    genuineBrands: '100% Marques Authentiques',
    genuineBrandsSub: 'Boutiques certifiées & commerçants vérifiés',
    easyReturnsSub: 'Remboursements rapides et garantis',
    supportSub: 'Assistance dédiée et chat direct 24/7',
    footerAbout: 'Votre place de marché sur-mesure pour ordinateurs, accessoires mobiles, produits frais et délices de chefs.',
    quickNav: 'Navigation Rapide',
    becomePartner: 'Rejoignez-nous',
    sellZeroComm: 'Vendez sur QuickDelivery (0% Comm)',
    registerDriver: 'Devenir Livreur Partenaire',
    customerCare: 'Service Client',
    copyright: 'QuickDelivery Multi-Vendor Marketplace. Plateforme Cloud Haute Vitesse.',
  },

  it: {
    // Top utility ribbon
    deliverTo: 'Consegna a:',
    allRegions: 'Pakistan (Tutte le regioni)',
    liveStatus: 'Verificato in tempo reale Cloud Storefront',
    partnerWithUs: 'Diventa Partner',
    zeroFee: '0% COMMISSIONI',
    trackOrder: 'Traccia Ordine',
    support247: 'Supporto 24/7',
    expressNotice: 'Consegna rapida espressa • Gratuita per ordini sopra 1.500 Rs',

    // Header & Search
    allCollections: 'Tutte le collezioni',
    searchPlaceholder: 'Cerca tra 161+ prodotti hi-tech, computer, alimentari, piatti chef…',
    signIn: 'Accedi',
    myAccount: 'Il Mio Account',
    bag: 'Carrello',

    // Department pills
    deptAll: '✦ Collezioni',
    deptDrops: '⚡ Offerte Lampo',
    deptMobile: '📱 Hi-Tech & Mobile',
    deptComputers: '💻 Computer & Laptop',
    deptGrocery: '🛒 Spesa & Bio',
    deptDining: '🍔 Ristorazione Chef',
    deptBakery: '🥐 Pasticceria & Forno',
    deptBoutiques: '🏬 Boutique di Marca',

    // Hero slides
    slide1Badge: 'TECNOLOGIA & MOBILITÀ NEXT-GEN',
    slide1Title: 'Potenzia i Tuoi Dispositivi con Accessori Ufficiali',
    slide1Subtitle: 'Caricatori veloci GaN 100W, cavi Type-C rinforzati, auricolari ANC & cinturini smartwatch',
    slide1Cta: 'Scopri Mobile Tech',

    slide2Badge: 'WORKSTATION PRO & GAMING',
    slide2Title: 'Scatena le Prestazioni di Calcolo & Gaming',
    slide2Subtitle: 'Laptop Core i7/Ryzen, tastiere meccaniche RGB, SSD NVMe velocissimi & mouse di precisione',
    slide2Cta: 'Esplora Computer',

    slide3Badge: 'DIRETTAMENTE DALLA CAMPAGNA',
    slide3Title: 'La Spesa Fresca di Ogni Giorno a Prezzi Giusti',
    slide3Subtitle: 'Ortofrutta biologica fresca, latticini essenziali, oli spremuti a freddo & riso basmati',
    slide3Cta: 'Ordina la Spesa',

    slide4Badge: 'PASTICCERIA ARTIGIANALE & CUCINA D’AUTORE',
    slide4Title: 'Burger Artigianali Angus & Pasticceria Francese',
    slide4Subtitle: 'Doppio smash burger di manzo, pizza napoletana a legna, fragranti croissant & macarons',
    slide4Cta: 'Gusta Gourmet',

    // Bento cards
    limitedDrops: 'Offerte Limitate',
    closingIn: 'TERMINA TRA',
    curatedDropDiscounts: 'Sconti Esclusivi Selezionati',
    dropSubtitle: 'Risparmia fino al 45% su tecnologia, postazioni e generi alimentari!',
    exploreDrops: 'Vedi Offerte',
    bespokeMall: 'Centro Commerciale Multi-Vendor d’Élite',
    authenticGuarantee: '100% Prodotti Originali Garantiti',
    authenticSubtitle: 'Boutique verificate: ElectroZone, Apex Computers, Metro Fresh e cucine gourmet.',
    easyReturns: 'Reso Facile entro 7 Giorni',
    viewBoutiques: 'Vedi Boutique →',

    // Departments section
    exploreDepartments: 'Esplora Reparti',
    items: 'articoli',

    // Flash sale
    flashDrops: 'OFFERTE LAMPO',
    endsIn: 'Scade tra:',
    exploreAllDrops: 'TUTTE LE OFFERTE',

    // Boutiques section
    verifiedBoutiques: 'Negozi e Ristoranti in Evidenza',
    genuineBrandsSubtitle: '100% commercianti, ristoranti e supermercati verificati',
    verified: 'Verificato',
    productsCount: 'Prodotti',
    visitBoutique: 'Visita negozio →',
    viewingBoutique: 'Negozio attivo',

    // Filter sidebar
    filterCatalog: 'Filtra Catalogo',
    resetAll: 'Reimposta',
    departments: 'Reparti',
    allDepartments: 'Tutti i reparti',
    officialBoutiques: 'Negozi e Ristoranti in Evidenza',
    priceRangePkr: 'Prezzo (PKR)',
    serviceRating: 'Servizi & Valutazioni',
    starsAbove: 'Da 4.0 Stelle in su',
    onSaleOnly: 'Solo in promozione',
    freeExpressDelivery: 'Consegna Express Gratuita',

    // Catalog grid
    catalogResults: 'Risultati Catalogo',
    showing: 'Mostrati',
    of: 'di',
    sortBy: 'Ordina per:',
    sortRelevance: 'Rilevanza',
    sortPriceLow: 'Prezzo: Crescente',
    sortPriceHigh: 'Prezzo: Decrescente',
    sortRating: 'Miglior Punteggio',
    sortNewest: 'Più Recenti',
    noProductsFound: 'Nessun prodotto trovato',
    noProductsSubtitle: 'Nessun articolo corrisponde ai tuoi filtri. Prova a reimpostarli.',

    // Product card & modal
    inStock: 'Disponibile',
    freeDelivery: 'Consegna Gratuita',
    standardShipping: 'Spedizione Standard',
    addToBasket: 'Aggiungi al Carrello',
    buyNow: 'Compra Ora',
    selectOption: 'Scegli Opzione:',
    quantity: 'Quantità:',
    reviews: 'Recensioni',

    // AI & WhatsApp
    askAi: '✦ Concierge IA',
    aiAssistantTitle: 'Assistente Shopping Intelligente',
    aiSubtitle: 'Il tuo assistente IA per consigliare prodotti, creare kit ricetta e pacchetti risparmio',
    whatsappSupport: 'Assistenza WhatsApp Live',
    onlineNow: 'Online Ora',

    // Footer
    expressFastDelivery: 'Consegna Espressa Garantita',
    expressFastDeliverySub: 'Tracciamento ordini dal vivo con corrieri verificati',
    genuineBrands: '100% Brand Autentici',
    genuineBrandsSub: 'Negozi ufficiali e rivenditori autorizzati',
    easyReturnsSub: 'Rimborsi senza pensieri e garanzia totale',
    supportSub: 'Chat dal vivo e assistenza clienti 24/7',
    footerAbout: 'Il tuo marketplace esclusivo per computer, accessori mobile, spesa biologica e cucina raffinata.',
    quickNav: 'Navigazione Rapida',
    becomePartner: 'Diventa Partner',
    sellZeroComm: 'Vendi su QuickDelivery (0% Comm)',
    registerDriver: 'Diventa Corriere Partner',
    customerCare: 'Servizio Clienti',
    copyright: 'QuickDelivery Multi-Vendor Marketplace. Piattaforma Cloud ad Alta Velocità.',
  },
}

// Add normalized alias so 'sa' or 'SA' points directly to Arabic translations
translations.sa = translations.ar

export const LANGUAGES = [
  { code: 'en', name: 'English', label: 'English (UK)', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'العربية', label: 'العربية (SA)', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'Français', label: 'Français (FR)', flag: '🇫🇷', dir: 'ltr' },
  { code: 'it', name: 'Italiano', label: 'Italiano (IT)', flag: '🇮🇹', dir: 'ltr' },
]

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isRTL: false,
  availableLanguages: LANGUAGES,
})

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('qd_preferred_lang')
    if (saved) {
      const lower = saved.toLowerCase()
      const target = (lower === 'sa' || lower === 'ar') ? 'ar' : lower
      if (translations[target]) {
        setLanguageState(target)
      }
    }
  }, [])

  useEffect(() => {
    const isRtl = language === 'ar' || language === 'sa'
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
      document.documentElement.lang = isRtl ? 'ar' : language
    }
  }, [language])

  const setLanguage = (langCode) => {
    const raw = String(langCode || '').trim()
    const lower = raw.toLowerCase()
    const target = (lower === 'sa' || lower === 'ar') ? 'ar' : lower
    if (translations[target]) {
      setLanguageState(target)
      localStorage.setItem('qd_preferred_lang', target)
    }
  }

  const t = (key) => {
    if (key === null || key === undefined) return ''
    const strKey = String(key)
    const currentDict = translations[language] || translations.en
    if (currentDict && currentDict[strKey] !== undefined) {
      return currentDict[strKey]
    }
    const trimmed = strKey.trim()
    if (currentDict && currentDict[trimmed] !== undefined) {
      return currentDict[trimmed]
    }
    // Also try case-insensitive key search if needed
    if (currentDict) {
      const lower = trimmed.toLowerCase()
      for (const [k, v] of Object.entries(currentDict)) {
        if (k.toLowerCase() === lower) return v
      }
    }
    return translations.en[strKey] ?? translations.en[trimmed] ?? strKey
  }

  const isRTL = language === 'ar' || language === 'sa'

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        availableLanguages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
