import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CFormInput, CFormSelect,
  CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle,
  CAlert,
  CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch, cilFilter, cilList,
  cilSpeedometer, cilCheck, cilTruck, cilCalendar,
  cilLocationPin, cilPlus,
} from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { allOrders as initialOrders, getStats, getAssignableProviders, allProviders, createOrder, allUsers, LOCATIONS, calculateOrderTotal } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'
import Pagination from '../../components/Pagination'

const SERVICE_TYPES = ['Battery', 'Fuel', 'Tire', 'Winch']

const statusConfig = {
  Pending:       { color: 'warning', label: 'Pending' },
  Accepted:      { color: 'info',    label: 'Accepted' },
  'On Way':      { color: 'primary', label: 'On Way' },
  'Arrived':     { color: 'secondary', label: 'Arrived' },
  Completed:     { color: 'success', label: 'Completed' },
  Cancelled:     { color: 'danger',  label: 'Cancelled' },
}

const Orders = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('') // YYYY-MM-DD
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    userId: allUsers[0]?.id || '',
    user: allUsers[0]?.name || '',
    phone: allUsers[0]?.phone || '',
    service: SERVICE_TYPES[0],
    location: LOCATIONS[0].name,
    status: 'Pending',
  })
  const [viewOrder, setViewOrder] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [assignModal, setAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const statusFilters = ['All', 'Pending', 'Accepted', 'On Way', 'Arrived', 'Completed', 'Cancelled']

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter
    const matchesService = serviceFilter === 'All' || order.service === serviceFilter
    const matchesDate = !dateFilter || order.createdAt.startsWith(dateFilter)
    const term = search.toLowerCase()
    const matchesSearch =
      order.user.toLowerCase().includes(term) ||
      order.service.toLowerCase().includes(term) ||
      order.provider.toLowerCase().includes(term) ||
      order.location.toLowerCase().includes(term) ||
      order.phone.toLowerCase().includes(term)
    return matchesStatus && matchesService && matchesDate && matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, serviceFilter, dateFilter, search])

  const handleCancel = (order) => setCancelTarget(order)

  const confirmCancel = () => {
    setIsLoading(true)
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: 'Cancelled' } : o)),
      )
      addChangelogEntry({
        action: 'Order Cancelled',
        targetType: 'Order',
        targetId: cancelTarget.id,
        targetName: cancelTarget.id,
        details: `Cancelled order ${cancelTarget.id} for user "${cancelTarget.user}". Service: ${cancelTarget.service}`,
      })
      setIsLoading(false)
      setCancelTarget(null)
    }, 500)
  }

  const handleAssign = (order) => {
    setSelectedOrder(order)
    setAssignModal(true)
  }

  const confirmAssign = (e) => {
    const provider = e.target.value
    if (!provider) return
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, provider, status: 'Accepted' } : o)),
    )
    addChangelogEntry({
      action: 'Provider Assigned',
      targetType: 'Order',
      targetId: selectedOrder.id,
      targetName: selectedOrder.id,
      details: `Assigned provider "${provider}" to order ${selectedOrder.id}. Service: ${selectedOrder.service}`,
    })
    setAssignModal(false)
    setSelectedOrder(null)
  }

  const handleCreateOrder = () => {
    if (!createForm.userId || !createForm.service || !createForm.location) return
    const newOrder = createOrder({
      ...createForm,
      provider: 'Unassigned',
      providerId: null,
      price: getOrderTotal(createForm.service),
    })
    setOrders((prev) => [...prev, newOrder])
    setShowCreateModal(false)
    setCreateForm({
      userId: allUsers[0]?.id || '',
      user: allUsers[0]?.name || '',
      phone: allUsers[0]?.phone || '',
      service: SERVICE_TYPES[0],
      location: LOCATIONS[0].name,
      status: 'Pending',
    })
    addChangelogEntry({
      action: 'Order Created',
      targetType: 'Order',
      targetId: newOrder.id,
      targetName: newOrder.id,
      details: `Created new order ${newOrder.id} for user "${createForm.user}". Service: ${createForm.service} in ${createForm.location}. Total: ${newOrder.price} EGP`,
    })
  }

  const handleUserChange = (userId) => {
    const user = allUsers.find((u) => u.id === parseInt(userId))
    if (user) {
      setCreateForm((prev) => ({
        ...prev,
        userId: user.id,
        user: user.name,
        phone: user.phone,
      }))
    }
  }

  const stats = getStats()

  const renderStatCard = (title, value, color, icon) => (
    <CCol xs={12} sm={6} lg={2}>
      <CCard className="mb-3">
        <CCardBody className="d-flex align-items-center">
          <CIcon icon={icon} size="xl" className={`text-${color} me-3`} />
          <div>
            <div className="text-medium-emphasis">{title}</div>
            <div className="fs-4 fw-semibold">{value}</div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  )

  return (
    <>
      <div className="mb-4">
        <h2>Orders Management</h2>
        <p className="text-medium-emphasis">View, filter, and manage all service orders</p>
      </div>

      <CRow className="mb-4">
        {renderStatCard('Total Orders', stats.totalOrders, 'primary', cilList)}
        {renderStatCard('Pending', orders.filter((o) => o.status === 'Pending').length, 'warning', cilSpeedometer)}
            {renderStatCard('On Way', orders.filter((o) => o.status === 'On Way').length, 'info', cilTruck)}
        {renderStatCard('Arrived', orders.filter((o) => o.status === 'Arrived').length, 'secondary', cilLocationPin)}
        {renderStatCard('Completed', orders.filter((o) => o.status === 'Completed').length, 'success', cilCheck)}
      </CRow>

      <CCard>
        <CCardHeader>
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilFilter} className="text-primary" />
              <strong>Orders</strong>
            </div>
            <CButton color="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <CIcon icon={cilPlus} className="me-1" /> Create Order
            </CButton>
          </div>
          {/* Status Filter */}
          <div className="d-flex flex-wrap gap-2 mb-2">
            {statusFilters.map((f) => (
              <CButton
                key={f}
                color={statusFilter === f ? 'primary' : 'light'}
                size="sm"
                onClick={() => setStatusFilter(f)}
              >
                {f}
              </CButton>
            ))}
          </div>
          {/* Service + Date Filters */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-small text-secondary">Service:</span>
            {['All', ...SERVICE_TYPES].map((s) => (
              <CButton
                key={s}
                color={serviceFilter === s ? 'dark' : 'outline-secondary'}
                size="sm"
                onClick={() => setServiceFilter(s)}
              >
                {s}
              </CButton>
            ))}
            <div className="vr mx-2" />
            <span className="text-small text-secondary">Date:</span>
            <CFormInput
              type="date"
              size="sm"
              className="w-auto"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ maxWidth: '160px' }}
            />
            <CButton color="light" size="sm" onClick={() => setDateFilter('2026-06-13')}>Today</CButton>
            <CButton color="light" size="sm" onClick={() => setDateFilter('')}>All Dates</CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          <div className="mb-3 position-relative">
            <CFormInput
              placeholder="Search by user, service, provider, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-5"
            />
            <CIcon
              icon={cilSearch}
              size="lg"
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
            />
          </div>

          {isLoading && (
            <div className="text-center py-5">
              <CAlert color="info">Loading orders...</CAlert>
            </div>
          )}

          {!isLoading && (
            <>
            <CTable hover responsive className="align-middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>User</CTableHeaderCell>
                  <CTableHeaderCell>Phone</CTableHeaderCell>
                  <CTableHeaderCell>Service</CTableHeaderCell>
                  <CTableHeaderCell>Location</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Provider</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {paginatedOrders.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center text-secondary py-5 fs-5">
                      No orders found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <CTableRow key={order.id}>
                      <CTableDataCell className="fw-semibold">{order.user}</CTableDataCell>
                      <CTableDataCell className="text-nowrap">{order.phone}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="light" textColor="dark" className="border">{order.service}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{order.location}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusConfig[order.status].color}>{order.status}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{order.provider}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CDropdown>
                          <CDropdownToggle color="secondary" size="sm" style={{ cursor: 'pointer' }}>
                            Actions
                          </CDropdownToggle>
                            <CDropdownMenu>
                               <CDropdownItem onClick={() => navigate(`/orders/detail/${encodeURIComponent(order.id)}`)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>View & Manage</CDropdownItem>
                               <CDropdownItem onClick={() => navigate(`/map?orderId=${encodeURIComponent(order.id)}`)} style={{ cursor: 'pointer', color: '#0d6efd' }}>Track Live</CDropdownItem>
                            </CDropdownMenu>
                        </CDropdown>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
              setItemsPerPage={setItemsPerPage}
              totalItems={filteredOrders.length}
              label="orders"
              />
            </>
          )}
        </CCardBody>
      </CCard>

      {/* View Order Modal */}
      <CModal visible={!!viewOrder} onClose={() => setViewOrder(null)} alignment="center" size="lg">
        <CModalHeader>
          <CModalTitle>Order Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {viewOrder && (
            <CRow>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Order ID</div>
                <div className="fw-semibold">{viewOrder.id}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Status</div>
                <CBadge color={statusConfig[viewOrder.status].color}>{viewOrder.status}</CBadge>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">User</div>
                <div className="fw-semibold">{viewOrder.user}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Phone</div>
                <div className="fw-semibold">{viewOrder.phone}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Service</div>
                <div className="fw-semibold">{viewOrder.service}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Provider</div>
                <div className="fw-semibold">{viewOrder.provider}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Location</div>
                <div className="fw-semibold">{viewOrder.location}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Created At</div>
                <div className="fw-semibold">
                  {new Date(viewOrder.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setViewOrder(null)}>Close</CButton>
        </CModalFooter>
      </CModal>

      {/* Cancel Confirmation */}
      <CModal visible={!!cancelTarget} onClose={() => setCancelTarget(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>Cancel Order</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {cancelTarget && (
            <>
              <p>Are you sure you want to cancel order <strong>{cancelTarget.id}</strong>?</p>
              <p className="text-medium-emphasis mb-0">User: {cancelTarget.user} | Service: {cancelTarget.service}</p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCancelTarget(null)}>Keep Order</CButton>
          <CButton color="danger" onClick={confirmCancel} disabled={isLoading}>
            {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Assign Provider */}
      <CModal visible={assignModal} onClose={() => setAssignModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Assign Provider</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedOrder && (
            <>
              <p className="text-medium-emphasis mb-3">
                Order {selectedOrder.id} needs <strong>{selectedOrder.service}</strong>. Select a provider:
              </p>
              <CFormSelect onChange={confirmAssign} defaultValue="">
                <option value="" disabled>Choose an available provider...</option>
                {getAssignableProviders(selectedOrder.service, allProviders).map((p) => (
                  <option key={p.id} value={p.name}>{p.name} ({p.phone})</option>
                ))}
                {getAssignableProviders(selectedOrder.service, allProviders).length === 0 && (
                  <option disabled>No available providers for {selectedOrder.service}</option>
                )}
              </CFormSelect>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setAssignModal(false)}>Cancel</CButton>
        </CModalFooter>
      </CModal>

      {/* Create Order Modal */}
      <CModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} alignment="center" size="lg">
        <CModalHeader>
          <CModalTitle>Create New Order</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex flex-column gap-3">
            <CFormSelect
              label="User"
              value={createForm.userId}
              onChange={(e) => handleUserChange(e.target.value)}
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.phone})
                </option>
              ))}
            </CFormSelect>
            <div className="row">
              <CCol md={6}>
                <CFormSelect
                  label="Service Required"
                  value={createForm.service}
                  onChange={(e) => setCreateForm({ ...createForm, service: e.target.value })}
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Location"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </div>
            <div className="p-3 bg-light rounded border">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-medium-emphasis">Estimated Price (avg. 5km):</span>
                <span className="fs-5 fw-bold text-primary">
                  {calculateOrderTotal(createForm.service, 5)} EGP
                </span>
              </div>
              <small className="text-secondary">Final price will be calculated based on the actual distance from the assigned provider.</small>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCreateModal(false)}>Cancel</CButton>
          <CButton color="primary" onClick={handleCreateOrder}>Create Order</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Orders
