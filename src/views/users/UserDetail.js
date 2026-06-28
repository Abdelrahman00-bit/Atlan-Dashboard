import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CCard, CCardBody, CCol, CRow,
  CButton, CFormInput, CFormSelect, CBadge, CSpinner,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser, cilPhone, cilTruck, cilList, cilArrowLeft,
  cilPencil, cilCheck, cilX, cilBan, cilCalendar,
  cilLocationPin, cilShieldAlt, cilInfo
} from '@coreui/icons'
import { allUsers, allOrders, updateUser } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'

const roleConfig = {
  Client:   { color: 'info',    label: 'Client' },
  Admin:    { color: 'danger',  label: 'Admin' },
  Provider: { color: 'success', label: 'Provider' },
}

const statusBadgeColor = {
  Pending: 'warning',
  Accepted: 'info',
  'In Progress': 'primary',
  Completed: 'success',
  Cancelled: 'danger',
}

const UserDetail = () => {
  const { id } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [showSaveAlert, setShowSaveAlert] = useState(false)

  useEffect(() => {
    const userId = Number(decodedId)
    const foundUser = allUsers.find((u) => u.id === userId)
    if (foundUser) {
      setUser(foundUser)
      setEditForm({ ...foundUser })
    }
  }, [decodedId])

  const userOrders = user
    ? allOrders.filter((o) => o.userId === user.id)
    : []

  const handleSave = () => {
    const changes = []
    if (editForm.name !== user.name) changes.push(`name: ${user.name} → ${editForm.name}`)
    if (editForm.phone !== user.phone) changes.push(`phone: ${user.phone} → ${editForm.phone}`)
    if (editForm.vehicle !== user.vehicle) changes.push(`vehicle: ${user.vehicle} → ${editForm.vehicle}`)
    if (editForm.role !== user.role) changes.push(`role: ${user.role} → ${editForm.role}`)
    if (editForm.status !== user.status) changes.push(`status: ${user.status} → ${editForm.status}`)
    const details = changes.length > 0
      ? `Updated user "${user.name}" (ID: ${user.id}). Changes: ${changes.join(', ')}`
      : `Updated user "${user.name}" (ID: ${user.id}) (no field changes).`
    addChangelogEntry({
      action: 'User Updated',
      targetType: 'User',
      targetId: user.id,
      targetName: user.name,
      details,
    })
    const updated = { ...editForm }
    updateUser(user.id, updated)
    setUser({ ...user, ...updated })
    setIsEditing(false)
    setShowSaveAlert(true)
    setTimeout(() => setShowSaveAlert(false), 3000)
  }

  const handleCancelEdit = () => {
    setEditForm({ ...user })
    setIsEditing(false)
  }

  const toggleBlock = () => {
    const newStatus = user.status === 'Active' ? 'Blocked' : 'Active'
    const actionVerb = newStatus === 'Blocked' ? 'Blocked' : 'Unblocked'
    updateUser(user.id, { status: newStatus })
    setUser({ ...user, status: newStatus })
    setEditForm({ ...editForm, status: newStatus })
    addChangelogEntry({
      action: `User ${actionVerb}`,
      targetType: 'User',
      targetId: user.id,
      targetName: user.name,
      details: `${actionVerb} user "${user.name}" (${user.role}). Phone: ${user.phone}`,
    })
  }

  if (!user) {
    return (
      <div className="p-5 text-center">
        <CSpinner />
        <div className="mt-2">Loading user...</div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 p-3 bg-body border-bottom">
        <CButton color="secondary" size="sm" onClick={() => navigate('/users')}>
          <CIcon icon={cilArrowLeft} size="sm" className="me-1" /> Back to Users
        </CButton>
        <h4 className="mb-0">User Detail</h4>
      </div>

      {showSaveAlert && (
        <CAlert color="success" className="m-3" dismissible onClose={() => setShowSaveAlert(false)}>
          User updated successfully.
        </CAlert>
      )}

      <CRow className="g-0" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left: User Information */}
        <CCol md={3} className="bg-body border-end p-4 d-flex flex-column" style={{ height: '100%', overflow: 'auto' }}>
          <h5 className="text-body d-flex align-items-center gap-2">
            <CIcon icon={cilUser} size="lg" /> User Info
          </h5>
          <hr className="border-top border-secondary" />
          <div className="mb-3">
            <label className="text-medium-emphasis small">Name</label>
            <div className="fw-semibold text-body">{user.name}</div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Phone</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilPhone} size="sm" /> {user.phone}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Vehicle</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilTruck} size="sm" /> {user.vehicle}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Role</label>
            <div>
              <CBadge color={roleConfig[user.role].color}>{roleConfig[user.role].label}</CBadge>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Status</label>
            <div>
              <CBadge color={user.status === 'Active' ? 'success' : 'danger'}>{user.status}</CBadge>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Total Orders</label>
            <div className="fw-semibold text-body d-flex align-items-center gap-2">
              <CIcon icon={cilList} size="sm" /> {user.orders}
            </div>
          </div>
        </CCol>

        {/* Center: Order History */}
        <CCol md={6} className="p-4 bg-body" style={{ height: '100%', overflow: 'auto' }}>
          <h5 className="text-body d-flex align-items-center gap-2 mb-3">
            <CIcon icon={cilCalendar} size="lg" /> Order History
          </h5>
          {userOrders.length === 0 ? (
            <div className="text-center text-secondary py-5">
              <CIcon icon={cilInfo} size="xl" className="mb-2" />
              <div className="fs-5">No orders found for this user.</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {userOrders.map((order) => (
                <CCard key={order.id} className="shadow-sm">
                  <CCardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold">{order.id}</div>
                      <CBadge color={statusBadgeColor[order.status] || 'secondary'}>{order.status}</CBadge>
                    </div>
                    <div className="small text-medium-emphasis d-flex align-items-center gap-2 mb-1">
                      <CIcon icon={cilLocationPin} size="sm" /> {order.location}
                    </div>
                    <div className="small text-medium-emphasis d-flex align-items-center gap-2 mb-1">
                      <CIcon icon={cilTruck} size="sm" /> {order.service}
                    </div>
                    <div className="small text-medium-emphasis d-flex align-items-center gap-2">
                      <CIcon icon={cilCalendar} size="sm" /> {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </CCardBody>
                </CCard>
              ))}
            </div>
          )}
        </CCol>

        {/* Right: Management Panel */}
        <CCol md={3} className="bg-body border-start p-4 overflow-auto" style={{ height: '100%' }}>
          <div className="mb-3">
            <h5 className="mb-2 text-body d-flex align-items-center gap-2">
              <CIcon icon={cilShieldAlt} size="lg" /> Management
            </h5>
            {!isEditing ? (
              <CButton color="primary" onClick={() => { setEditForm({ ...user }); setIsEditing(true) }}
                className="w-100 d-flex align-items-center justify-content-center gap-2">
                <CIcon icon={cilPencil} /> Edit User
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
                <CButton
                  color={user.status === 'Active' ? 'danger' : 'success'}
                  variant="outline"
                  size="sm"
                  onClick={toggleBlock}
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <CIcon icon={cilBan} size="sm" />
                  {user.status === 'Active' ? 'Block User' : 'Unblock User'}
                </CButton>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Name</label>
                <CFormInput
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Phone</label>
                <CFormInput
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Vehicle</label>
                <CFormInput
                  value={editForm.vehicle}
                  onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })}
                />
              </div>

              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Role</label>
                <CFormSelect
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="Client">Client</option>
                  <option value="Provider">Provider</option>
                  <option value="Admin">Admin</option>
                </CFormSelect>
              </div>

              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--cui-tertiary-bg)' }}>
                <label className="small text-medium-emphasis d-block mb-2">Status</label>
                <CFormSelect
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                </CFormSelect>
              </div>

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

export default UserDetail
