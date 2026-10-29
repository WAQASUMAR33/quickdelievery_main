/**
 * RapidRide (Dynamic Offer-Your-Fare & Baggage Dispatch) Formula Engine
 * Shared across Admin Settings, Customer Booking, Driver Bidding, and API Routes.
 */

export const DEFAULT_RAPIDRIDE_SETTINGS = {
  currency: 'Rs.',
  bidding: {
    minOfferPercent: 75,              // Customer offer cannot go below 75% of Suggested Fare (-25% floor)
    maxOfferPercent: 250,             // Customer offer ceiling (250% of Suggested Fare)
    fareStepAmount: 50,               // Quick +/- adjustment button step (Rs.)
    defaultCounterMarkupPercent: 15,  // Suggested driver counter-offer markup (+15%)
    surgeMultiplier: 1.0,             // Active demand/peak multiplier (1.0x = normal)
  },
  platformFee: {
    basicPlatformFee: 25,             // Flat Basic Fee as Platform Fee added in Fare Calculation (Rs.)
    platformCommissionPercent: 10,    // Platform Service Fee % on agreed driver fare (RapidRide ~10%)
    minPlatformFee: 15,               // Minimum platform deduction per completed ride (Rs.)
    codRemittanceLimit: 15000,        // Max floating COD cash allowed in driver hand (Rs.)
    deliveryOrderBaseFee: 150,        // Standard food/grocery order base rider payout (Rs.)
  },
  vehicles: {
    MOTO: {
      id: 'MOTO',
      label: 'Moto',
      desc: '1 Seat • Fast',
      baseFare: 80,
      perKmRate: 22,
      perMinRate: 2,
      minFare: 120,
    },
    AUTO: {
      id: 'AUTO',
      label: 'Rickshaw',
      desc: '3 Seats • Economy',
      baseFare: 120,
      perKmRate: 32,
      perMinRate: 3,
      minFare: 180,
    },
    CAR_MINI: {
      id: 'CAR_MINI',
      label: 'Mini AC',
      desc: '4 Seats • Hatchback',
      baseFare: 220,
      perKmRate: 42,
      perMinRate: 4,
      minFare: 320,
    },
    CAR_AC: {
      id: 'CAR_AC',
      label: 'Comfort AC',
      desc: '4 Seats • Sedan',
      baseFare: 300,
      perKmRate: 52,
      perMinRate: 5,
      minFare: 420,
    },
  },
  baggage: {
    baseFee: 250,           // Base pickup & dispatch fee for Baggage / Parcel Drop (Rs.)
    perKmRate: 40,          // Distance rate per km for Baggage Drop (Rs./km)
    perMinRate: 3,          // Duration rate per minute for Baggage Drop (Rs./min)
    minFare: 350,           // Minimum total fare for Baggage Drop before platform fee (Rs.)
    freeWeightKg: 10,       // Free weight allowance included in base baggage fare (kg)
    perKgRate: 15,          // Extra weight surcharge above freeWeightKg (Rs./kg)
    fragileFee: 100,        // Special handling fee when package is marked Fragile (Rs.)
    freeBagsIncluded: 1,    // Free suitcases/bags included on City Taxi passenger rides
    extraBagFee: 60,        // Per extra bag fee on City Taxi passenger rides (Rs./bag)
  },
}

function toNum(val, fallback) {
  const n = Number(val)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/**
 * Safely deep-merges partial settings from DB/Admin UI with DEFAULT_RAPIDRIDE_SETTINGS.
 */
export function normalizeRapidRideSettings(raw = {}) {
  const d = DEFAULT_RAPIDRIDE_SETTINGS
  const b = raw?.bidding || {}
  const p = raw?.platformFee || {}
  const v = raw?.vehicles || {}
  const bg = raw?.baggage || {}

  const vehicles = {}
  for (const key of Object.keys(d.vehicles)) {
    const dv = d.vehicles[key]
    const rv = v[key] || {}
    vehicles[key] = {
      id: key,
      label: rv.label || dv.label,
      desc: rv.desc || dv.desc,
      baseFare: toNum(rv.baseFare, dv.baseFare),
      perKmRate: toNum(rv.perKmRate, dv.perKmRate),
      perMinRate: toNum(rv.perMinRate, dv.perMinRate),
      minFare: toNum(rv.minFare, dv.minFare),
    }
  }

  const surge = toNum(b.surgeMultiplier, d.bidding.surgeMultiplier)

  return {
    currency: typeof raw?.currency === 'string' && raw.currency.trim() ? raw.currency.trim() : d.currency,
    bidding: {
      minOfferPercent: Math.min(100, Math.max(30, toNum(b.minOfferPercent, d.bidding.minOfferPercent))),
      maxOfferPercent: Math.max(110, toNum(b.maxOfferPercent, d.bidding.maxOfferPercent)),
      fareStepAmount: Math.max(5, toNum(b.fareStepAmount, d.bidding.fareStepAmount)),
      defaultCounterMarkupPercent: toNum(b.defaultCounterMarkupPercent, d.bidding.defaultCounterMarkupPercent),
      surgeMultiplier: surge > 0 ? surge : 1.0,
    },
    platformFee: {
      basicPlatformFee: toNum(p.basicPlatformFee, d.platformFee.basicPlatformFee),
      platformCommissionPercent: Math.min(50, toNum(p.platformCommissionPercent, d.platformFee.platformCommissionPercent)),
      minPlatformFee: toNum(p.minPlatformFee, d.platformFee.minPlatformFee),
      codRemittanceLimit: Math.max(500, toNum(p.codRemittanceLimit, d.platformFee.codRemittanceLimit)),
      deliveryOrderBaseFee: toNum(p.deliveryOrderBaseFee, d.platformFee.deliveryOrderBaseFee),
    },
    vehicles,
    baggage: {
      baseFee: toNum(bg.baseFee, d.baggage.baseFee),
      perKmRate: toNum(bg.perKmRate, d.baggage.perKmRate),
      perMinRate: toNum(bg.perMinRate, d.baggage.perMinRate),
      minFare: toNum(bg.minFare, d.baggage.minFare),
      freeWeightKg: toNum(bg.freeWeightKg, d.baggage.freeWeightKg),
      perKgRate: toNum(bg.perKgRate, d.baggage.perKgRate),
      fragileFee: toNum(bg.fragileFee, d.baggage.fragileFee),
      freeBagsIncluded: Math.floor(toNum(bg.freeBagsIncluded, d.baggage.freeBagsIncluded)),
      extraBagFee: toNum(bg.extraBagFee, d.baggage.extraBagFee),
    },
  }
}

/**
 * Extracts numeric kg from user input such as "18", "18 kg", "12.5kg".
 */
export function parseWeightKg(weightInput) {
  if (weightInput === null || weightInput === undefined) return 0
  if (typeof weightInput === 'number') return Number.isFinite(weightInput) && weightInput > 0 ? weightInput : 0
  const match = String(weightInput).match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * RapidRide Core Fare & Baggage Calculation Formula
 *
 * 1) City Taxi Mode (serviceType = 'TAXI'):
 *    RideCore   = max(MinFare, (BaseFare + DistanceKm * PerKmRate + DurationMin * PerMinRate) * SurgeMultiplier)
 *    BaggageFee = max(0, BagCount - FreeBagsIncluded) * ExtraBagFee
 *    Suggested  = round(RideCore + BasicPlatformFee + BaggageFee)
 *
 * 2) Baggage / Luggage Mode (serviceType = 'LUGGAGE'):
 *    DistanceTime = (BaggageBaseFee + DistanceKm * BaggagePerKmRate + DurationMin * BaggagePerMinRate) * SurgeMultiplier
 *    ExtraWeight  = max(0, WeightKg - FreeWeightKg) * PerKgRate
 *    FragileCost  = isFragile ? FragileFee : 0
 *    BaggageCore  = max(BaggageMinFare, DistanceTime + ExtraWeight + FragileCost)
 *    Suggested    = round(BaggageCore + BasicPlatformFee)
 */
export function calculateRapidRideFare({
  serviceType = 'TAXI',
  vehicleId = 'CAR_AC',
  distanceKm = 5.0,
  durationMin = null,
  weightKg = 0,
  isFragile = false,
  bagCount = 0,
  settings: rawSettings = DEFAULT_RAPIDRIDE_SETTINGS,
} = {}) {
  const settings = normalizeRapidRideSettings(rawSettings)
  const km = Math.max(0.5, Number(distanceKm) || 5.0)
  const mins = durationMin !== null && durationMin !== undefined && Number(durationMin) > 0
    ? Number(durationMin)
    : Math.max(5, Math.round(km * 2.5))

  const surge = settings.bidding.surgeMultiplier || 1.0
  const basicPlatformFee = settings.platformFee.basicPlatformFee

  if (serviceType === 'LUGGAGE') {
    const bg = settings.baggage
    const parsedWeight = parseWeightKg(weightKg)
    const distanceCost = km * bg.perKmRate
    const timeCost = mins * bg.perMinRate
    const extraWeightKg = Math.max(0, parsedWeight - bg.freeWeightKg)
    const weightFee = extraWeightKg * bg.perKgRate
    const fragileSurcharge = isFragile ? bg.fragileFee : 0

    const rawTripSubtotal = (bg.baseFee + distanceCost + timeCost) * surge
    const baggageFeeTotal = Math.round(weightFee + fragileSurcharge)
    const tripFareBeforePlatform = Math.max(bg.minFare, rawTripSubtotal + weightFee + fragileSurcharge)
    const suggestedFare = Math.round(tripFareBeforePlatform + basicPlatformFee)

    const minAllowedFare = Math.max(
      Math.round(basicPlatformFee + 50),
      Math.round((suggestedFare * settings.bidding.minOfferPercent) / 100)
    )
    const maxAllowedFare = Math.round((suggestedFare * settings.bidding.maxOfferPercent) / 100)

    return {
      serviceType: 'LUGGAGE',
      vehicleId: 'LUGGAGE_VAN',
      distanceKm: Number(km.toFixed(1)),
      durationMin: Math.round(mins),
      baseFare: Math.round(bg.baseFee),
      distanceCost: Math.round(distanceCost),
      timeCost: Math.round(timeCost),
      surgeMultiplier: surge,
      extraWeightKg: Number(extraWeightKg.toFixed(1)),
      weightFee: Math.round(weightFee),
      fragileFee: Math.round(fragileSurcharge),
      baggageFee: baggageFeeTotal,
      basicPlatformFee: Math.round(basicPlatformFee),
      suggestedFare,
      minAllowedFare,
      maxAllowedFare,
      fareStepAmount: settings.bidding.fareStepAmount,
    }
  }

  // City Taxi Mode
  const veh = settings.vehicles[vehicleId] || settings.vehicles.CAR_AC
  const bg = settings.baggage
  const distanceCost = km * veh.perKmRate
  const timeCost = mins * veh.perMinRate
  const extraBags = Math.max(0, Math.floor(Number(bagCount) || 0) - bg.freeBagsIncluded)
  const baggageFee = extraBags * bg.extraBagFee

  const rawRideCore = (veh.baseFare + distanceCost + timeCost) * surge
  const rideCore = Math.max(veh.minFare, rawRideCore)
  const suggestedFare = Math.round(rideCore + basicPlatformFee + baggageFee)

  const minAllowedFare = Math.max(
    Math.round(basicPlatformFee + 40),
    Math.round((suggestedFare * settings.bidding.minOfferPercent) / 100)
  )
  const maxAllowedFare = Math.round((suggestedFare * settings.bidding.maxOfferPercent) / 100)

  return {
    serviceType: 'TAXI',
    vehicleId: veh.id,
    vehicleLabel: veh.label,
    distanceKm: Number(km.toFixed(1)),
    durationMin: Math.round(mins),
    baseFare: Math.round(veh.baseFare),
    distanceCost: Math.round(distanceCost),
    timeCost: Math.round(timeCost),
    surgeMultiplier: surge,
    extraBags,
    baggageFee: Math.round(baggageFee),
    basicPlatformFee: Math.round(basicPlatformFee),
    suggestedFare,
    minAllowedFare,
    maxAllowedFare,
    fareStepAmount: settings.bidding.fareStepAmount,
  }
}

/**
 * Calculates Platform Fee Breakdown & Driver Net Earnings from an agreed/proposed fare.
 */
export function calculateDriverPayout(agreedFare, rawSettings = DEFAULT_RAPIDRIDE_SETTINGS) {
  const settings = normalizeRapidRideSettings(rawSettings)
  const grossFare = Math.max(0, Number(agreedFare) || 0)
  const basicFee = settings.platformFee.basicPlatformFee
  const commissionPct = settings.platformFee.platformCommissionPercent
  const minFee = settings.platformFee.minPlatformFee

  const commissionBase = Math.max(0, grossFare - basicFee)
  const commissionAmount = Math.round((commissionBase * commissionPct) / 100)
  const rawTotalPlatformFee = basicFee + commissionAmount
  const totalPlatformFee = Math.min(grossFare, Math.max(minFee, rawTotalPlatformFee))
  const driverNetEarning = Math.max(0, Math.round(grossFare - totalPlatformFee))

  return {
    grossFare: Math.round(grossFare),
    basicPlatformFee: Math.round(basicFee),
    commissionPercent: commissionPct,
    commissionAmount,
    totalPlatformFee: Math.round(totalPlatformFee),
    driverNetEarning,
  }
}

