// Shared data source for all dashboard pages
// Engineered to showcase key dashboard scenarios:
// 1. Stale pending orders (warning / critical)
// 2. Stuck in-progress orders (warning / critical)
// 3. Recent arrivals
// 4. Fresh accepted orders
// 5. Low-rated providers
// 6. Today vs historical stats

// ------------------------------------------------------------------
// Service Catalogue: each service has a base price + price per KM.
// Total price = basePrice + (distance * pricePerKm)
// ------------------------------------------------------------------
export let SERVICES = [
  { name: 'Battery', description: 'Jump-start your vehicle battery', basePrice: 250, pricePerKm: 10, status: 'Active' },
  { name: 'Fuel',    description: 'Deliver fuel to your location',     basePrice: 100, pricePerKm: 15, status: 'Active' },
  { name: 'Tire',    description: 'Change flat tire with spare',     basePrice: 150, pricePerKm: 10, status: 'Active' },
  { name: 'Winch',   description: 'Pull or tow your vehicle',         basePrice: 300, pricePerKm: 20, status: 'Active' },
]

// Convenience accessor for views that only need names.
export const SERVICE_TYPES = SERVICES.map((s) => s.name)

// Fallback flat price (pre-migration orders fall back here).
export const PRICE_PER_ORDER = 350

// Calculates the total order price based on service and distance.
export const calculateOrderTotal = (serviceName, distance = 5) => {
  const svc = SERVICES.find((s) => s.name === serviceName)
  if (!svc) return PRICE_PER_ORDER
  return svc.basePrice + (distance * (svc.pricePerKm || 0))
}

// Legacy helper for backward compatibility
export const getOrderTotal = (serviceName) => calculateOrderTotal(serviceName, 5)

export const today = '2026-06-26'
export const TODAY = today

// Fixed "now" so the dashboard snapshot is stable for the demo
// and warnings / "today" stats populate correctly.
const SIMULATED_NOW = new Date('2026-06-26T14:00:00')

// ------------------------------------------------------------------
// Random & Data helpers
// ------------------------------------------------------------------
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randFloat = (min, max) => Math.random() * (max - min) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Simple distance calculation between two points in KM
export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const pickSet = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
const padId = (num, pad = 3) => String(num).padStart(pad, '0')

// ------------------------------------------------------------------
// Name, Address and Vehicle data pools
// ------------------------------------------------------------------
const FIRST_NAMES = [
  'Ahmed', 'Omar', 'Khaled', 'Tarek', 'Youssef', 'Mahmoud', 'Ibrahim',
  'Hassan', 'Karim', 'Amr', 'Samir', 'Rami', 'Tamer', 'Wael', 'Ali',
  'Khalil', 'Mostafa', 'Hossam', 'Sherif', 'Ayman', 'Gamal', 'Sayed',
  'Fadi', 'Bassam', 'Wassim', 'Khalid', 'Mazen', 'Kamel', 'Hamdy',
  'Zakaria', 'Mounir', 'Tawfik', 'Fathy', 'Gomaa', 'Saad', 'Hisham',
  'Adel', 'Galal', 'Nabil', 'Salah', 'Medhat', 'Atef', 'Magdy',
  'Ammar', 'Hany', 'Nasser', 'Anwar', 'Fouad', 'Sabry', 'Taha',
]
const LAST_NAMES = [
  'Magdy', 'Hassan', 'Ali', 'Mahmoud', 'Khalil', 'Nour', 'Samir', 'El-Sayed',
  'Farouk', 'Mansour', 'Saeed', 'Omar', 'Rashid', 'Fathi', 'Ismail',
  'Nasser', 'Gabr', 'Hamed', 'Salem', 'Anwar', 'Qassem', 'Badr',
  'Soliman', 'Ezzat', 'Fouad', 'Mokhtar', 'El-Masry', 'Ibrahim', 'Sallam',
  'Radwan', 'Ghaly', 'Shawky', 'Hafez', 'Selim', 'Maher', 'Madkour',
]

export const LOCATIONS = [
  { name: 'Cairo, Zamalek', lat: 30.06, lng: 31.21 },
  { name: 'Cairo, Nasr City', lat: 30.10, lng: 31.33 },
  { name: 'Cairo, Heliopolis', lat: 30.0, lng: 31.28 },
  { name: 'Cairo, Maadi', lat: 29.96, lng: 31.25 },
  { name: 'Cairo, Sheikh Zayed', lat: 30.11, lng: 30.95 },
  { name: 'Cairo, 5th Settlement', lat: 30.01, lng: 31.43 },
  { name: 'Cairo, Downtown', lat: 30.04, lng: 31.23 },
  { name: 'Giza, Mohandessin', lat: 30.04, lng: 31.20 },
  { name: 'Giza, Dokki', lat: 30.04, lng: 31.21 },
  { name: 'Giza, Haram', lat: 29.98, lng: 31.11 },
  { name: 'Giza, 6th of October', lat: 30.03, lng: 30.91 },
  { name: 'Alexandria, Sidi Gaber', lat: 31.21, lng: 29.93 },
  { name: 'Alexandria, Smouha', lat: 31.20, lng: 29.95 },
  { name: 'Alexandria, Gleem', lat: 31.23, lng: 29.96 },
  { name: 'Alexandria, Raml Station', lat: 31.21, lng: 29.91 },
  { name: 'Giza, Imbaba', lat: 30.01, lng: 31.17 },
  { name: 'Cairo, Shubra', lat: 30.08, lng: 31.21 },
  { name: 'Cairo, Ain Shams', lat: 30.12, lng: 31.31 },
  { name: 'Cairo, New Cairo', lat: 30.02, lng: 31.45 },
]

const VEHICLE_PREFIXES = ['Toyota', 'Hyundai', 'Kia', 'Nissan', 'BMW', 'Mercedes', 'Chevrolet', 'Peugeot']
const VEHICLE_TYPES = ['Corolla', 'Verna', 'Rio', 'Sunny', '320i', 'C180', 'Optra', '301']

// Address mapping per location -- used to generate realistic provider addresses.
const STREET_NAMES = {
  'Cairo, Zamalek': ['El-Batal Ahmed Ismail St', 'Taha Hussein St', 'Hassan Sabry St', 'Mohammed Mazhar St'],
  'Cairo, Nasr City': ['Mustafa El-Nahhas St', 'Abbas El-Akkad St', 'Omar Ibn El-Khattab St', 'Ahmed Fouad St'],
  'Cairo, Heliopolis': ['Thawra St', 'El-Merghany St', 'Nabil El-Wakkad St', 'Sultan Hussein St'],
  'Cairo, Maadi': ['Road 9', 'Road 233', 'El-Nasr St', 'Port Said St'],
  'Cairo, Sheikh Zayed': ['Ahmed Zewail St', 'El-Mehwar El-Markazi', 'Mona Badr St', 'Hossam El-Din St'],
  'Cairo, 5th Settlement': ['North Investors Area', 'South Investors Area', 'Al-Fagaly St', 'Garnal Axis'],
  'Cairo, Downtown': ['Talaat Harb St', 'Qasr El-Nil St', 'Ramses St', '26th of July Corridor'],
  'Giza, Mohandessin': ['Sudan St', 'El-Saudi Buildings', 'Ibrahim St', 'Wahat Rd'],
  'Giza, Dokki': ['Tahrir St', 'Mesaha St', 'El-Batal Ahmed Abdel Aziz St', 'Nahya St'],
  'Giza, Haram': ['Faisal St', 'Al-Masad Rd', 'Haram St', 'Abdulrahman Fahmy St'],
  'Giza, 6th of October': ['City Center St', 'El-Pharaana St', 'Mansour St', 'El-Nasr St'],
  'Alexandria, Sidi Gaber': ['El-Horreya Rd', 'Gamal Abdel Nasser St', 'Fawzy Moaz St', 'Amin Fikry St'],
  'Alexandria, Smouha': ['Victor Ammanuiel St', 'El-Gaish Rd', 'Cleopatra St', 'Ibrahimiyyah Canal'],
  'Alexandria, Gleem': ['Abdel Salam Aref St', 'El-Gaish Rd', 'Iskander Bey St', 'Kassem St'],
  'Alexandria, Raml Station': ['Saad Zaghloul St', 'El-Horreya Rd', 'El-Gomrok St', 'Faransa St'],
  'Giza, Imbaba': ['Warraq St', 'Nile Corniche', 'Abdul Moneim Riad St', 'Mataria St'],
  'Cairo, Shubra': ['Shubra St', 'Ramses St extension', 'Khalil Hamada St', 'Gamal Abdel Nasser St'],
  'Cairo, Ain Shams': ['El-Salam St', '10th of Ramadan City Rd', 'Ismailia Desert Rd', 'El-Mattar St'],
  'Cairo, New Cairo': ['90 St', 'Mohammad Naguib Axis', 'Gamal Abdel Nasser Axis', 'Elsayedya St'],
}

const generateAddress = (locationName) => {
  const streets = STREET_NAMES[locationName] || ['Main St', 'Central Ave']
  const num = randInt(1, 150)
  return `${num} ${pick(streets)}, ${locationName}`
}

// ------------------------------------------------------------------
// Generate Providers (250)
//
// Proximity logic keeps regions close to the provider's home city so
// admin reassignments stay geographically sensible.
// ------------------------------------------------------------------
let _providers = []
const usedProviderNames = new Set()

for (let i = 1; i <= 250; i++) {
  let name
  do {
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
  } while (usedProviderNames.has(name))
  usedProviderNames.add(name)

  const isOnline = Math.random() < 0.7
  const services = pickSet(SERVICE_TYPES, randInt(1, 3))
  const loc = pick(LOCATIONS)

  const cityPrefix = loc.name.split(', ')[0]
  const sameCity = LOCATIONS.filter((l) => l.name.startsWith(cityPrefix) && l.name !== loc.name).map((l) => l.name)
  const otherCities = LOCATIONS.filter((l) => !l.name.startsWith(cityPrefix)).map((l) => l.name)

  const regions = [loc.name]
  if (sameCity.length > 0 && Math.random() < 0.85) {
    const extra = pickSet(sameCity, randInt(0, Math.min(3, sameCity.length)))
    regions.push(...extra)
  }
  if (Math.random() < 0.25) {
    const extra = pickSet(otherCities, randInt(0, 1))
    regions.push(...extra)
  }

  let rating = parseFloat(randFloat(2.5, 5.0).toFixed(1))
  if (i <= 4) {
    rating = parseFloat(randFloat(1.2, 1.9).toFixed(1))
  }

  _providers.push({
    id: i,
    name,
    phone: `+20 10 ${randInt(100, 999)} ${randInt(1000, 9999)}`,
    services,
    status: isOnline ? 'Online' : 'Offline',
    available: isOnline ? Math.random() < 0.8 : false,
    rating,
    ordersCompleted: randInt(5, 450),
    location: loc.name,
    lat: loc.lat + randFloat(-0.01, 0.01),
    lng: loc.lng + randFloat(-0.01, 0.01),
    regions: [...new Set(regions)],
    address: generateAddress(loc.name),
  })
}
export let allProviders = _providers

// Make one region under-served for demo (coverage = 0, demand > 0)
const UNDER_SERVED_REGION = 'Cairo, Ain Shams'
allProviders.forEach((p) => {
  p.regions = p.regions.filter((r) => r !== UNDER_SERVED_REGION)
})

// ------------------------------------------------------------------
// Generate Users (450)
// ------------------------------------------------------------------
let _users = []
for (let i = 1; i <= 450; i++) {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
  const roleRoll = Math.random()
  const role = roleRoll < 0.05 ? 'Admin' : roleRoll < 0.15 ? 'Provider' : 'Client'
  _users.push({
    id: i,
    name,
    phone: `+20 ${randInt(10, 12)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
    vehicle: `${pick(VEHICLE_PREFIXES)} ${pick(VEHICLE_TYPES)} - ${pick(['س','ص','ق','ف','و','ن','م'])} ${randInt(10,99)} ${randInt(1,9)}${randInt(1,9)}${randInt(1,9)}`,
    orders: randInt(0, 20),
    role,
    status: Math.random() < 0.95 ? 'Active' : 'Blocked',
  })
}
export let allUsers = _users

// ------------------------------------------------------------------
// Generate Orders (800) with dynamic per-service pricing
// ------------------------------------------------------------------
let _orders = []
const startDate = new Date('2026-04-01T00:00:00')
const endDate = new Date(`${today}T23:59:59`)

for (let i = 1; i <= 800; i++) {
  const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
  const createdAt = date.toISOString().slice(0, 16)
  const user = pick(allUsers)
  const provider = pick(allProviders)
  const loc = pick(LOCATIONS)
  const svcName = pick(SERVICE_TYPES)

  _orders.push({
    id: `#ORD-${padId(i)}`,
    user: user.name,
    userId: user.id,
    phone: user.phone,
    service: svcName,
    location: loc.name,
    lat: loc.lat + randFloat(-0.01, 0.01),
    lng: loc.lng + randFloat(-0.01, 0.01),
    provider: provider.name,
    providerId: provider.id,
    status: pick(['Pending', 'Accepted', 'On Way', 'Arrived', 'Completed', 'Cancelled']),
    createdAt,
    price: getOrderTotal(svcName),
  })
}

// Engineer showcase scenarios: force last 20 orders into specific states
// so stale-pending, stuck on-way, and arrived counts are visible.
const scenarioConfigs = [
  { status: 'Pending',   createdAt: `${today}T12:10` },
  { status: 'Pending',   createdAt: `${today}T12:45` },
  { status: 'Pending',   createdAt: `${today}T13:20` },
  { status: 'Pending',   createdAt: `${today}T13:35` },
  { status: 'Pending',   createdAt: `${today}T13:55` },
  { status: 'Accepted',  createdAt: `${today}T13:30` },
  { status: 'Accepted',  createdAt: `${today}T13:15` },
  { status: 'Accepted',  createdAt: `${today}T14:00` },
  { status: 'On Way',    createdAt: `${today}T12:00` },
  { status: 'On Way',    createdAt: `${today}T12:30` },
  { status: 'On Way',    createdAt: `${today}T12:50` },
  { status: 'On Way',    createdAt: `${today}T13:40` },
  { status: 'Arrived',   createdAt: `${today}T13:50` },
  { status: 'Arrived',   createdAt: `${today}T13:55` },
  { status: 'Arrived',   createdAt: `${today}T14:00` },
  { status: 'Completed', createdAt: `${today}T11:00` },
  { status: 'Completed', createdAt: `${today}T12:15` },
  { status: 'Completed', createdAt: `${today}T13:00` },
  { status: 'Cancelled', createdAt: `${today}T12:45` },
  { status: 'Cancelled', createdAt: `${today}T13:10` },
]

const lastOrders = _orders.slice(-scenarioConfigs.length)
lastOrders.forEach((order, i) => {
  const cfg = scenarioConfigs[i]
  order.status = cfg.status
  order.createdAt = cfg.createdAt
})

export let allOrders = _orders

// ------------------------------------------------------------------
// Entity CRUD helpers
// ------------------------------------------------------------------

// -- Users --
export const createUser = (data) => {
  const id = allUsers.length > 0 ? Math.max(...allUsers.map((u) => u.id)) + 1 : 1
  const newUser = { id, ...data, orders: 0 }
  allUsers.push(newUser)
  return newUser
}

// -- Providers --
export const createProvider = (data) => {
  const id = allProviders.length > 0 ? Math.max(...allProviders.map((p) => p.id)) + 1 : 1
  const newProvider = {
    id,
    ...data,
    status: data.status || 'Offline',
    available: data.available ?? false,
    rating: 0,
    ordersCompleted: 0,
    address: data.address || generateAddress(data.location),
  }
  allProviders.push(newProvider)
  return newProvider
}

// -- Orders --
export const createOrder = (data) => {
  const id = allOrders.length > 0
    ? `#ORD-${padId(Math.max(...allOrders.map((o) => parseInt(o.id.replace('#ORD-', '')))) + 1)}`
    : `#ORD-001`
  
  // Calculate dynamic price based on distance if provider is present, else use default distance (5km)
  let distance = 5
  if (data.providerId) {
    const provider = allProviders.find(p => p.id === data.providerId)
    const loc = LOCATIONS.find(l => l.name === data.location)
    if (provider && loc) {
      distance = getDistance(provider.lat, provider.lng, loc.lat, loc.lng)
    }
  }

  const total = data.price || calculateOrderTotal(data.service, distance)
  const newOrder = {
    id,
    ...data,
    createdAt: data.createdAt || new Date().toISOString().slice(0, 16),
    price: total,
    distance: parseFloat(distance.toFixed(2)),
  }
  allOrders.push(newOrder)
  return newOrder
}

// -- Services --
export const updateService = (name, data) => {
  const idx = SERVICES.findIndex((s) => s.name === name)
  if (idx !== -1) {
    SERVICES[idx] = { ...SERVICES[idx], ...data }
  }
}

// Legacy mutators (kept for current page compatibility)
export const updateUser = (id, data) => {
  const idx = allUsers.findIndex((u) => u.id === id)
  if (idx !== -1) {
    allUsers[idx] = { ...allUsers[idx], ...data }
  }
}

export const updateProvider = (id, data) => {
  const idx = allProviders.findIndex((p) => p.id === id)
  if (idx !== -1) {
    allProviders[idx] = { ...allProviders[idx], ...data }
  }
}

// ------------------------------------------------------------------
// Stats engine  (revenue now sums actual order.price)
// ------------------------------------------------------------------
export const getScopedStats = (scope = 'all', orderList = allOrders, providerList = allProviders) => {
  const todayDate = new Date(TODAY)

  const scopedOrders = orderList.filter((o) => {
    if (scope === 'all') return true
    const d = new Date(o.createdAt)
    switch (scope) {
      case 'today':
        return o.createdAt.startsWith(TODAY)
      case 'week': {
        const weekStart = new Date(todayDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)
        return d >= weekStart && d <= todayDate
      }
      case 'month':
        return o.createdAt.startsWith(TODAY.substring(0, 7))
      case 'year':
        return o.createdAt.startsWith(TODAY.substring(0, 4))
      default:
        return true
    }
  })

  const totalOrders = scopedOrders.length
  const completedOrders = scopedOrders.filter((o) => o.status === 'Completed')
  // Dynamic revenue: sum actual order.price instead of flat PRICE_PER_ORDER
  const revenue = completedOrders.reduce((sum, o) => sum + (o.price || PRICE_PER_ORDER), 0)
  const cancelledCount = scopedOrders.filter((o) => o.status === 'Cancelled').length
  const cancellationRate = totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 100) : 0
  const activeOrders = scopedOrders.filter(
    (o) => o.status === 'Pending' || o.status === 'On Way' || o.status === 'Accepted' || o.status === 'Arrived',
  ).length
  const pendingOrders = scopedOrders.filter((o) => o.status === 'Pending').length
  const avgRating =
    providerList.length > 0
      ? (providerList.reduce((s, p) => s + p.rating, 0) / providerList.length).toFixed(1)
      : '0.0'

  return {
    totalOrders,
    completedOrders: completedOrders.length,
    revenue,
    cancelledCount,
    cancellationRate,
    activeOrders,
    pendingOrders,
    avgRating,
    totalUsers: allUsers.length,
    totalProviders: providerList.length,
    onlineProviders: providerList.filter((p) => p.status === 'Online').length,
    newUsers: allUsers.filter((u) => u.role === 'Client').length,
  }
}

// Legacy alias (all-time scope)
export const getStats = () => getScopedStats('all')

// ------------------------------------------------------------------
// Warnings engine: proactively surface operational issues
// ------------------------------------------------------------------
export const getWarnings = () => {
  const warnings = []

  // Stale pending orders (> 30 min since creation today)
  allOrders.forEach((order) => {
    if (order.status !== 'Pending') return
    const created = new Date(order.createdAt)
    const ageMin = (SIMULATED_NOW - created) / 1000 / 60
    if (ageMin > 30) {
      warnings.push({
        type: 'stale-pending',
        severity: ageMin > 60 ? 'critical' : 'warning',
        order,
        message: `Order ${order.id} has been pending for ${Math.round(ageMin)} minutes`,
      })
    }
  })

  // Stuck in-progress orders (> 60 min)
  allOrders.forEach((order) => {
    if (order.status !== 'On Way') return
    const created = new Date(order.createdAt)
    const ageMin = (SIMULATED_NOW - created) / 1000 / 60
    if (ageMin > 60) {
      warnings.push({
        type: 'stuck-progress',
        severity: ageMin > 120 ? 'critical' : 'warning',
        order,
        message: `Order ${order.id} has been on way for ${Math.round(ageMin)} minutes`,
      })
    }
  })

  // Worst providers (rating < 2.0)
  allProviders
    .filter((p) => p.rating < 2.0)
    .forEach((p) => {
      warnings.push({
        type: 'low-rating',
        severity: 'critical',
        provider: p,
        message: `Provider ${p.name} has a critically low rating: ${p.rating}`,
      })
    })

  // Cancellation rate (if > 10%)
  const cancelled = allOrders.filter((o) => o.status === 'Cancelled').length
  const cancellationRate = Math.round((cancelled / allOrders.length) * 100)
  if (cancellationRate > 10) {
    warnings.push({
      type: 'cancellation-rate',
      severity: cancellationRate > 20 ? 'critical' : 'warning',
      message: `Cancellation rate is ${cancellationRate}% (threshold: 10%)`,
    })
  }

  return warnings
}

// ------------------------------------------------------------------
// Order age utilities
// ------------------------------------------------------------------
export const getOrderAge = (createdAt) => {
  const created = new Date(createdAt)
  return Math.round((SIMULATED_NOW - created) / 1000 / 60)
}

export const isCriticalOrder = (order) => {
  const ageMin = getOrderAge(order.createdAt)
  if (order.status === 'Pending' && ageMin > 30) return true
  if (order.status === 'On Way' && ageMin > 60) return true
  return false
}

// ------------------------------------------------------------------
// Provider eligibility: online + available + service match + region match
// ------------------------------------------------------------------
export const getAssignableProviders = (service, providerList = allProviders, orderLocation = null) => {
  return providerList.filter((p) => {
    const isOnline = p.status === 'Online'
    const isAvailable = p.available === true
    const hasService = p.services.includes(service)
    const coversRegion = !orderLocation || (p.regions && p.regions.includes(orderLocation))
    return isOnline && isAvailable && hasService && coversRegion
  })
}

// ------------------------------------------------------------------
// Region Analytics
// ------------------------------------------------------------------
export const getRegionDemand = (orderList = allOrders) => {
  const demand = {}
  orderList.forEach((o) => {
    demand[o.location] = (demand[o.location] || 0) + 1
  })
  return Object.entries(demand).sort(([, a], [, b]) => b - a)
}

export const getRegionCoverage = () => {
  const coverage = {}
  allProviders.forEach((p) => {
    p.regions.forEach((r) => {
      coverage[r] = (coverage[r] || 0) + 1
    })
  })
  return coverage
}

export const getCoverageGap = (orderList = allOrders) => {
  const demand = {}
  orderList.forEach((o) => {
    demand[o.location] = (demand[o.location] || 0) + 1
  })
  const coverage = getRegionCoverage()
  const allRegionNames = [...new Set([...Object.keys(demand), ...Object.keys(coverage)])]
  return allRegionNames
    .map((name) => ({
      region: name,
      demand: demand[name] || 0,
      coverage: coverage[name] || 0,
    }))
    .sort((a, b) => b.demand - a.demand)
}
