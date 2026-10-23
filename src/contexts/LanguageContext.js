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
  },

  ar: {
    // Top utility ribbon
    deliverTo: 'التوصيل إلى:',
    allRegions: 'باكستان (جميع المناطق)',
    liveStatus: 'معتمد وموثق سحابياً بأعلى سرعة',
    partnerWithUs: 'انضم كشريك',
    zeroFee: 'عمولة 0%',
    trackOrder: 'تتبع الطلب',
    support247: 'دعم 24/7',
    expressNotice: 'توصيل سريع لجميع المناطق • شحن مجاني للطلبات فوق 1,500 روبية',

    // Header & Search
    allCollections: 'جميع المجموعات',
    searchPlaceholder: 'ابحث في أكثر من 161 منتجاً من التكنولوجيا والأجهزة والبقالة والمطاعم…',
    signIn: 'تسجيل الدخول',
    myAccount: 'حسابي',
    bag: 'السلة',

    // Department pills
    deptAll: '✦ كل المجموعات',
    deptDrops: '⚡ عروض البرق',
    deptMobile: '📱 إلكترونيات وهواتف',
    deptComputers: '💻 حواسيب ولابتوب',
    deptGrocery: '🛒 بقالة وخضار طازجة',
    deptDining: '🍔 وجبات شيف فاخرة',
    deptBakery: '🥐 مخبوزات فرنسية',
    deptBoutiques: '🏬 المتاجر المعتمدة',

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
    slide3Cta: 'اطلب البقالة',

    slide4Badge: 'مخبوزات فرنسية ومطاعم شيف عالمية',
    slide4Title: 'برغر أنغوس مصنوع يدوياً ومعجنات فرنسية',
    slide4Subtitle: 'برغر لحم بقري مدخن، بيتزا نابولية بالحطب، كرواسون وماكرون فاخر',
    slide4Cta: 'تذوق الأطباق',

    // Bento cards
    limitedDrops: 'عروض حصرية محدودة',
    closingIn: 'ينتهي خلال',
    curatedDropDiscounts: 'تخفيضات مختارة لك',
    dropSubtitle: 'وفر حتى 45% على معدات التكنولوجيا، الحواسيب والبقالة!',
    exploreDrops: 'استكشف العروض',
    bespokeMall: 'سوق الماركات الفاخرة متعدد المتاجر',
    authenticGuarantee: 'ضمان أصلي 100% معتمد',
    authenticSubtitle: 'متاجر موثقة: ElectroZone و Apex Computers و Metro Fresh وأشهر المطابخ.',
    easyReturns: 'إرجاع سهل خلال 7 أيام',
    viewBoutiques: 'عرض المتاجر ←',

    // Departments section
    exploreDepartments: 'استكشف الأقسام',
    items: 'منتج',

    // Flash sale
    flashDrops: 'عروض البرق الحصرية',
    endsIn: 'ينتهي في:',
    exploreAllDrops: 'عرض كل التخفيضات',

    // Boutiques section
    verifiedBoutiques: 'المتاجر والمطاعم المميزة',
    genuineBrandsSubtitle: 'متاجر ومطاعم وسوبرماركت معتمدة 100%',
    verified: 'معتمد',
    productsCount: 'منتجات',
    visitBoutique: 'زيارة المتجر ←',
    viewingBoutique: 'أنت تتصفح المتجر',

    // Filter sidebar
    filterCatalog: 'تصفية المنتجات',
    resetAll: 'إعادة ضبط',
    departments: 'الأقسام',
    allDepartments: 'جميع الأقسام',
    officialBoutiques: 'المتاجر والمطاعم المميزة',
    priceRangePkr: 'نطاق السعر (روبية)',
    serviceRating: 'الخدمة والتقييم',
    starsAbove: '4.0 نجوم فأكثر',
    onSaleOnly: 'عروض التخفيض فقط',
    freeExpressDelivery: 'توصيل مجاني سريع',

    // Catalog grid
    catalogResults: 'نتائج البحث',
    showing: 'عرض',
    of: 'من أصل',
    sortBy: 'ترتيب حسب:',
    sortRelevance: 'الأكثر صلة',
    sortPriceLow: 'السعر: من الأقل للأعلى',
    sortPriceHigh: 'السعر: من الأعلى للأقل',
    sortRating: 'الأعلى تقييماً',
    sortNewest: 'أحدث المنتجات',
    noProductsFound: 'لم يتم العثور على منتجات',
    noProductsSubtitle: 'لا توجد منتجات تطابق اختياراتك الحالية. جرب إعادة تعيين الفلاتر.',

    // Product card & modal
    inStock: 'متوفر بالمخزن',
    freeDelivery: 'شحن مجاني',
    standardShipping: 'شحن قياسي',
    addToBasket: 'أضف إلى السلة',
    buyNow: 'اشتري الآن',
    selectOption: 'اختر الصنف:',
    quantity: 'الكمية:',
    reviews: 'تقييمات',

    // AI & WhatsApp
    askAi: '✦ مستشار الذكاء الاصطناعي',
    aiAssistantTitle: 'مساعد التسوق بالذكاء الاصطناعي',
    aiSubtitle: 'مساعدك الذكي لاكتشاف المنتجات، اقتراح باقات التوفير وإعداد وجبات الطعام',
    whatsappSupport: 'دعم مباشر عبر واتساب',
    onlineNow: 'متصل الآن',

    // Footer
    expressFastDelivery: 'توصيل فائق السرعة',
    expressFastDeliverySub: 'تتبع حي ومباشر مع مناديب توصيل معتمدين',
    genuineBrands: 'ماركات أصلية 100%',
    genuineBrandsSub: 'متاجر وبائعون معتمدون ومرخصون',
    easyReturnsSub: 'استرجاع فوري للأموال دون تعقيدات',
    supportSub: 'محادثة مباشرة وخط مساعدة مخصص',
    footerAbout: 'منصتك المتميزة للأجهزة والحواسيب ومستلزمات البقالة الطازجة وأرقى المأكولات.',
    quickNav: 'روابط سريعة',
    becomePartner: 'انضم كشريك معنا',
    sellZeroComm: 'بع منتجاتك مع QuickDelivery (0% عمولة)',
    registerDriver: 'سجل كسائق توصيل',
    customerCare: 'خدمة العملاء',
    copyright: 'سوق QuickDelivery متعدد المتاجر. منصة سحابية فائقة السرعة.',
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

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
]

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isRTL: false,
})

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('qd_preferred_lang')
    if (saved && translations[saved]) {
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => {
    const isRtl = language === 'ar'
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    }
  }, [language])

  const setLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode)
      localStorage.setItem('qd_preferred_lang', langCode)
    }
  }

  const t = (key) => {
    const currentDict = translations[language] || translations.en
    return currentDict[key] ?? translations.en[key] ?? key
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL: language === 'ar',
        availableLanguages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
