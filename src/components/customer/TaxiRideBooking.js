'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import GlobalStyles from '@mui/material/GlobalStyles'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import toast from 'react-hot-toast'
import {
  DEFAULT_RAPIDRIDE_SETTINGS,
  normalizeRapidRideSettings,
  calculateRapidRideFare,
} from '@/lib/rapidRideFormula'

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  Polyline,
} from '@react-google-maps/api'
import { GOOGLE_MAPS_SCRIPT_ID, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps'

import LocalTaxiIcon from '@mui/icons-material/LocalTaxi'
import LuggageIcon from '@mui/icons-material/Luggage'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import NavigationIcon from '@mui/icons-material/Navigation'
import PhoneIcon from '@mui/icons-material/Phone'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import ElectricRickshawIcon from '@mui/icons-material/ElectricRickshaw'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import StarIcon from '@mui/icons-material/Star'
import LockIcon from '@mui/icons-material/Lock'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import RouteIcon from '@mui/icons-material/Route'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CloseIcon from '@mui/icons-material/Close'

const BRAND = '#39772A'
const RAPIDRIDE_GREEN = '#00D26A'
const RAPIDRIDE_DARK = '#0F172A'

const RAPIDRIDE_PICKUP_ICON = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
      <defs>
        <filter id="p-shadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M17 0 C7.6 0 0 7.6 0 17 C0 27 17 42 17 42 C17 42 34 27 34 17 C34 7.6 26.4 0 17 0 Z" fill="#00D26A" filter="url(#p-shadow)"/>
      <circle cx="17" cy="16" r="8" fill="#FFFFFF"/>
      <circle cx="17" cy="16" r="4" fill="#0F172A"/>
    </svg>
  `),
}

const RAPIDRIDE_DROPOFF_ICON = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
      <defs>
        <filter id="d-shadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M17 0 C7.6 0 0 7.6 0 17 C0 27 17 42 17 42 C17 42 34 27 34 17 C34 7.6 26.4 0 17 0 Z" fill="#EF4444" filter="url(#d-shadow)"/>
      <circle cx="17" cy="16" r="8" fill="#FFFFFF"/>
      <rect x="13.5" y="12.5" width="7" height="7" rx="1.5" fill="#EF4444"/>
    </svg>
  `),
}

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 } // Lahore Default Center

const VEHICLE_CATEGORIES = [
  {
    id: 'MOTO',
    label: 'Moto',
    desc: '1 Seat • Fast',
    basePrice: 120,
    perKm: 25,
    icon: <TwoWheelerIcon sx={{ fontSize: 26 }} />,
  },
  {
    id: 'AUTO',
    label: 'Rickshaw',
    desc: '3 Seats • Cheap',
    basePrice: 180,
    perKm: 35,
    icon: <ElectricRickshawIcon sx={{ fontSize: 26 }} />,
  },
  {
    id: 'CAR_MINI',
    label: 'Mini AC',
    desc: '4 Seats • Hatchback',
    basePrice: 320,
    perKm: 45,
    icon: <DirectionsCarIcon sx={{ fontSize: 26 }} />,
  },
  {
    id: 'CAR_AC',
    label: 'Comfort AC',
    desc: '4 Seats • Sedan',
    basePrice: 420,
    perKm: 55,
    icon: <DirectionsCarIcon sx={{ fontSize: 26, color: '#2563EB' }} />,
  },
]

export default function TaxiRideBooking({ onBack }) {
  // Service mode: TAXI or LUGGAGE
  const [serviceType, setServiceType] = useState('TAXI')
  const [selectedVehicle, setSelectedVehicle] = useState('CAR_AC')

  // Locations and Coordinates
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupCoord, setPickupCoord] = useState(null)
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [dropoffCoord, setDropoffCoord] = useState(null)
  const [locatingUser, setLocatingUser] = useState(false)

  // Route stats from Google Directions & Real Road Polyline
  const [directions, setDirections] = useState(null)
  const [routePolyline, setRoutePolyline] = useState([])
  const [routeDistanceKm, setRouteDistanceKm] = useState(null)
  const [routeDurationMin, setRouteDurationMin] = useState(null)

  // Admin-configured RapidRide Fare & Baggage Formula settings
  const [fareSettings, setFareSettings] = useState(() => normalizeRapidRideSettings(DEFAULT_RAPIDRIDE_SETTINGS))

  // Fare proposal (RapidRide Bidding)
  const [suggestedFare, setSuggestedFare] = useState(445)
  const [customerFare, setCustomerFare] = useState('445')
  const [customerNotes, setCustomerNotes] = useState('')
  const [bagCount, setBagCount] = useState(0)

  // Baggage / Luggage specifics
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [packageWeight, setPackageWeight] = useState('')
  const [isFragile, setIsFragile] = useState(false)

  // Ride lifecycle
  const [requestingRide, setRequestingRide] = useState(false)
  const [activeRide, setActiveRide] = useState(null)
  const [acceptingBidId, setAcceptingBidId] = useState(null)

  // Map & Autocomplete refs
  const mapRef = useRef(null)
  const pickupAutoRef = useRef(null)
  const dropoffAutoRef = useRef(null)

  // Google Maps JS API Loader & Auth Failure Handling
  const [mapAuthError, setMapAuthError] = useState(false)
  const [hideNotice, setHideNotice] = useState(false)
  const { isLoaded: mapsLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  // Detect Google Maps authentication failures to automatically fall back to OpenStreetMap
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('Google Maps authentication failure detected. Falling back to OpenStreetMap.')
      setMapAuthError(true)
    }
    const prevAuth = window.gm_authFailure
    window.gm_authFailure = handleAuthFailure
    return () => {
      window.gm_authFailure = prevAuth
    }
  }, [])

  // Dynamic OpenStreetMap bounding box framing pickup, dropoff, or default center
  const osmEmbedUrl = useMemo(() => {
    let minLat, maxLat, minLng, maxLng
    if (pickupCoord && dropoffCoord) {
      minLat = Math.min(pickupCoord.lat, dropoffCoord.lat) - 0.025
      maxLat = Math.max(pickupCoord.lat, dropoffCoord.lat) + 0.025
      minLng = Math.min(pickupCoord.lng, dropoffCoord.lng) - 0.025
      maxLng = Math.max(pickupCoord.lng, dropoffCoord.lng) + 0.025
    } else {
      const center = pickupCoord || dropoffCoord || DEFAULT_CENTER
      minLat = center.lat - 0.035
      maxLat = center.lat + 0.035
      minLng = center.lng - 0.035
      maxLng = center.lng + 0.035
    }
    const marker = pickupCoord || dropoffCoord || DEFAULT_CENTER
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${marker.lat}%2C${marker.lng}`
  }, [pickupCoord, dropoffCoord])

  // Simulated nearby driver cars on map for rich visual experience
  const nearbyDrivers = useCallback(() => {
    const center = pickupCoord || DEFAULT_CENTER
    return [
      { id: 1, lat: center.lat + 0.0035, lng: center.lng + 0.0028, type: 'CAR' },
      { id: 2, lat: center.lat - 0.0042, lng: center.lng + 0.0031, type: 'MOTO' },
      { id: 3, lat: center.lat + 0.0021, lng: center.lng - 0.0045, type: 'CAR' },
      { id: 4, lat: center.lat - 0.0031, lng: center.lng - 0.0025, type: 'AUTO' },
    ]
  }, [pickupCoord])

  // Fetch Admin RapidRide Fare & Baggage Formula settings
  useEffect(() => {
    let mounted = true
    fetch('/api/admin/driver-settings')
      .then(r => r.json())
      .then(json => {
        if (mounted && json?.success && json?.data) {
          setFareSettings(normalizeRapidRideSettings(json.data))
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Live RapidRide Fare & Baggage Formula Breakdown
  const fareBreakdown = useMemo(() => {
    return calculateRapidRideFare({
      serviceType,
      vehicleId: selectedVehicle,
      distanceKm: routeDistanceKm || 5.0,
      durationMin: routeDurationMin,
      weightKg: packageWeight,
      isFragile,
      bagCount,
      settings: fareSettings,
    })
  }, [serviceType, selectedVehicle, routeDistanceKm, routeDurationMin, packageWeight, isFragile, bagCount, fareSettings])

  useEffect(() => {
    setSuggestedFare(fareBreakdown.suggestedFare)
    setCustomerFare(String(fareBreakdown.suggestedFare))
  }, [fareBreakdown.suggestedFare])

  // Calculate realistic suggested fare based on distance, vehicle, platform fee & baggage formula
  const updateFareEstimate = useCallback((distanceKm, vehicleId, mode) => {
    const res = calculateRapidRideFare({
      serviceType: mode,
      vehicleId,
      distanceKm: distanceKm || 5.0,
      durationMin: routeDurationMin,
      weightKg: packageWeight,
      isFragile,
      bagCount,
      settings: fareSettings,
    })
    setSuggestedFare(res.suggestedFare)
    setCustomerFare(String(res.suggestedFare))
  }, [routeDurationMin, packageWeight, isFragile, bagCount, fareSettings])

  // Auto-frame map camera to display the complete route between locations
  const fitMapToBounds = useCallback((coords) => {
    if (!mapRef.current || !coords || coords.length === 0) return
    if (!window.google?.maps?.LatLngBounds) return
    try {
      const bounds = new window.google.maps.LatLngBounds()
      coords.forEach(pt => {
        if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
          bounds.extend(pt)
        }
      })
      mapRef.current.fitBounds(bounds, {
        top: 80,
        bottom: 80,
        left: 80,
        right: 80,
      })
    } catch (e) {
      console.warn('Map fitBounds error:', e)
    }
  }, [])

  // Fallback Haversine road-distance calculation
  const fallbackRouteCalc = useCallback((c1, c2) => {
    if (!c1 || !c2) return
    const R = 6371 // Earth radius in km
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180
    const dLon = ((c2.lng - c1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const drivingDist = parseFloat((R * c * 1.3).toFixed(1)) // 1.3x typical urban road winding factor
    const dur = Math.max(5, Math.round(drivingDist * 2.5))
    setRouteDistanceKm(drivingDist)
    setRouteDurationMin(dur)
    updateFareEstimate(drivingDist, selectedVehicle, serviceType)
  }, [selectedVehicle, serviceType, updateFareEstimate])

  // RapidRide High-Precision Turn-by-Turn Route Calculation
  const calculateRoute = useCallback(async (origin, destination) => {
    if (!origin || !destination) return

    // Helper: Fetch real road-following polyline from OSRM driving engine
    const fetchOsrmDrivingRoute = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(osrmUrl)
        const data = await res.json()
        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0]
          const roadCoords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
          setRoutePolyline(roadCoords)
          setDirections(null)

          const distKm = parseFloat((route.distance / 1000).toFixed(1))
          const durMin = Math.max(5, Math.round(route.duration / 60))
          setRouteDistanceKm(distKm)
          setRouteDurationMin(durMin)
          updateFareEstimate(distKm, selectedVehicle, serviceType)

          // Smoothly frame map to show the entire winding route
          fitMapToBounds(roadCoords)
          return true
        }
      } catch (err) {
        console.warn('OSRM route fetch failed:', err)
      }
      return false
    }

    // Try Google Maps DirectionsService first
    if (window.google?.maps && !mapAuthError) {
      try {
        const directionsService = new window.google.maps.DirectionsService()
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          async (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              setDirections(result)
              setRoutePolyline([]) // Handled by DirectionsRenderer
              const leg = result.routes[0]?.legs[0]
              if (leg) {
                const dist = parseFloat((leg.distance.value / 1000).toFixed(1))
                const dur = Math.round(leg.duration.value / 60)
                setRouteDistanceKm(dist)
                setRouteDurationMin(dur)
                updateFareEstimate(dist, selectedVehicle, serviceType)
              }
              fitMapToBounds([origin, destination])
            } else {
              // Google Directions API blocked / denied -> Use real OSRM road polyline
              const success = await fetchOsrmDrivingRoute()
              if (!success) {
                fallbackRouteCalc(origin, destination)
                fitMapToBounds([origin, destination])
              }
            }
          }
        )
        return
      } catch {
        // Fall through to OSRM
      }
    }

    const success = await fetchOsrmDrivingRoute()
    if (!success) {
      fallbackRouteCalc(origin, destination)
      fitMapToBounds([origin, destination])
    }
  }, [mapAuthError, fallbackRouteCalc, selectedVehicle, serviceType, updateFareEstimate, fitMapToBounds])

  // Backend /api/geocode search for addresses when Google Places is restricted or in fallback mode
  const geocodeAddress = useCallback(async (addr, isPickup = true) => {
    if (!addr || !addr.trim()) return
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr.trim())}`)
      const data = await res.json()
      if (data.success && data.latitude && data.longitude) {
        const coord = { lat: Number(data.latitude), lng: Number(data.longitude) }
        if (isPickup) {
          setPickupCoord(coord)
          if (dropoffCoord) {
            calculateRoute(coord, dropoffCoord)
          } else if (mapRef.current) {
            mapRef.current.panTo(coord)
            mapRef.current.setZoom(15)
          }
        } else {
          setDropoffCoord(coord)
          if (pickupCoord) {
            calculateRoute(pickupCoord, coord)
          } else if (mapRef.current) {
            mapRef.current.panTo(coord)
            mapRef.current.setZoom(15)
          }
        }
      }
    } catch (e) {
      console.warn('Geocoding fallback error:', e)
    }
  }, [dropoffCoord, pickupCoord, calculateRoute])

  // Handle Autocomplete place selection for Pickup
  const onPickupPlaceChanged = () => {
    if (pickupAutoRef.current) {
      const place = pickupAutoRef.current.getPlace()
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const coord = { lat, lng }
        setPickupCoord(coord)
        setPickupAddress(place.formatted_address || place.name || '')
        if (dropoffCoord) {
          calculateRoute(coord, dropoffCoord)
        } else if (mapRef.current) {
          mapRef.current.panTo(coord)
          mapRef.current.setZoom(15)
        }
      }
    }
  }

  // Handle Autocomplete place selection for Dropoff
  const onDropoffPlaceChanged = () => {
    if (dropoffAutoRef.current) {
      const place = dropoffAutoRef.current.getPlace()
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const coord = { lat, lng }
        setDropoffCoord(coord)
        setDropoffAddress(place.formatted_address || place.name || '')
        if (pickupCoord) {
          calculateRoute(pickupCoord, coord)
        } else if (mapRef.current) {
          mapRef.current.panTo(coord)
          mapRef.current.setZoom(15)
        }
      }
    }
  }

  // Swap Pickup & Dropoff
  const handleSwapLocations = () => {
    const tempAddr = pickupAddress
    const tempCoord = pickupCoord
    setPickupAddress(dropoffAddress)
    setPickupCoord(dropoffCoord)
    setDropoffAddress(tempAddr)
    setDropoffCoord(tempCoord)
    if (dropoffCoord && tempCoord) {
      calculateRoute(dropoffCoord, tempCoord)
    }
  }

  // Detect Current Location using Geolocation API + Google Geocoder
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const coord = { lat, lng }
        setPickupCoord(coord)

        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: coord }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              setPickupAddress(results[0].formatted_address)
            } else {
              setPickupAddress(`Current GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
            }
          })
        }
        if (dropoffCoord) calculateRoute(coord, dropoffCoord)
        if (mapRef.current) mapRef.current.panTo(coord)
        setLocatingUser(false)
        toast.success('Pickup pinned to your current location!')
      },
      (err) => {
        setLocatingUser(false)
        toast.error('Could not detect location: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Fetch customer's active ride
  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await fetch('/api/rides?role=CUSTOMER')
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const current = data.data.find(r => ['SEARCHING', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(r.status))
        setActiveRide(current || null)
      } else {
        setActiveRide(null)
      }
    } catch {
      // Non-blocking
    }
  }, [])

  useEffect(() => {
    fetchActiveRide()
    const timer = setInterval(fetchActiveRide, 4000)
    return () => clearInterval(timer)
  }, [fetchActiveRide])

  // Vehicle Category change
  const handleSelectVehicle = (vehId) => {
    setSelectedVehicle(vehId)
    updateFareEstimate(routeDistanceKm || 5.0, vehId, serviceType)
  }

  // Service mode change
  const handleServiceModeChange = (mode) => {
    setServiceType(mode)
    updateFareEstimate(routeDistanceKm || 5.0, selectedVehicle, mode)
  }

  // Quick Fare Adjustment (+ / -) respecting RapidRide min/max bidding guardrails
  const adjustFare = (amount) => {
    setCustomerFare(prev => {
      const next = (Number(prev) || suggestedFare) + amount
      const clamped = Math.min(fareBreakdown.maxAllowedFare, Math.max(fareBreakdown.minAllowedFare, next))
      return String(clamped)
    })
  }

  // Submit Ride Request
  const handleRequestRide = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please enter pickup and dropoff locations')
      return
    }

    if (!customerFare || Number(customerFare) <= 0) {
      toast.error('Please propose your fare')
      return
    }

    if (Number(customerFare) < fareBreakdown.minAllowedFare) {
      toast.error(`Minimum RapidRide offer for this route is ${fareSettings.currency} ${fareBreakdown.minAllowedFare}`)
      return
    }

    try {
      setRequestingRide(true)
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          rideCategory: serviceType === 'LUGGAGE' ? 'LUGGAGE_VAN' : selectedVehicle,
          pickupAddress,
          pickupLat: pickupCoord?.lat || null,
          pickupLng: pickupCoord?.lng || null,
          dropoffAddress,
          dropoffLat: dropoffCoord?.lat || null,
          dropoffLng: dropoffCoord?.lng || null,
          estimatedDistanceKm: routeDistanceKm || 5.0,
          estimatedDurationMin: routeDurationMin || null,
          bagCount,
          customerFare: Number(customerFare),
          customerNotes,
          recipientName,
          recipientPhone,
          packageDescription,
          packageWeight,
          isFragile,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Your request is live! Drivers are reviewing your fare.')
        setActiveRide(data.data)
        fetchActiveRide()
      } else {
        toast.error(data.error || 'Failed to request ride')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setRequestingRide(false)
    }
  }

  // Accept Driver Bid
  const handleAcceptDriverBid = async (bidId) => {
    if (!activeRide) return
    try {
      setAcceptingBidId(bidId)
      const res = await fetch(`/api/rides/${activeRide.id}/bids`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Driver accepted! Ride confirmed.')
        fetchActiveRide()
      } else {
        toast.error(data.error || 'Failed to accept bid')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setAcceptingBidId(null)
    }
  }

  // Cancel Ride
  const handleCancelRide = async () => {
    if (!activeRide) return
    if (!window.confirm('Cancel this ride request?')) return
    try {
      const res = await fetch(`/api/rides/${activeRide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Ride cancelled')
        setActiveRide(null)
      } else {
        toast.error(data.error || 'Failed to cancel')
      }
    } catch {
      toast.error('Error cancelling ride')
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1.5, sm: 2.5, md: 3, xl: 4 }, py: 1 }}>
      {/* ─── SCOPED RAPIDRIDE PLACES AUTOCOMPLETE STYLES (NO IMPACT ON DASHBOARD) ─── */}
      <GlobalStyles
        styles={{
          '.pac-container': {
            backgroundColor: '#ffffff !important',
            borderRadius: '16px !important',
            border: '1px solid rgba(226, 232, 240, 0.95) !important',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.05) !important',
            fontFamily: 'inherit !important',
            padding: '8px !important',
            marginTop: '6px !important',
            zIndex: '999999 !important',
            minWidth: '320px !important',
            backdropFilter: 'blur(16px) !important',
            animation: 'pacFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important',
          },
          '@keyframes pacFadeIn': {
            from: {
              opacity: 0,
              transform: 'translateY(-6px) scale(0.98)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0) scale(1)',
            },
          },
          '.pac-item': {
            display: 'flex !important',
            alignItems: 'center !important',
            padding: '11px 14px !important',
            margin: '3px 0 !important',
            borderRadius: '10px !important',
            borderTop: 'none !important',
            cursor: 'pointer !important',
            fontSize: '13.5px !important',
            color: '#475569 !important',
            transition: 'all 0.15s ease-in-out !important',
          },
          '.pac-item:hover, .pac-item-selected, .pac-item-selected:hover': {
            backgroundColor: '#f0fdf4 !important',
            color: '#0f172a !important',
            transform: 'translateX(2px) !important',
          },
          '.pac-item-query': {
            fontSize: '14px !important',
            fontWeight: '700 !important',
            color: '#0f172a !important',
            marginRight: '6px !important',
          },
          '.pac-item:hover .pac-item-query, .pac-item-selected .pac-item-query': {
            color: '#15803d !important',
          },
          '.pac-matched': {
            fontWeight: '800 !important',
            color: '#16a34a !important',
          },
          '.pac-icon': {
            marginRight: '12px !important',
            marginTop: '0 !important',
            filter: 'hue-rotate(90deg) drop-shadow(0 1px 2px rgba(22, 163, 74, 0.25)) !important',
          },
          '.pac-logo::after': {
            padding: '8px 12px 6px !important',
            opacity: '0.7 !important',
          },
        }}
      />

      {/* ─── FULL-WIDTH DUAL-PANEL LAYOUT (LEFT CONTROLS + 100% EXPANDED MAP) ─── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 2.5, md: 3 },
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        {/* ═════════════════════════════════════════════════════════════════
            LEFT PANEL: INTERACTIVE BOOKING & INCOMING BIDS ENGINE
        ═════════════════════════════════════════════════════════════════ */}
        <Box
          sx={{
            width: { xs: '100%', lg: 470, xl: 510 },
            flexShrink: 0,
          }}
        >
          {activeRide ? (
            /* ─── ACTIVE RIDE & INCOMING BIDS LOBBY ─── */
            <Card
              sx={{
                borderRadius: 3.5,
                bgcolor: '#0F172A',
                color: '#fff',
                boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                border: '2px solid #38BDF8',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2.5, bgcolor: '#0284C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  {activeRide.serviceType === 'LUGGAGE' ? <LuggageIcon sx={{ fontSize: 28 }} /> : <LocalTaxiIcon sx={{ fontSize: 28 }} />}
                  <div>
                    <Typography variant="subtitle1" fontWeight={900}>
                      {activeRide.serviceType === 'LUGGAGE' ? 'RapidRide Baggage Delivery' : 'RapidRide City Taxi'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#E0F2FE' }}>
                      {activeRide.status === 'SEARCHING' ? 'Searching Drivers...' : `Status: ${activeRide.status}`}
                    </Typography>
                  </div>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCancelRide}
                  sx={{ bgcolor: '#DC2626', color: '#fff', fontWeight: 800, textTransform: 'none', py: 0.6, '&:hover': { bgcolor: '#b91c1c' } }}
                >
                  Cancel
                </Button>
              </Box>

              <CardContent sx={{ p: 2.5 }}>
                {/* Route Summary Card */}
                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.06)', mb: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <LocationOnIcon sx={{ color: '#22C55E', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={600} color="#F1F5F9" noWrap>
                        {activeRide.pickupAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <NavigationIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={600} color="#F1F5F9" noWrap>
                        {activeRide.dropoffAddress}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Status: Searching Drivers & Bidding Lobby */}
                {activeRide.status === 'SEARCHING' && (
                  <Box>
                    <Box sx={{ textAlign: 'center', py: 1.5, mb: 2 }}>
                      <CircularProgress size={32} sx={{ color: '#38BDF8', mb: 1 }} />
                      <Typography variant="h6" fontWeight={900}>
                        Your Offer: Rs. {Number(activeRide.customerFare).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Nearby drivers are sending bids. Tap to accept a driver.
                      </Typography>
                    </Box>

                    {/* Driver Bids Stream */}
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#38BDF8', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                      DRIVER OFFERS ({activeRide.driverBids?.length || 0})
                    </Typography>

                    {(!activeRide.driverBids || activeRide.driverBids.length === 0) ? (
                      <Box sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                          Broadcasting to nearby drivers...
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                        {activeRide.driverBids.map((bid) => (
                          <Card
                            key={bid.id}
                            sx={{
                              p: 1.8,
                              borderRadius: 2.5,
                              bgcolor: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: '#fff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar src={bid.driver?.image} sx={{ width: 42, height: 42, bgcolor: BRAND }}>
                                {bid.driver?.name?.charAt(0) || 'D'}
                              </Avatar>
                              <div>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {bid.driver?.name || 'Driver'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#38BDF8' }}>
                                  ⭐ 4.9 • ETA ~{bid.etaMinutes || 5} min
                                </Typography>
                              </div>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#22C55E' }}>
                                Rs. {Number(bid.bidAmount).toLocaleString()}
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAcceptDriverBid(bid.id)}
                                disabled={acceptingBidId === bid.id}
                                sx={{
                                  bgcolor: '#22C55E',
                                  color: '#fff',
                                  fontWeight: 800,
                                  textTransform: 'none',
                                  px: 2,
                                  borderRadius: 1.5,
                                  '&:hover': { bgcolor: '#16a34a' },
                                }}
                              >
                                {acceptingBidId === bid.id ? 'Accepting...' : 'Accept'}
                              </Button>
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}

                {/* Status: Driver Assigned & Trip Tracker */}
                {['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(activeRide.status) && (
                  <Box>
                    {/* Security PIN Banner */}
                    <Box sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#064E3B', border: '1px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon sx={{ color: '#6EE7B7' }} />
                        <div>
                          <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 800 }}>
                            RIDE PIN (SHARE WITH DRIVER)
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: 4 }}>
                            {activeRide.rideOtp || '••••'}
                          </Typography>
                        </div>
                      </Box>
                      <Chip
                        label={activeRide.status === 'DRIVER_ARRIVED' ? 'Driver Outside' : activeRide.status === 'IN_PROGRESS' ? 'In Transit' : 'Driver Arriving'}
                        sx={{ bgcolor: '#fff', color: '#064E3B', fontWeight: 900, fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Driver Card */}
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={activeRide.driver?.image} sx={{ width: 48, height: 48, bgcolor: BRAND }}>
                          {activeRide.driver?.name?.charAt(0) || 'D'}
                        </Avatar>
                        <div>
                          <Typography variant="subtitle1" fontWeight={800}>
                            {activeRide.driver?.name || 'Driver'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#38BDF8', display: 'block' }}>
                            Agreed Fare: <strong>Rs. {Number(activeRide.finalFare || activeRide.customerFare).toLocaleString()}</strong>
                          </Typography>
                        </div>
                      </Box>

                      {activeRide.driver?.phoneNumber && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PhoneIcon />}
                          href={`tel:${activeRide.driver.phoneNumber}`}
                          sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 800, textTransform: 'none', px: 2, '&:hover': { bgcolor: '#16a34a' } }}
                        >
                          Call
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            /* ─── NEW RIDE BOOKING PANEL (HIGH-TECH RAPIDRIDE STYLE) ─── */
            <Card
              sx={{
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Top Mode Header */}
              <Box sx={{ p: 2.5, bgcolor: '#0F172A', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h6" fontWeight={900}>
                    RapidRide & Dispatch
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Set your pickup, dropoff, and propose your fare.
                  </Typography>
                </div>

                {/* Mode Selector */}
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<LocalTaxiIcon sx={{ color: serviceType === 'TAXI' ? '#fff !important' : 'inherit', fontSize: 18 }} />}
                    label="City Taxi"
                    clickable
                    onClick={() => handleServiceModeChange('TAXI')}
                    sx={{
                      fontWeight: 800,
                      bgcolor: serviceType === 'TAXI' ? BRAND : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Chip
                    icon={<LuggageIcon sx={{ color: serviceType === 'LUGGAGE' ? '#fff !important' : 'inherit', fontSize: 18 }} />}
                    label="Luggage Drop"
                    clickable
                    onClick={() => handleServiceModeChange('LUGGAGE')}
                    sx={{
                      fontWeight: 800,
                      bgcolor: serviceType === 'LUGGAGE' ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.75rem',
                    }}
                  />
                </Stack>
              </Box>

              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack spacing={2.5}>
                  {/* ── ROUTE SEARCH ── */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight={800} color={mapAuthError ? '#F59E0B' : '#64748B'} letterSpacing={0.5}>
                        {mapAuthError ? 'ROUTE LOCATIONS (SMART ADDRESS SEARCH)' : 'ROUTE LOCATIONS (GOOGLE PLACES)'}
                      </Typography>
                      {pickupCoord && dropoffCoord && (
                        <IconButton size="small" onClick={handleSwapLocations} title="Swap pickup & dropoff">
                          <SwapVertIcon fontSize="small" sx={{ color: BRAND }} />
                        </IconButton>
                      )}
                    </Box>

                    <Stack spacing={1.5}>
                      {/* Pickup Input with Autocomplete & Geocoding Fallback */}
                      <Box sx={{ position: 'relative' }}>
                        {mapsLoaded && !mapAuthError && !loadError ? (
                          <Autocomplete
                            onLoad={ref => (pickupAutoRef.current = ref)}
                            onPlaceChanged={onPickupPlaceChanged}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Search Pickup Address or Landmark..."
                              value={pickupAddress}
                              onChange={e => setPickupAddress(e.target.value)}
                              onBlur={() => geocodeAddress(pickupAddress, true)}
                              onKeyDown={e => { if (e.key === 'Enter') geocodeAddress(pickupAddress, true) }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LocationOnIcon sx={{ color: '#22C55E' }} />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Tooltip title="Use my current GPS location">
                                      <IconButton
                                        size="small"
                                        onClick={handleLocateMe}
                                        disabled={locatingUser}
                                        sx={{ color: BRAND }}
                                      >
                                        {locatingUser ? <CircularProgress size={16} /> : <MyLocationIcon fontSize="small" />}
                                      </IconButton>
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Autocomplete>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter Pickup Address or Landmark..."
                            value={pickupAddress}
                            onChange={e => setPickupAddress(e.target.value)}
                            onBlur={() => geocodeAddress(pickupAddress, true)}
                            onKeyDown={e => { if (e.key === 'Enter') geocodeAddress(pickupAddress, true) }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationOnIcon sx={{ color: '#22C55E' }} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip title="Use my current GPS location">
                                    <IconButton
                                      size="small"
                                      onClick={handleLocateMe}
                                      disabled={locatingUser}
                                      sx={{ color: BRAND }}
                                    >
                                      {locatingUser ? <CircularProgress size={16} /> : <MyLocationIcon fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </Box>

                      {/* Dropoff Input with Autocomplete & Geocoding Fallback */}
                      <Box sx={{ position: 'relative' }}>
                        {mapsLoaded && !mapAuthError && !loadError ? (
                          <Autocomplete
                            onLoad={ref => (dropoffAutoRef.current = ref)}
                            onPlaceChanged={onDropoffPlaceChanged}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Where to? (Enter Dropoff Destination)..."
                              value={dropoffAddress}
                              onChange={e => setDropoffAddress(e.target.value)}
                              onBlur={() => geocodeAddress(dropoffAddress, false)}
                              onKeyDown={e => { if (e.key === 'Enter') geocodeAddress(dropoffAddress, false) }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <NavigationIcon sx={{ color: '#EF4444' }} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Autocomplete>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Where to? (Enter Dropoff Destination)..."
                            value={dropoffAddress}
                            onChange={e => setDropoffAddress(e.target.value)}
                            onBlur={() => geocodeAddress(dropoffAddress, false)}
                            onKeyDown={e => { if (e.key === 'Enter') geocodeAddress(dropoffAddress, false) }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <NavigationIcon sx={{ color: '#EF4444' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </Box>
                    </Stack>

                    {/* Route Distance & Duration Chip */}
                    {routeDistanceKm && routeDurationMin && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RouteIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                          <Typography variant="caption" fontWeight={800} color="#166534">
                            Driving Route: {routeDistanceKm} km
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ color: '#16A34A', fontSize: 16 }} />
                          <Typography variant="caption" fontWeight={800} color="#166534">
                            ~{routeDurationMin} mins
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* ── VEHICLE CATEGORY SELECTOR ── */}
                  {serviceType === 'TAXI' ? (
                    <Box>
                      <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={0.5} sx={{ display: 'block', mb: 1 }}>
                        SELECT VEHICLE CLASS
                      </Typography>
                      <Grid container spacing={1.5}>
                        {VEHICLE_CATEGORIES.map(veh => {
                          const isSelected = selectedVehicle === veh.id
                          const vehCalc = calculateRapidRideFare({
                            serviceType: 'TAXI',
                            vehicleId: veh.id,
                            distanceKm: routeDistanceKm || 5.0,
                            durationMin: routeDurationMin,
                            bagCount,
                            settings: fareSettings,
                          })
                          const estPrice = vehCalc.suggestedFare
                          const cfgVeh = fareSettings.vehicles?.[veh.id]

                          return (
                            <Grid item xs={6} key={veh.id}>
                              <Card
                                onClick={() => handleSelectVehicle(veh.id)}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2.5,
                                  cursor: 'pointer',
                                  border: isSelected ? `2px solid ${BRAND}` : '1px solid #E2E8F0',
                                  bgcolor: isSelected ? '#F0FDF4' : '#fff',
                                  transition: 'all 0.2s',
                                  '&:hover': { transform: 'translateY(-2px)' },
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Box sx={{ color: isSelected ? BRAND : '#64748B' }}>
                                    {veh.icon}
                                  </Box>
                                  <Typography variant="subtitle2" fontWeight={900} sx={{ color: BRAND }}>
                                    Rs. {estPrice}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                                  {cfgVeh?.label || veh.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                                  {cfgVeh?.desc || veh.desc}
                                </Typography>
                              </Card>
                            </Grid>
                          )
                        })}
                      </Grid>

                      {/* Passenger Baggage / Suitcases Selector */}
                      <Box sx={{ mt: 1.8, p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" fontWeight={800} color="#0F172A" display="block">
                            🧳 Travelling with Baggage?
                          </Typography>
                          <Typography variant="caption" color="#64748B" sx={{ fontSize: '0.68rem' }}>
                            First {fareSettings.baggage.freeBagsIncluded} bag(s) free • +{fareSettings.currency} {fareSettings.baggage.extraBagFee}/extra bag
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.6} alignItems="center">
                          {[0, 1, 2, 3, 4].map(cnt => (
                            <Chip
                              key={cnt}
                              label={cnt === 0 ? 'None' : `${cnt}`}
                              size="small"
                              clickable
                              onClick={() => setBagCount(cnt)}
                              sx={{
                                fontWeight: 800,
                                bgcolor: bagCount === cnt ? BRAND : '#fff',
                                color: bagCount === cnt ? '#fff' : '#334155',
                                border: '1px solid #CBD5E1',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  ) : (
                    /* Baggage / Luggage Information Inputs */
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" fontWeight={800} color="#7C3AED">
                          RECIPIENT & BAGGAGE DETAILS
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="#64748B" sx={{ fontSize: '0.68rem' }}>
                          {fareSettings.baggage.freeWeightKg}kg free • +{fareSettings.currency} {fareSettings.baggage.perKgRate}/kg
                        </Typography>
                      </Box>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Recipient Name"
                            value={recipientName}
                            onChange={e => setRecipientName(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Recipient Phone"
                            value={recipientPhone}
                            onChange={e => setRecipientPhone(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={8}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Package Contents (e.g. 2 bags, electronics)"
                            value={packageDescription}
                            onChange={e => setPackageDescription(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Weight (kg)"
                            value={packageWeight}
                            onChange={e => setPackageWeight(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={isFragile}
                                onChange={e => setIsFragile(e.target.checked)}
                              />
                            }
                            label={
                              <Typography variant="caption" fontWeight={700} color="#475569">
                                Fragile / Special Handling (+{fareSettings.currency} {fareSettings.baggage.fragileFee})
                              </Typography>
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* ── OFFER YOUR FARE (RAPIDRIDE CORE BIDDING) ── */}
                  <Box
                    sx={{
                      p: 2.2,
                      borderRadius: 2.5,
                      bgcolor: '#ECFDF5',
                      border: '1.5px solid #A7F3D0',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Typography variant="caption" fontWeight={900} color="#065F46" letterSpacing={0.5}>
                        OFFER YOUR FARE (RAPIDRIDE BIDDING)
                      </Typography>
                      <Chip
                        label={`Suggested: ${fareSettings.currency} ${suggestedFare}`}
                        size="small"
                        sx={{ bgcolor: '#fff', color: '#047857', fontWeight: 800, fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Live Formula Fee Breakdown Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.8, mb: 1, px: 1, py: 0.6, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.75)' }}>
                      <Typography variant="caption" color="#065F46" fontWeight={700} sx={{ fontSize: '0.68rem' }}>
                        Basic Platform Fee: {fareSettings.currency} {fareBreakdown.basicPlatformFee}
                        {fareBreakdown.baggageFee > 0 ? ` • Baggage Fee: ${fareSettings.currency} ${fareBreakdown.baggageFee}` : ''}
                      </Typography>
                      <Typography variant="caption" color="#047857" fontWeight={800} sx={{ fontSize: '0.68rem' }}>
                        Min Offer: {fareSettings.currency} {fareBreakdown.minAllowedFare}
                      </Typography>
                    </Box>

                    {/* Numeric Display & Quick Steppers */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5 }}>
                      <TextField
                        fullWidth
                        type="number"
                        value={customerFare}
                        onChange={e => setCustomerFare(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography fontWeight={900} color="#065F46" fontSize="1.1rem">
                                {fareSettings.currency}
                              </Typography>
                            </InputAdornment>
                          ),
                          sx: { bgcolor: '#fff', fontWeight: 900, fontSize: '1.3rem', borderRadius: 2 },
                        }}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          variant="contained"
                          onClick={() => adjustFare(-fareBreakdown.fareStepAmount)}
                          sx={{ minWidth: 42, px: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        >
                          <RemoveIcon fontSize="small" />
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => adjustFare(fareBreakdown.fareStepAmount)}
                          sx={{ minWidth: 42, px: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        >
                          <AddIcon fontSize="small" />
                        </Button>
                      </Stack>
                    </Box>

                    {/* Quick Adjustment Pills */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                      {[-fareBreakdown.fareStepAmount, fareBreakdown.fareStepAmount, fareBreakdown.fareStepAmount * 2].map(amt => (
                        <Chip
                          key={amt}
                          label={`${amt > 0 ? '+' : ''}${amt}`}
                          clickable
                          onClick={() => adjustFare(amt)}
                          size="small"
                          sx={{ bgcolor: '#fff', fontWeight: 800, color: '#047857', border: '1px solid #BBF7D0' }}
                        />
                      ))}
                      <Chip
                        label="Reset to Est."
                        clickable
                        onClick={() => setCustomerFare(String(suggestedFare))}
                        size="small"
                        sx={{ bgcolor: '#fff', fontWeight: 700, color: '#64748B' }}
                      />
                    </Stack>

                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Optional message to driver (e.g. 2 bags, wait at gate)"
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      sx={{ bgcolor: '#fff', borderRadius: 1.5 }}
                    />
                  </Box>

                  {/* ── FIND DRIVERS BUTTON ── */}
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleRequestRide}
                    disabled={requestingRide}
                    startIcon={requestingRide ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <LocalTaxiIcon />}
                    sx={{
                      bgcolor: BRAND,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      textTransform: 'none',
                      py: 1.6,
                      borderRadius: 2.5,
                      boxShadow: '0 6px 20px rgba(57,119,42,0.35)',
                      '&:hover': { bgcolor: '#2d5e21' },
                    }}
                  >
                    {requestingRide
                      ? 'Broadcasting...'
                      : serviceType === 'LUGGAGE'
                      ? `Request Luggage Drop (Offer Rs. ${Number(customerFare || 0).toLocaleString()})`
                      : `Find Drivers (Offer Rs. ${Number(customerFare || 0).toLocaleString()})`}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* ═════════════════════════════════════════════════════════════════
            RIGHT PANEL: FULL-WIDTH EXPANDED LIVE INTERACTIVE MAP
        ═════════════════════════════════════════════════════════════════ */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            display: 'flex',
          }}
        >
          <Card
            sx={{
              width: '100%',
              height: { xs: 460, sm: 540, md: 620, lg: 'calc(100vh - 160px)' },
              minHeight: { xs: 460, lg: 680 },
              borderRadius: 3.5,
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {mapsLoaded && !mapAuthError && !loadError ? (
              <GoogleMap
                onLoad={map => (mapRef.current = map)}
                center={pickupCoord || DEFAULT_CENTER}
                zoom={13}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                  styles: [
                    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                  ],
                }}
              >
                {/* RapidRide Turn-by-Turn Driving Route Polyline */}
                {directions ? (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: RAPIDRIDE_GREEN,
                        strokeWeight: 6,
                        strokeOpacity: 0.95,
                      },
                      suppressMarkers: true,
                    }}
                  />
                ) : (
                  routePolyline.length > 0 && (
                    <>
                      {/* RapidRide Outer Casing / Glow */}
                      <Polyline
                        path={routePolyline}
                        options={{
                          strokeColor: RAPIDRIDE_DARK,
                          strokeWeight: 8,
                          strokeOpacity: 0.45,
                          zIndex: 1,
                        }}
                      />
                      {/* RapidRide Active Neon Green Road Path */}
                      <Polyline
                        path={routePolyline}
                        options={{
                          strokeColor: RAPIDRIDE_GREEN,
                          strokeWeight: 5,
                          strokeOpacity: 1.0,
                          zIndex: 2,
                        }}
                      />
                    </>
                  )
                )}

                {/* RapidRide Custom Pickup Marker */}
                {pickupCoord && (
                  <Marker
                    position={pickupCoord}
                    icon={RAPIDRIDE_PICKUP_ICON}
                    title={`Pickup: ${pickupAddress || 'Selected Location'}`}
                  />
                )}

                {/* RapidRide Custom Dropoff Marker */}
                {dropoffCoord && (
                  <Marker
                    position={dropoffCoord}
                    icon={RAPIDRIDE_DROPOFF_ICON}
                    title={`Dropoff: ${dropoffAddress || 'Selected Destination'}`}
                  />
                )}

                {/* Simulated nearby drivers moving around pickup point */}
                {nearbyDrivers().map(d => (
                  <Marker
                    key={d.id}
                    position={{ lat: d.lat, lng: d.lng }}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 1,
                      scale: 4,
                      fillColor: '#1E293B',
                      fillOpacity: 0.9,
                      strokeColor: '#38BDF8',
                      strokeWeight: 2,
                    }}
                    title="Nearby Driver"
                  />
                ))}
              </GoogleMap>
            ) : (
              <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#F1F5F9' }}>
                <iframe
                  title="Interactive Route Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={osmEmbedUrl}
                  style={{ border: 0, width: '100%', height: '100%' }}
                />

                {mapAuthError && !hideNotice && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      right: { xs: 16, sm: 'auto' },
                      maxWidth: { xs: 'calc(100% - 32px)', sm: 540 },
                      zIndex: 10,
                      p: 1.8,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(245, 158, 11, 0.6)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: 26, mt: 0.2, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                          Google Cloud Notice: Key Restricted / APIs Not Enabled
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setHideNotice(true)}
                          sx={{ color: '#94A3B8', p: 0.2, ml: 1, '&:hover': { color: '#fff' } }}
                          title="Dismiss notice"
                        >
                          <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.74rem', display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                        Google Places & Directions are disabled or restricted in Google Cloud Console. <strong>OpenStreetMap Live Engine</strong> is active and keeping full-width map navigation, address geocoding, and fare estimation fully operational.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Floating Map Status Overlay Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 14,
                left: 14,
                bgcolor: 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                px: 2,
                py: 0.8,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                zIndex: 10,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              <Typography variant="caption" fontWeight={800} letterSpacing={0.5}>
                {mapAuthError ? 'LIVE ROUTE • OPENSTREETMAP ENGINE' : 'LIVE GPS ROUTE & NEARBY DRIVERS'}
              </Typography>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
