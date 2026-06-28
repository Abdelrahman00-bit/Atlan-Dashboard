import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useLocation, useNavigate } from 'react-router-dom'
import { CCard, CCardBody, CButton, CBadge, CSpinner } from '@coreui/react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { allOrders, allProviders, isCriticalOrder } from '../../data/sharedData'

// Fix for Leaflet default marker icons in React
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Custom Icons for Providers and Orders
const providerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Pickup/location icon for regular orders
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const criticalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png', // Red alert icon
  iconSize: [38, 38],
  iconAnchor: [19, 38],
})

// Component to handle map centering/zooming when order changes
const MapController = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

const LiveMap = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  const rawOrderId = query.get('orderId')
  const orderId = rawOrderId ? decodeURIComponent(rawOrderId) : null

  const [route, setRoute] = useState(null)
  const [eta, setEta] = useState(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Filter data for the map
  const activeProviders = useMemo(() => allProviders.filter(p => p.status === 'Online'), [])
  const allOrdersMapped = useMemo(() => allOrders, [])

  // Helper to determine icon based on order criticality
  const getOrderIcon = (order) => {
    if (isCriticalOrder(order)) {
      return criticalIcon;
    }
    return pickupIcon; // Regular order pickup icon
  }


  // Handle Order Tracking
  useEffect(() => {
    if (orderId) {
      const order = allOrders.find(o => o.id === orderId)
      if (order) {
        const provider = allProviders.find(p => p.name === order.provider)
        if (provider) {
          fetchRoute(provider, order)
        }
      }
    } else {
      setRoute(null)
      setEta(null)
    }
  }, [orderId])

  const fetchRoute = async (provider, order) => {
    setIsLoadingRoute(true)
    try {
      // Simulate a straight-line route and mock ETA (no external API needed for demo)
      const straightLine = generateStraightLine([provider.lat, provider.lng], [order.lat, order.lng], 20)
      // Mock distance/ETA based on ~50 km/h average speed
      const dx = provider.lng - order.lng
      const dy = provider.lat - order.lat
      const distKm = Math.sqrt(dx * dx + dy * dy) * 111
      setRoute(straightLine)
      setEta({
        distance: distKm.toFixed(1),
        time: Math.max(5, Math.round((distKm / 50) * 60)) // minutes
      })
    } catch (e) {
      console.error("Routing error:", e)
    } finally {
      setIsLoadingRoute(false)
    }
  }

  const generateStraightLine = (start, end, segments) => {
    const coords = []
    for (let i = 0; i <= segments; i++) {
      const lat = start[0] + (end[0] - start[0]) * (i / segments)
      const lng = start[1] + (end[1] - start[1]) * (i / segments)
      coords.push([lat, lng])
    }
    return coords
  }

  // Default map center (Cairo)
  const defaultCenter = [30.0444, 31.2357]
  
  // If tracking, center on the order
  const trackingOrder = allOrders.find(o => o.id === orderId)
  const center = trackingOrder ? [trackingOrder.lat, trackingOrder.lng] : defaultCenter
  const zoom = trackingOrder ? 13 : 11

  return (
    <div className="position-relative" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        maxBounds={[[22, 24], [32, 36]]} 
        minZoom={7}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />

        {/* All Online Providers */}
        {activeProviders.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={providerIcon}>
            <Popup>
              <strong>{p.name}</strong><br />
              Status: {p.status} | Rating: {p.rating}
            </Popup>
          </Marker>
        ))}

        {/* All Pending/Active Orders */}
        {allOrdersMapped.map(o => (
          <Marker key={o.id} position={[o.lat, o.lng]} icon={getOrderIcon(o)}>
            <Popup>
              <strong>Order {o.id}</strong><br />
              Service: {o.service}<br />
              User: {o.user}
            </Popup>
          </Marker>
        ))}

        {/* Tracking Route */}
        {route && <Polyline positions={route} color="#0d6efd" weight={5} opacity={0.7} />}
      </MapContainer>

      {/* Tracking Overlay Panel */}
      {orderId && (
        <div className="position-absolute top-0 start-0 m-4" style={{ width: '300px', zIndex: 1000 }}>
          <CCard className="shadow-lg bg-body">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0 text-body">Tracking Order</h5>
                <CButton color="secondary" size="sm" onClick={() => navigate('/orders')}>Close</CButton>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis small">Order ID</div>
                <div className="fw-bold text-body">{orderId}</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis small">Status</div>
                <CBadge color="info">In Transit</CBadge>
              </div>
              {isLoadingRoute ? (
                <div className="text-center py-3">
                  <CSpinner size="sm" /> Calculating route...
                </div>
              ) : eta ? (
                <div className="bg-body-tertiary p-3 rounded border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-medium-emphasis">Distance:</span>
                    <span className="fw-semibold text-body">{eta.distance} km</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-medium-emphasis">Est. Arrival:</span>
                    <span className="fw-bold text-primary">{eta.time} mins</span>
                  </div>
                </div>
              ) : (
                <div className="text-danger small">Route not found.</div>
              )}
            </CCardBody>
          </CCard>
        </div>
      )}
    </div>
  )
}

export default LiveMap
