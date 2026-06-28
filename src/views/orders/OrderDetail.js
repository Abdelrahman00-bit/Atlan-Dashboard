import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CCard, CCardBody, CCol, CRow,
  CButton, CFormInput, CFormSelect, CBadge, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheck, cilX, cilPencil, cilTrash, cilUser, cilPhone,
  cilDollar, cilClock, cilSpeedometer, cilTruck, cilShieldAlt,
  cilLocationPin, cilArrowThickRight, cilBan, cilList,
  cilCalendar, cilInfo, cilWarning
} from '@coreui/icons'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { allOrders, allProviders, isCriticalOrder, getAssignableProviders } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const providerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})
const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})
const criticalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
})

const statusColors = {
  Pending: 'var(--cui-warning)',
  Accepted: 'var(--cui-info)',
  'On Way': 'var(--cui-primary)',
  Arrived: 'var(--cui-secondary)',
  Completed: 'var(--cui-success)',
  Cancelled: 'var(--cui-danger)',
}
const statusBadgeColor = {
  Pending: 'warning',
  Accepted: 'info',
  'On Way': 'primary',
  Arrived: 'secondary',
  Completed: 'success',
  Cancelled: 'danger',
}

const ALLOWED_TRANSITIONS = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['On Way', 'Cancelled'],
  'On Way': ['Arrived', 'Cancelled'],
  Arrived: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
}

const canAssignProvider = (status) => ['Pending', 'Accepted', 'On Way'].includes(status)
const canChangePrice = (status) => ['Pending', 'Accepted', 'On Way'].includes(status)
const canCancel = (status) => ['Pending', 'Accepted', 'On Way', 'Arrived'].includes(status)
const isTerminal = (status) => status === 'Completed' || status === 'Cancelled'

const MapController = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 13)
  }, [center, map])
  return null
}

const OrderDetail = () => {
  const { id } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [route, setRoute] = useState(null)
  const [eta, setEta] = useState(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showSaveAlert, setShowSaveAlert] = useState(false)

  useEffect(() => {
    const foundOrder = allOrders.find(o => o.id === decodedId)
    if (foundOrder) {
      setOrder(foundOrder)
      setEditForm({ ...foundOrder })
      fetchRoute(foundOrder)
    }
  }, [decodedId])

  const fetchRoute = async (orderData) => {
    const prov = allProviders.find(p => p.name === orderData.provider)
    if (!prov) return

    setIsLoadingRoute(true)
    try {
      // Simulate a route with straight polyline and mock ETA (no external API needed for demo)
      const straightLine = generateStraightLine([prov.lat, prov.lng], [orderData.lat, orderData.lng], 20)
      setRoute(straightLine)
      // Mock ETA based on ~50 km/h average speed
      const dx = prov.lng - orderData.lng
      const dy = prov.lat - orderData.lat
      const distKm = Math.sqrt(dx * dx + dy * dy) * 111 // rough km
      setEta({
        distance: distKm.toFixed(1),
        time: Math.max(5, Math.round((distKm / 50) * 60)) // minutes
      })
    } catch (e) {
      console.error("Routing error", e)
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

  const handleSave = () => {
    const changes = []
    if (editForm.status !== order.status) changes.push(`status: ${order.status} → ${editForm.status}`)
    if (editForm.provider !== order.provider) changes.push(`provider: ${order.provider || 'None'} → ${editForm.provider || 'None'}`)
    if (editForm.price !== order.price) changes.push(`price: ${order.price} → ${editForm.price}`)
    const details = changes.length > 0
      ? `Updated order ${order.id}. Changes: ${changes.join(', ')}`
      : `Updated order ${order.id} (no field changes).`
    addChangelogEntry({
      action: 'Order Updated',
      targetType: 'Order',
      targetId: order.id,
      targetName: order.id,
      details,
    })
    setOrder({ ...editForm })
    setIsEditing(false)
    setShowSaveAlert(true)
    setTimeout(() => setShowSaveAlert(false), 3000)
    if (editForm.provider !== order.provider) {
      fetchRoute(editForm)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({ ...order })
    setIsEditing(false)
  }

  const handleCancelOrder = () => {
    addChangelogEntry({
      action: 'Order Cancelled',
      targetType: 'Order',
      targetId: order.id,
      targetName: order.id,
      details: `Cancelled order ${order.id} for user "${order.user}". Service: ${order.service}`,
    })
    setOrder({ ...order, status: 'Cancelled' })
    setEditForm({ ...editForm, status: 'Cancelled' })
    setShowCancelModal(false)
    setIsEditing(false)
    setShowSaveAlert(true)
    setTimeout(() => setShowSaveAlert(false), 3000)
  }

  if (!order) return <div className="p-5 text-center"><CSpinner /> Loading order...</div>

  const provider = allProviders.find(p => p.name === order.provider)
  const assignableProviders = getAssignableProviders(order.service, allProviders)
  const editAssignableProviders = getAssignableProviders(editForm.service || order.service, allProviders)

  const allowedStatuses = ALLOWED_TRANSITIONS[editForm.status] || []
  const orderIsTerminal = isTerminal(order.status)

  const progressWidth = order.status === 'Completed' ? '100%'
    : order.status === 'Arrived' ? '80%'
    : order.status === 'On Way' ? '60%'
    : order.status === 'Accepted' ? '30%'
    : order.status === 'Cancelled' ? '0%'
      : '10%'
  
  const statusSteps = ['Pending', 'Accepted', 'On Way', 'Arrived', 'Completed']
  const statusIndex = statusSteps.indexOf(order.status)

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 p-3 bg-body border-bottom">
        <CButton color="secondary" size="sm" onClick={() => navigate('/orders')}>
          &larr; Back to Orders
        </CButton>
        <h4 className="mb-0">Order Detail: {order.id}</h4>
        {isCriticalOrder(order) && (
          <CBadge color="danger" className="ms-2" style={{ fontSize: '0.85rem', padding: '0.4em 0.6em' }}>
            <CIcon icon={cilWarning} size="sm" className="me-1" /> Critical
          </CBadge>
        )}
      </div>

      {showSaveAlert && (
        <CAlert color="success" className="m-3" dismissible onClose={() => setShowSaveAlert(false)}>
          Order updated successfully.
        </CAlert>
      )}

      <CRow className="g-0" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left: Order Information */}
        <CCol md={3} className="bg-body border-end p-4 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
          <h5 className="text-body d-flex align-items-center gap-2">
            <CIcon icon={cilList} size="lg" /> Order Info
          </h5>
          <hr className="border-top border-secondary" />
          <div className="mb-3">
            <label className="text-medium-emphasis small">Customer</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilUser} size="sm" /> {order.user}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Phone</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilPhone} size="sm" /> {order.phone}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Service</label>
            <div><CBadge color="secondary">{order.service}</CBadge></div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Location</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilLocationPin} size="sm" /> {order.location}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Created At</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilCalendar} size="sm" /> {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Price</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilDollar} size="sm" /> {order.price} EGP
            </div>
          </div>
        </CCol>

        {/* Center: Map tracking */}
        <CCol md={6} className="p-0" style={{ height: '100%', position: 'relative' }}>
          <MapContainer
            center={[order.lat, order.lng]}
            zoom={13}
            maxBounds={[[22, 24], [32, 36]]}
            minZoom={7}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={[order.lat, order.lng]} />

            <Marker position={[order.lat, order.lng]} icon={isCriticalOrder(order) ? criticalIcon : pickupIcon}>
              <Popup>Order: {order.id} - Customer: {order.user} ({isCriticalOrder(order) ? 'Critical' : 'Normal'})</Popup>
            </Marker>

            {provider && (
              <Marker position={[provider.lat, provider.lng]} icon={providerIcon}>
                <Popup>Provider: {provider.name}</Popup>
              </Marker>
            )}

            {route && <Polyline positions={route} color="#0d6efd" weight={5} opacity={0.7} />}
          </MapContainer>

          {eta && (
            <div className="position-absolute top-0 start-50 translate-middle-x m-3" style={{ zIndex: 1000 }}>
              <CCard className="shadow-sm border-primary bg-body">
                <CCardBody className="py-2 px-3 text-center">
                  <div className="small text-medium-emphasis">Estimated Arrival</div>
                  <div className="fw-bold text-primary">{eta.time} mins ({eta.distance} km)</div>
                </CCardBody>
              </CCard>
            </div>
          )}
        </CCol>

        {/* Right: Enhanced Management Panel */}
        <CCol md={3} className="bg-body border-start p-4 overflow-auto" style={{ height: '100%' }}>

          {/* Header */}
          <div className="mb-3">
            <h5 className="mb-2 text-body d-flex align-items-center gap-2">
              <CIcon icon={cilShieldAlt} size="lg" /> Management
            </h5>
            {!orderIsTerminal && !isEditing && (
              <CButton color="primary" onClick={() => { setEditForm({ ...order }); setIsEditing(true) }}
                className="w-100 d-flex align-items-center justify-content-center gap-2">
                <CIcon icon={cilPencil} /> Edit Order
              </CButton>
            )}
            {isEditing && (
              <CButton color="secondary" variant="outline" onClick={handleCancelEdit}
                className="w-100 d-flex align-items-center justify-content-center gap-2">
                <CIcon icon={cilX} /> Cancel Edit
              </CButton>
            )}
          </div>
          <hr className="border-top border-secondary mb-3" />

          {/* Status Stepper */}
          <div className="mb-4">
            <label className="text-medium-emphasis small d-flex align-items-center gap-1 mb-2">
              <CIcon icon={cilSpeedometer} size="sm" /> Status Timeline
            </label>
            <div className="d-flex flex-column gap-0 mt-2">
              {statusSteps.map((s, idx) => {
                const isActive = order.status === s
                const isPast = statusIndex > idx
                const isCurrent = isActive
                return (
                  <div key={s} className="d-flex align-items-start gap-2" style={{ position: 'relative' }}>
                    {idx > 0 && (
                      <div style={{
                        position: 'absolute',
                        left: '7px',
                        top: '-8px',
                        width: '2px',
                        height: 'calc(50% + 1px)',
                        backgroundColor: isPast || isCurrent ? statusColors[s] || statusColors['In Progress'] : 'var(--cui-gray-600)',
                        zIndex: 0
                      }} />
                    )}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? statusColors[s] : isPast ? statusColors[s] : 'var(--cui-gray-600)',
                      border: isCurrent ? '3px solid var(--cui-body-bg)' : 'none',
                      boxShadow: isCurrent ? '0 0 0 2px var(--cui-border-color)' : 'none',
                      flexShrink: 0,
                      marginTop: '2px',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isCurrent && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                    </div>
                    <span className={isCurrent ? 'fw-bold text-body' : 'text-medium-emphasis'} style={{ fontSize: '0.9rem' }}>
                      {s}
                    </span>
                  </div>
                )
              })}
              {order.status === 'Cancelled' && (
                <div className="d-flex align-items-center gap-2 mt-1" style={{ marginLeft: '2px' }}>
                  <CIcon icon={cilBan} size="sm" className="text-danger" />
                  <span className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>Cancelled</span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Provider Card */}
          <div className="mb-4 p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
            <label className="text-medium-emphasis small d-flex align-items-center gap-1 mb-1">
              <CIcon icon={cilTruck} size="sm" /> Assigned Provider
            </label>
            <div className="fw-semibold text-body" style={{ fontSize: '1rem' }}>
              {order.provider || <span className="text-medium-emphasis fst-italic">None</span>}
            </div>
          </div>

          {/* Trip Progress Card */}
          <div className="p-3 rounded border mb-4">
            <div className="text-medium-emphasis small d-flex align-items-center gap-1 mb-2">
              <CIcon icon={cilArrowThickRight} size="sm" /> Trip Progress
            </div>
            <div className="progress" style={{ height: '10px', borderRadius: '5px' }}>
              <div
                className={`progress-bar ${order.status === 'Cancelled' ? 'bg-danger' : 'bg-primary'}`}
                style={{ width: progressWidth }}
              ></div>
            </div>
            <div className="d-flex justify-content-between mt-2 small text-medium-emphasis">
              <span>Start</span>
              <span>{order.status === 'Cancelled' ? 'Cancelled' : 'Destination'}</span>
            </div>
          </div>

          {/* Terminal state notice */}
          {orderIsTerminal && !isEditing && (
            <CAlert color={order.status === 'Completed' ? 'success' : 'danger'} className="mb-3 d-flex align-items-center gap-2">
              <CIcon icon={order.status === 'Completed' ? cilCheck : cilBan} size="sm" />
              <span>This order is <strong>{order.status}</strong>. No further actions can be taken.</span>
            </CAlert>
          )}

          {/* Quick Actions */}
          {!isEditing && !orderIsTerminal && (
            <div className="p-3 rounded border mb-3" style={{ backgroundColor: 'rgba(var(--cui-primary-rgb), 0.05)' }}>
              <label className="text-medium-emphasis small d-flex align-items-center gap-1 mb-2">
                <CIcon icon={cilInfo} size="sm" /> Quick Actions
              </label>
              {canCancel(order.status) && (
                <CButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <CIcon icon={cilBan} size="sm" /> Cancel Order
                </CButton>
              )}
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="d-flex flex-column gap-3">

              {/* Edit Mode: Status */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-flex align-items-center gap-1 mb-2">
                  <CIcon icon={cilSpeedometer} size="sm" /> Change Status
                </label>
                <CFormSelect
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value={order.status}>{order.status} (current)</option>
                  {allowedStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {allowedStatuses.length === 0 && orderIsTerminal && (
                    <option disabled>No transitions allowed</option>
                  )}
                </CFormSelect>
                {allowedStatuses.length === 0 && !orderIsTerminal && (
                  <div className="text-medium-emphasis mt-2" style={{ fontSize: '0.75rem' }}>
                    <CIcon icon={cilInfo} size="sm" className="me-1" />
                    Current status has no allowed transitions. Cancel the order if needed.
                  </div>
                )}
              </div>

              {/* Edit Mode: Provider */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-flex align-items-center gap-1 mb-2">
                  <CIcon icon={cilTruck} size="sm" /> {order.provider ? 'Reassign Provider' : 'Assign Provider'}
                </label>
                {canAssignProvider(editForm.status) ? (
                  <CFormSelect
                    value={editForm.provider}
                    onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                  >
                    <option value="">-- Select Provider --</option>
                    {editAssignableProviders.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.phone})</option>
                    ))}
                    {!editForm.provider && order.provider && (
                      <option value={order.provider}>{order.provider} (current)</option>
                    )}
                    {editAssignableProviders.length === 0 && (
                      <option disabled>No available providers for {order.service}</option>
                    )}
                  </CFormSelect>
                ) : (
                  <CAlert color="warning" className="py-1 px-2 mt-1 mb-0" style={{ fontSize: '0.8rem' }}>
                    Cannot assign provider to a {editForm.status.toLowerCase()} order.
                  </CAlert>
                )}
              </div>

              {/* Edit Mode: Price */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-flex align-items-center gap-1 mb-2">
                  <CIcon icon={cilDollar} size="sm" /> Price (EGP)
                </label>
                {canChangePrice(editForm.status) ? (
                  <CFormInput
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  />
                ) : (
                  <CAlert color="warning" className="py-1 px-2 mt-1 mb-0" style={{ fontSize: '0.8rem' }}>
                    Cannot change price for a {editForm.status.toLowerCase()} order.
                  </CAlert>
                )}
              </div>

              {/* Edit Mode: Save/Discard Buttons */}
              <div className="d-flex gap-2 mt-2">
                <CButton color="success" onClick={handleSave} className="d-flex align-items-center gap-2 flex-fill justify-content-center">
                  <CIcon icon={cilCheck} size="sm" /> Save
                </CButton>
                <CButton color="secondary" variant="outline" onClick={handleCancelEdit} className="flex-fill">
                  Discard
                </CButton>
              </div>

              {canCancel(editForm.status) && (
                <CButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="w-100 d-flex align-items-center justify-content-center gap-2 mt-1"
                >
                  <CIcon icon={cilBan} size="sm" /> Cancel Order
                </CButton>
              )}
            </div>
          )}
        </CCol>
      </CRow>

      {/* Cancel Confirmation Modal */}
      <CModal visible={showCancelModal} onClose={() => setShowCancelModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Cancel Order</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Are you sure you want to cancel order <strong>{order.id}</strong>?</p>
          <p className="text-medium-emphasis mb-0">
            Customer: {order.user} | Service: {order.service}
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCancelModal(false)}>Keep Order</CButton>
          <CButton color="danger" onClick={handleCancelOrder}>Yes, Cancel</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default OrderDetail
