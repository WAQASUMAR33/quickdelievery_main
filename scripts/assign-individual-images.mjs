import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { uploadBufferToS3 } from '../src/lib/s3.js'

const prisma = new PrismaClient()

// Distinct high-resolution product photos matching each specific item
const PRODUCT_IMAGE_MAP = {
  // Food & Dining / Bakery
  'BURGER-CLASSIC-02': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=80',

  // Mobile Accessories (52 unique items)
  'MOB-ACC-001': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700&q=80', // Anker Power Bank
  'MOB-ACC-002': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=700&q=80', // MagSafe Charger
  'MOB-ACC-003': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700&q=80', // Wall Adapter
  'MOB-ACC-004': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&q=80', // Sony WF-1000XM5 Earbuds
  'MOB-ACC-005': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&q=80', // Braided USB-C Cable
  'MOB-ACC-006': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=700&q=80', // Phone Protective Case
  'MOB-ACC-007': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=700&q=80', // Car Mount
  'MOB-ACC-008': 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=700&q=80', // Dual Drive Flash USB
  'MOB-ACC-009': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&q=80', // Portable Speaker
  'MOB-ACC-010': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=700&q=80', // Fast GaN Charger
  'MOB-ACC-011': 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=700&q=80', // 100W Right Angle Cable
  'MOB-ACC-012': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&q=80', // Slim Phone Case
  'MOB-ACC-013': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=700&q=80', // 3-in-1 Charging Stand
  'MOB-ACC-014': 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&q=80', // Sound Isolating Earphones
  'MOB-ACC-015': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&q=80', // MagSafe Grip & Wallet
  'MOB-ACC-016': 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=700&q=80', // Gimbal Stabilizer
  'MOB-ACC-017': 'https://images.unsplash.com/photo-1590658006821-04f4008d5717?w=700&q=80', // Compact Microphone
  'MOB-ACC-018': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700&q=80', // 140W GaN Charger
  'MOB-ACC-019': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=80', // Laptop / Tablet Sleeve
  'MOB-ACC-020': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700&q=80', // Bluetooth Tracker
  'MOB-ACC-021': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&q=80', // Tempered Glass Screen
  'MOB-ACC-022': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700&q=80', // Magnetic Battery Pack
  'MOB-ACC-023': 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=700&q=80', // Belkin SoundForm Earbuds
  'MOB-ACC-024': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&q=80', // Heavy Duty 240W Cable
  'MOB-ACC-025': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=700&q=80', // Fast Wireless Pad
  'MOB-ACC-026': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&q=80', // Canvas Everyday Case
  'MOB-ACC-027': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=700&q=80', // Extendo Dash Mount
  'MOB-ACC-028': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80', // Beats Studio Buds
  'MOB-ACC-029': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700&q=80', // Anker 737 Power Bank
  'MOB-ACC-030': 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=700&q=80', // Samsung SmartTag2
  'MOB-ACC-031': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&q=80', // Leather Phone Case
  'MOB-ACC-032': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700&q=80', // Dual USB Car Charger
  'MOB-ACC-033': 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=700&q=80', // Smartphone Tripod Stand
  'MOB-ACC-034': 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=700&q=80', // Mobile Gaming Controller
  'MOB-ACC-035': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&q=80', // Magnetic Aluminum Wallet
  'MOB-ACC-036': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&q=80', // Aramid Fiber Case
  'MOB-ACC-037': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&q=80', // Soundcore Space Earbuds
  'MOB-ACC-038': 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=700&q=80', // JLab True Wireless
  'MOB-ACC-039': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700&q=80', // Blade Slim Power Bank
  'MOB-ACC-040': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&q=80', // ANC Over-Ear Headphones
  'MOB-ACC-041': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700&q=80', // Cyberpunk Transparent Powerbank
  'MOB-ACC-042': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=700&q=80', // MagSafe Tilt Stand
  'MOB-ACC-043': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&q=80', // Leather Card Pocket
  'MOB-ACC-044': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&q=80', // Lightning Cable MFi
  'MOB-ACC-045': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=700&q=80', // Heavy Duty Rugged Case
  'MOB-ACC-046': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=700&q=80', // 3-in-1 Charging Dock
  'MOB-ACC-047': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=700&q=80', // Steelie Magnetic Mount
  'MOB-ACC-048': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=700&q=80', // Monarch Rugged Armor Case
  'MOB-ACC-049': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&q=80', // Marshall Rock Earbuds
  'MOB-ACC-050': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=700&q=80', // Gym Fitness Phone Mount
  'MOB-ACC-051': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700&q=80', // Kickstand Magnetic Powerbank
  'MOB-ACC-052': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // USB-C Multiport Hub

  // Computer & Laptops (52 unique items)
  'COMP-LAP-001': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&q=80', // MacBook Air M3
  'COMP-LAP-002': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=700&q=80', // Dell XPS 13
  'COMP-LAP-003': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=700&q=80', // ThinkPad X1 Carbon
  'COMP-LAP-004': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=700&q=80', // ASUS ROG Gaming Laptop
  'COMP-LAP-005': 'https://images.unsplash.com/photo-1544731612-de2f9602c817?w=700&q=80', // HP Spectre Touchscreen
  'COMP-LAP-006': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=700&q=80', // Logitech MX Master 3S
  'COMP-LAP-007': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Keychron Custom Keyboard
  'COMP-LAP-008': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&q=80', // 4K UHD Gaming Monitor
  'COMP-LAP-009': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=700&q=80', // Samsung T7 Rugged SSD
  'COMP-LAP-010': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // Thunderbolt Docking Station
  'COMP-LAP-011': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&q=80', // Corsair DDR5 RAM Kit
  'COMP-LAP-012': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Logitech MX Keys
  'COMP-LAP-013': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=80', // Razer DeathAdder Mouse
  'COMP-LAP-014': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&q=80', // Dell UltraSharp Monitor
  'COMP-LAP-015': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=700&q=80', // WD Black NVMe SSD
  'COMP-LAP-016': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&q=80', // SteelSeries Headset
  'COMP-LAP-017': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=700&q=80', // Stream Deck Controller
  'COMP-LAP-018': 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=700&q=80', // 4K Webcam
  'COMP-LAP-019': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // 12-in-1 Triple Display Hub
  'COMP-LAP-020': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=80', // Ergonomic Laptop Stand
  'COMP-LAP-021': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=700&q=80', // Crucial Gen4 NVMe SSD
  'COMP-LAP-022': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Razer BlackWidow Keyboard
  'COMP-LAP-023': 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=700&q=80', // Monitor Light Bar
  'COMP-LAP-024': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80', // Audio-Technica Studio Monitor
  'COMP-LAP-025': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&q=80', // Kingston Fury RAM
  'COMP-LAP-026': 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=700&q=80', // Seagate 4TB External Drive
  'COMP-LAP-027': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=80', // Apple Magic Trackpad
  'COMP-LAP-028': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=700&q=80', // Logitech G PRO X Superlight
  'COMP-LAP-029': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&q=80', // OLED Gaming Monitor
  'COMP-LAP-030': 'https://images.unsplash.com/photo-1590658006821-04f4008d5717?w=700&q=80', // Studio Microphone with Boom
  'COMP-LAP-031': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&q=80', // HyperX Wireless Headset
  'COMP-LAP-032': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // 9-in-1 USB-C Hub
  'COMP-LAP-033': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=80', // Swivel Aluminum Stand
  'COMP-LAP-034': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=700&q=80', // Samsung 990 PRO 4TB
  'COMP-LAP-035': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Gasket Mechanical Keyboard
  'COMP-LAP-036': 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=700&q=80', // Elgato Facecam
  'COMP-LAP-037': 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=700&q=80', // LaCie Rugged Mini Drive
  'COMP-LAP-038': 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=700&q=80', // Wacom Drawing Tablet
  'COMP-LAP-039': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // Thunderbolt 3 Elite Dock
  'COMP-LAP-040': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&q=80', // Liquid CPU Cooler
  'COMP-LAP-041': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Ducky Mechanical Keyboard
  'COMP-LAP-042': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Split Ergonomic Keyboard
  'COMP-LAP-043': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=80', // Razer Viper V3 Mouse
  'COMP-LAP-044': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&q=80', // ColorPro 27-inch Monitor
  'COMP-LAP-045': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Magnetic Corsair Keyboard
  'COMP-LAP-046': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // Belkin Triple Dock
  'COMP-LAP-047': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&q=80', // Sennheiser Reference Headset
  'COMP-LAP-048': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Logitech G915 Keyboard
  'COMP-LAP-049': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=700&q=80', // WiFi 6E Router
  'COMP-LAP-050': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=700&q=80', // Sabrent Rocket SSD
  'COMP-LAP-051': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=80', // Laptop Cooling Pad
  'COMP-LAP-052': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Apple Magic Keyboard

  // Supermarket Groceries (52 unique items)
  'GROC-PAN-001': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&q=80', // Extra Virgin Olive Oil
  'GROC-PAN-002': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=700&q=80', // Spaghetti Pasta
  'GROC-PAN-003': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=700&q=80', // Whole Organic Milk
  'GROC-PAN-004': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&q=80', // English Breakfast Tea
  'GROC-PAN-005': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=700&q=80', // Whole Bean Coffee
  'GROC-PAN-006': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=700&q=80', // Blueberry Preserves Jam
  'GROC-PAN-007': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=80', // Rolled Oats Whole Grain
  'GROC-PAN-008': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80', // Pure Maple Syrup
  'GROC-PAN-009': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=700&q=80', // Canned Chopped Tomatoes
  'GROC-PAN-010': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=700&q=80', // Penne Rigate Pasta
  'GROC-PAN-011': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=80', // Basmati Rice
  'GROC-PAN-012': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=700&q=80', // Salted Irish Butter
  'GROC-PAN-013': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=700&q=80', // Sea Salt Flakes
  'GROC-PAN-014': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=700&q=80', // Barista Almond Milk
  'GROC-PAN-015': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=700&q=80', // Nutella Hazelnut Spread
  'GROC-PAN-016': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80', // Dijon Mustard Jar
  'GROC-PAN-017': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&q=80', // White Truffle Olive Oil
  'GROC-PAN-018': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80', // Brewed Soy Sauce
  'GROC-PAN-019': 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=700&q=80', // Sparkling Mineral Water
  'GROC-PAN-020': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=700&q=80', // Gluten-Free Rigatoni
  'GROC-PAN-021': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=700&q=80', // Crunchy Granola Bars
  'GROC-PAN-022': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80', // Heinz Tomato Ketchup
  'GROC-PAN-023': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=700&q=80', // Crunchy Peanut Butter
  'GROC-PAN-024': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=700&q=80', // Biscoff Spread
  'GROC-PAN-025': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&q=80', // 85% Dark Chocolate
  'GROC-PAN-026': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&q=80', // Sautéing Olive Oil
  'GROC-PAN-027': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=700&q=80', // Greek Yogurt Tub
  'GROC-PAN-028': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=700&q=80', // Cranberry Juice
  'GROC-PAN-029': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&q=80', // Lemon Lime Bitters
  'GROC-PAN-030': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=700&q=80', // Tim Tam Biscuits
  'GROC-PAN-031': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=80', // Quick Oatmeal Carton
  'GROC-PAN-032': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=700&q=80', // Black Pepper Grinder
  'GROC-PAN-033': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&q=80', // Blood Orange Soda
  'GROC-PAN-034': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=700&q=80', // Cream Cheese Block
  'GROC-PAN-035': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=700&q=80', // Natural Cheddar Block
  'GROC-PAN-036': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=700&q=80', // Australian Apple Juice
  'GROC-PAN-037': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80', // Real Mayonnaise
  'GROC-PAN-038': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=700&q=80', // Fresh Basil Pesto
  'GROC-PAN-039': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&q=80', // Dairy Milk Chocolate Block
  'GROC-PAN-040': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=80', // Weet-Bix Cereal
  'GROC-PAN-041': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=700&q=80', // Ground Espresso Coffee
  'GROC-PAN-042': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&q=80', // Free Range Chicken Broth
  'GROC-PAN-043': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=700&q=80', // Moroccan Spice Seasoning
  'GROC-PAN-044': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=700&q=80', // Sweet Chilli Potato Chips
  'GROC-PAN-045': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=700&q=80', // Pure Australian Honey
  'GROC-PAN-046': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&q=80', // Dry Ginger Ale
  'GROC-PAN-047': 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=700&q=80', // Tuna in Italian Olive Oil
  'GROC-PAN-048': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=80', // Couscous Fluffy Grains
  'GROC-PAN-049': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80', // Tabasco Pepper Hot Sauce
  'GROC-PAN-050': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=700&q=80', // Full Cream Milk
  'GROC-PAN-051': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&q=80', // Peppermint Herbal Tea
  'GROC-PAN-052': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=700&q=80', // Raw Natural Almonds
}

async function run() {
  console.log('========================================================================')
  console.log('🔄 ASSIGNING UNIQUE, ACCURATE INDIVIDUAL PRODUCT IMAGES VIA AMAZON S3')
  console.log('========================================================================\n')

  const skus = Object.keys(PRODUCT_IMAGE_MAP)
  console.log(`Processing ${skus.length} individual products...`)

  let successCount = 0
  let errorCount = 0

  // Process in small batches of 6 for high speed and reliable network streaming
  const batchSize = 6
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (sku) => {
        const sourceUrl = PRODUCT_IMAGE_MAP[sku]
        try {
          // 1. Download source image buffer
          const res = await fetch(sourceUrl)
          if (!res.ok) {
            throw new Error(`Failed to download ${sourceUrl}: HTTP ${res.status}`)
          }
          const arrayBuffer = await res.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // 2. Upload to Amazon S3 bucket with product SKU filename
          const s3Filename = `${sku.toLowerCase()}.jpg`
          const uploadResult = await uploadBufferToS3(buffer, {
            fileName: s3Filename,
            contentType: 'image/jpeg',
            folder: 'products',
          })

          // 3. Update database record in Amazon RDS
          await prisma.product.update({
            where: { sku },
            data: {
              proImages: JSON.stringify([uploadResult.url]),
            },
          })

          successCount++
          process.stdout.write(`✅ [${successCount}/${skus.length}] ${sku} -> S3 CloudFront URL updated\n`)
        } catch (err) {
          errorCount++
          console.error(`❌ [${sku}] Error:`, err.message)
        }
      })
    )
  }

  await prisma.$disconnect()

  console.log('\n========================================================================')
  console.log(`🎉 INDIVIDUAL IMAGES UPDATED: ${successCount} successful, ${errorCount} errors`)
  console.log('========================================================================')
}

run()
