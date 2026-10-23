import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Initialize Gemini client lazily
 */
export function getGeminiModel(modelName = 'gemini-3.5-flash') {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null
  }
  const genAI = new GoogleGenerativeAI(apiKey.trim())
  return genAI.getGenerativeModel({ model: modelName })
}

/**
 * Robust fallback NLP parser if Gemini key is missing or quota exceeded
 */
export function fallbackNlpParse(rawQuery) {
  const query = (rawQuery || '').trim()
  const lower = query.toLowerCase()

  let minPrice = null
  let maxPrice = null
  let color = null
  let brand = null
  let inStock = null
  let sortBy = 'relevance'
  const attributes = []

  // Price patterns: "under $50", "below 100", "less than 50", "between 20 and 50", "$20-$50"
  const betweenMatch = lower.match(/between\s+\$?(\d+(?:\.\d+)?)\s*(?:and|-|to)\s*\$?(\d+(?:\.\d+)?)/i) ||
                       lower.match(/\$?(\d+(?:\.\d+)?)\s*-\s*\$?(\d+(?:\.\d+)?)/i)
  if (betweenMatch) {
    minPrice = parseFloat(betweenMatch[1])
    maxPrice = parseFloat(betweenMatch[2])
  } else {
    const underMatch = lower.match(/(?:under|below|less than|max|up to)\s+\$?(\d+(?:\.\d+)?)/i)
    if (underMatch) {
      maxPrice = parseFloat(underMatch[1])
    }
    const aboveMatch = lower.match(/(?:above|over|more than|min|at least)\s+\$?(\d+(?:\.\d+)?)/i)
    if (aboveMatch) {
      minPrice = parseFloat(aboveMatch[1])
    }
  }

  // Stock intent
  if (lower.includes('in stock') || lower.includes('available now') || lower.includes('ready to ship')) {
    inStock = true
  }

  // Sorting intent
  if (lower.includes('cheapest') || lower.includes('lowest price') || lower.includes('budget') || lower.includes('affordable')) {
    sortBy = 'price_asc'
  } else if (lower.includes('expensive') || lower.includes('premium') || lower.includes('luxury') || lower.includes('high end')) {
    sortBy = 'price_desc'
  } else if (lower.includes('best') || lower.includes('top rated') || lower.includes('highest rating') || lower.includes('popular')) {
    sortBy = 'rating'
  } else if (lower.includes('new') || lower.includes('latest') || lower.includes('recent')) {
    sortBy = 'newest'
  }

  // Common colors
  const colorList = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'gold', 'silver', 'grey', 'gray', 'brown', 'orange', 'navy', 'beige']
  for (const c of colorList) {
    const regex = new RegExp(`\\b${c}\\b`, 'i')
    if (regex.test(lower)) {
      color = c
      break
    }
  }

  // Known attributes
  const attrList = [
    'waterproof', 'wireless', 'bluetooth', 'organic', 'gaming', 'rgb',
    'cotton', 'leather', 'fresh', 'vegan', 'halal', 'gluten free',
    'portable', 'rechargeable', 'ergonomic', 'fast delivery', 'winter', 'summer'
  ]
  for (const attr of attrList) {
    if (lower.includes(attr)) {
      attributes.push(attr)
    }
  }

  // Common brands
  const brandList = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'dell', 'hp', 'lenovo', 'asus', 'belkin', 'schweppes', 'coca cola', 'nestle', 'logitech']
  for (const b of brandList) {
    if (lower.includes(b)) {
      brand = b
      break
    }
  }

  // Category inference
  let category = null
  if (lower.includes('burger') || lower.includes('pizza') || lower.includes('food') || lower.includes('restaurant') || lower.includes('snack') || lower.includes('dessert') || lower.includes('cake') || lower.includes('drink') || lower.includes('beverage')) {
    category = 'Food & Dining'
  } else if (lower.includes('grocery') || lower.includes('fruit') || lower.includes('vegetable') || lower.includes('milk') || lower.includes('oil') || lower.includes('spice')) {
    category = 'Groceries & Fresh'
  } else if (lower.includes('laptop') || lower.includes('phone') || lower.includes('headphone') || lower.includes('tech') || lower.includes('electronics') || lower.includes('cable') || lower.includes('charger') || lower.includes('mount') || lower.includes('gym')) {
    category = 'Electronics & Tech'
  } else if (lower.includes('jacket') || lower.includes('shirt') || lower.includes('shoes') || lower.includes('dress') || lower.includes('clothes') || lower.includes('fashion') || lower.includes('wear')) {
    category = 'Fashion & Apparel'
  }

  // Extract clean keywords removing stopwords and extracted values
  let clean = lower
    .replace(/(?:under|below|less than|max|up to|above|over|more than|between)\s+\$?\d+(?:\.\d+)?(?:\s*(?:and|-|to)\s*\$?\d+(?:\.\d+)?)?/gi, ' ')
    .replace(/\b(for|in|with|and|the|a|an|of|to|find|search|show|me|buy|cheap|best|cheapest|latest|in stock)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const keywords = clean.split(' ').filter(w => w.length > 2 && w !== color && w !== brand)

  return {
    keywords,
    category,
    color,
    brand,
    minPrice,
    maxPrice,
    attributes,
    inStock,
    sortBy,
    explanation: `Smart parsed: ${keywords.join(' ')}${color ? ` in ${color}` : ''}${maxPrice ? ` under $${maxPrice}` : ''}${minPrice ? ` above $${minPrice}` : ''}`,
    isAiPowered: false,
  }
}

/**
 * Parse natural language search using Gemini
 */
export async function parseNlpSearch(rawQuery) {
  const model = getGeminiModel()
  if (!model) {
    return fallbackNlpParse(rawQuery)
  }

  try {
    const prompt = `You are a high-accuracy e-commerce search intent extractor. 
Analyze this user search query: "${rawQuery}"

Extract the structured parameters into valid JSON (no markdown formatting, no code fences):
{
  "keywords": ["array", "of", "core", "product", "noun", "keywords"],
  "category": "inferred category or null (e.g. Food & Dining, Groceries, Electronics, Fashion, Home)",
  "color": "color name or null",
  "brand": "brand name or null",
  "minPrice": number or null,
  "maxPrice": number or null,
  "attributes": ["features", "like", "waterproof", "wireless", "organic"],
  "inStock": true, false or null,
  "sortBy": "price_asc" | "price_desc" | "rating" | "newest" | "relevance",
  "explanation": "concise 1-sentence explanation of what you are searching for"
}

Do not include backticks, do not include markdown \`\`\`json. Return only pure raw JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Clean any backticks if returned
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      category: parsed.category || null,
      color: parsed.color || null,
      brand: parsed.brand || null,
      minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : null,
      maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : null,
      attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
      inStock: typeof parsed.inStock === 'boolean' ? parsed.inStock : null,
      sortBy: parsed.sortBy || 'relevance',
      explanation: parsed.explanation || `Searching for ${rawQuery}`,
      isAiPowered: true,
    }
  } catch (err) {
    console.error('Gemini NLP parsing failed, falling back to local NLP:', err.message)
    return fallbackNlpParse(rawQuery)
  }
}

/**
 * Analyze an uploaded product image using Gemini Vision
 */
export async function analyzeProductImageWithGemini(base64Data, mimeType = 'image/jpeg') {
  const model = getGeminiModel('gemini-3.5-flash') || getGeminiModel('gemini-3.5-flash-lite')
  if (!model) {
    return {
      success: false,
      message: 'GEMINI_API_KEY is not configured in .env. Please add GEMINI_API_KEY from https://aistudio.google.com/app/apikey',
      needsApiKey: true,
    }
  }

  try {
    const prompt = `Analyze this product photo for an e-commerce visual search engine.
Identify what product is shown.
Respond strictly in valid JSON without backticks or markdown:
{
  "itemName": "Specific item name or title (e.g., 'Double Beef Smash Burger', 'Logitech Wireless Mouse', 'Black Winter Down Jacket')",
  "category": "Broad category (e.g., 'Food & Dining', 'Electronics', 'Groceries', 'Fashion', 'Home Goods')",
  "color": "Dominant color(s)",
  "brand": "Visible brand name or null",
  "features": ["array", "of", "visual", "attributes"],
  "searchKeywords": ["5", "to", "8", "best", "keywords", "to", "find", "similar", "items", "in", "catalog"],
  "description": "Short 1-sentence visual description"
}`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    }

    let result
    try {
      result = await model.generateContent([prompt, imagePart])
    } catch (primaryErr) {
      console.warn('Gemini 3.5 Flash busy/failed, attempting fallback to gemini-3.5-flash-lite:', primaryErr.message)
      const fallbackModel = getGeminiModel('gemini-3.5-flash-lite')
      if (fallbackModel) {
        result = await fallbackModel.generateContent([prompt, imagePart])
      } else {
        throw primaryErr
      }
    }

    const text = result.response.text().trim()
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    return {
      success: true,
      data: parsed,
    }
  } catch (err) {
    console.error('Gemini Vision analysis error:', err.message)
    return {
      success: false,
      error: err.message,
    }
  }
}
