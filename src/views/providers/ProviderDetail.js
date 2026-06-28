import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CCard, CCardBody, CCol, CRow,
  CButton, CFormInput, CFormSelect, CBadge, CSpinner,
  CAlert, CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser, cilPhone, cilStar, cilTruck, cilLocationPin,
  cilList, cilArrowLeft, cilPencil, cilCheck, cilX, cilBan,
  cilCalendar, cilShieldAlt, cilInfo, cilCheckCircle, cilXCircle
} from '@coreui/icons'
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { allProviders, allOrders, LOCATIONS, updateProvider, SERVICE_TYPES } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const providerMainIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const regionDotOptions = {
  radius: 8,
  fillColor: '#0d6efd',
  color: '#0d6efd',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.5,
}

const statusBadgeColor = {
  Pending: 'warning',
  Accepted: 'info',
  'In Progress': 'primary',
  Completed: 'success',
  Cancelled: 'danger',
}

const MapController = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 12)
  }, [center, map])
  return null
}

const RegionCheckbox = React.memo(({ loc, checked, onChange }) => {
  return (
    <div className="mb-2" style={{ whiteSpace: 'normal', lineHeight: '1.4' }}>
      <CFormCheck
        label={loc.name}
        checked={checked}
        onChange={() => onChange(loc.name)}
      />
    </div>
  )
})

const ProviderDetail = () => {
  const { id } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()

  const [provider, setProvider] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [showSaveAlert, setShowSaveAlert] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const providerId = Number(decodedId)
    const foundProvider = allProviders.find((p) => p.id === providerId)
    if (foundProvider) {
      setProvider(foundProvider)
      setEditForm({ ...foundProvider })
    }
  }, [decodedId])

  const providerOrders = provider
    ? allOrders.filter((o) => o.providerId === provider.id)
    : []

  const handleSave = () => {
    if (!editForm.services || editForm.services.length === 0) {
      setError('Provider must have at least one service.')
      return
    }
    if (!editForm.regions || editForm.regions.length === 0) {
      setError('Provider must cover at least one region.')
      return
    }
    setError(null)
    const changes = []
    if (JSON.stringify(editForm.services) !== JSON.stringify(provider.services)) changes.push('services')
    if (JSON.stringify(editForm.regions) !== JSON.stringify(provider.regions)) changes.push('regions')
    if (editForm.status !== provider.status) changes.push(`status: ${provider.status} → ${editForm.status}`)
    if (editForm.available !== provider.available) changes.push(`availability: ${provider.available ? 'Available' : 'Unavailable'} → ${editForm.available ? 'Available' : 'Unavailable'}`)
    const details = changes.length > 0
      ? `Updated provider "${provider.name}" (ID: ${provider.id}). Changes: ${changes.join(', ')}`
      : `Updated provider "${provider.name}" (ID: ${provider.id}) (no field changes).`
    addChangelogEntry({
      action: 'Provider Updated',
      targetType: 'Provider',
      targetId: provider.id,
      targetName: provider.name,
      details,
    })
    const updated = { ...editForm }
    updateProvider(provider.id, updated)
    setProvider({ ...provider, ...updated })
    setIsEditing(false)
    setShowSaveAlert(true)
    setTimeout(() => setShowSaveAlert(false), 3000)
  }

  const handleCancelEdit = () => {
    setEditForm({ ...provider })
    setIsEditing(false)
    setError(null)
  }

  const toggleService = (svc) => {
    const current = editForm.services || []
    const updated = current.includes(svc)
      ? current.filter((s) => s !== svc)
      : [...current, svc]
    setEditForm({ ...editForm, services: updated })
  }

  const toggleRegion = (regionName) => {
    const current = editForm.regions || []
    const updated = current.includes(regionName)
      ? current.filter((r) => r !== regionName)
      : [...current, regionName]
    setEditForm({ ...editForm, regions: updated })
  }

  if (!provider) {
    return (
      <div className="p-5 text-center">
        <CSpinner />
        <div className="mt-2">Loading provider...</div>
      </div>
    )
  }

  const regionLocations = provider.regions
    .map((name) => LOCATIONS.find((l) => l.name === name))
    .filter(Boolean)

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 p-3 bg-body border-bottom">
        <CButton color="secondary" size="sm" onClick={() => navigate('/providers')}>
          <CIcon icon={cilArrowLeft} size="sm" className="me-1" /> Back to Providers
        </CButton>
        <h4 className="mb-0">Provider Detail</h4>
      </div>

      {showSaveAlert && (
        <CAlert color="success" className="m-3" dismissible onClose={() => setShowSaveAlert(false)}>
          Provider updated successfully.
        </CAlert>
      )}

      {error && (
        <CAlert color="danger" className="m-3" dismissible onClose={() => setError(null)}>
          {error}
        </CAlert>
      )}

      <CRow className="g-0" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left: Provider Information */}
        <CCol md={3} className="bg-body border-end p-4 d-flex flex-column" style={{ height: '100%', overflow: 'auto' }}>
          <h5 className="text-body d-flex align-items-center gap-2">
            <CIcon icon={cilUser} size="lg" /> Provider Info
          </h5>
          <hr className="border-top border-secondary" />
          <div className="mb-3">
            <label className="text-medium-emphasis small">Name</label>
            <div className="fw-semibold text-body">{provider.name}</div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Phone</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilPhone} size="sm" /> {provider.phone}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Rating</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilStar} size="sm" className="text-warning" />
              {provider.rating} / 5
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Current Location</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilLocationPin} size="sm" /> {provider.location}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Address</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilLocationPin} size="sm" /> {provider.address}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Orders Completed</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilList} size="sm" /> {provider.ordersCompleted}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Status</label>
            <div>
              <CBadge color={provider.status === 'Online' ? 'success' : 'secondary'}>{provider.status}</CBadge>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Availability</label>
            <div>
              <CBadge color={provider.available ? 'info' : 'secondary'}>
                {provider.available ? 'Available' : 'Unavailable'}
              </CBadge>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Covered Regions</label>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {provider.regions.map((r) => (
                <CBadge color="light" textColor="dark" className="border" key={r}>{r}</CBadge>
              ))}
            </div>
          </div>
        </CCol>

        {/* Center: Map with Regions */}
        <CCol md={6} className="p-0" style={{ height: '100%', position: 'relative' }}>
          <MapContainer
            center={[provider.lat, provider.lng]}
            zoom={13}
            maxBounds={[[22, 24], [32, 36]]}
            minZoom={7}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={[provider.lat, provider.lng]} />

            {/* Provider location */}
            <Marker position={[provider.lat, provider.lng]} icon={providerMainIcon}>
              <Popup>{provider.name} (Current Location)</Popup>
            </Marker>

            {/* Served regions */}
            {regionLocations.map((loc) => (
              <CircleMarker
                key={loc.name}
                center={[loc.lat, loc.lng]}
                pathOptions={regionDotOptions}
              >
                <Popup>{loc.name}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="position-absolute bottom-0 start-0 m-3" style={{ zIndex: 1000 }}>
            <CCard className="shadow-sm border-primary bg-body">
              <CCardBody className="py-2 px-3">
                <div className="small text-medium-emphasis mb-1">Map Legend</div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img src="https://cdn-icons-png.flaticon.com/512/1048/1048329.png" width="20" height="20" alt="provider" />
                  <span className="small">Current Location</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#0d6efd' }} />
                  <span className="small">Served Region</span>
                </div>
              </CCardBody>
            </CCard>
          </div>
        </CCol>

        {/* Right: Management Panel */}
        <CCol md={3} className="bg-body border-start p-4 overflow-auto" style={{ height: '100%' }}>
          <div className="mb-3">
            <h5 className="mb-2 text-body d-flex align-items-center gap-2">
              <CIcon icon={cilShieldAlt} size="lg" /> Management
            </h5>
            {!isEditing ? (
              <CButton color="primary" onClick={() => { setEditForm({ ...provider }); setIsEditing(true) }}
                className="w-100 d-flex align-items-center justify-content-center gap-2">
                <CIcon icon={cilPencil} /> Edit Provider
              </CButton>
            ) : (
              <CButton color="secondary" variant="outline" onClick={handleCancelEdit}
                className="w-100 d-flex align-items-center justify-content-center gap-2">
                <CIcon icon={cilX} /> Cancel Edit
              </CButton>
            )}
          </div>
          <hr className="border-top border-secondary mb-3" />

          {!isEditing ? (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Quick Actions</label>
                <div className="small text-secondary mb-2">
                  <CIcon icon={cilInfo} size="sm" className="me-1" />
                  Use Edit to change services, regions, and availability.
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {/* Services */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Services</label>
                <div className="d-flex flex-column gap-1">
                  {SERVICE_TYPES.map((svc) => (
                    <CFormCheck
                      key={svc}
                      label={svc}
                      checked={editForm.services?.includes(svc)}
                      onChange={() => toggleService(svc)}
                    />
                  ))}
                </div>
              </div>

              {/* Regions */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Regions Covered</label>
                <div 
                  className="d-flex flex-column gap-1" 
                  style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    overflowX: 'hidden',
                    paddingRight: '5px' 
                  }}
                >
                  {LOCATIONS.map((loc) => (
                    <RegionCheckbox
                      key={loc.name}
                      loc={loc}
                      checked={editForm.regions?.includes(loc.name)}
                      onChange={toggleRegion}
                    />
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Status</label>
                <CFormSelect
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </CFormSelect>
              </div>

              {/* Availability */}
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Available for Orders</label>
                <CFormSelect
                  value={editForm.available ? 'true' : 'false'}
                  onChange={(e) => setEditForm({ ...editForm, available: e.target.value === 'true' })}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </CFormSelect>
              </div>

              {/* Save/Discard */}
              <div className="d-flex gap-2 mt-2">
                <CButton color="success" onClick={handleSave} className="d-flex align-items-center gap-2 flex-fill justify-content-center">
                  <CIcon icon={cilCheck} size="sm" /> Save
                </CButton>
                <CButton color="secondary" variant="outline" onClick={handleCancelEdit} className="flex-fill">
                  Discard
                </CButton>
              </div>
            </div>
          )}
        </CCol>
      </CRow>
    </div>
  )
}

export default ProviderDetail
