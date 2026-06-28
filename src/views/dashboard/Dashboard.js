import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CAlert, CListGroup, CListGroupItem,
  CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople, cilUser, cilCheck, cilChart,
  cilWarning, cilClock, cilStar, cilList, cilTask, cilTruck,
} from '@coreui/icons'
import {
  allOrders as initialOrders, allProviders as initialProviders, allUsers, getStats, getScopedStats, getWarnings, getOrderAge, getAssignableProviders, updateProvider,
} from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'
import Pagination from '../../components/Pagination'

const statusConfig = {
  Pending:   { color: 'warning' },
  Accepted:  { color: 'info' },
  'On Way':  { color: 'primary' },
  'Arrived': { color: 'secondary' },
  Completed: { color: 'success' },
  Cancelled: { color: 'danger' },
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(initialOrders)
  const [providers, setProviders] = useState(initialProviders)
  const [scope, setScope] = useState('all')
  const stats = getScopedStats(scope, orders, providers)

  const buildWarnings = () => {
    const warnings = []
    const now = new Date('2026-06-13T13:44:00')

    orders.forEach((order) => {
      if (order.status !== 'Pending') return
      const created = new Date(order.createdAt)
      const ageMin = (now - created) / 1000 / 60
      if (ageMin > 30) {
        warnings.push({
          type: 'stale-pending',
          severity: ageMin > 60 ? 'critical' : 'warning',
          order,
          message: `Order ${order.id} has been pending for ${Math.round(ageMin)} minutes`,
        })
      }
    })

    orders.forEach((order) => {
      if (order.status !== 'On Way') return
      const created = new Date(order.createdAt)
      const ageMin = (now - created) / 1000 / 60
      if (ageMin > 60) {
        warnings.push({
          type: 'stuck-progress',
          severity: ageMin > 120 ? 'critical' : 'warning',
          order,
          message: `Order ${order.id} has been in progress for ${Math.round(ageMin)} minutes`,
        })
      }
    })

    providers
      .filter((p) => p.rating < 2.0)
      .forEach((p) => {
        warnings.push({
          type: 'low-rating',
          severity: 'critical',
          provider: p,
          message: `Provider ${p.name} has a critically low rating: ${p.rating}`,
        })
      })

    const cancelled = orders.filter((o) => o.status === 'Cancelled').length
    const cancellationRate = Math.round((cancelled / orders.length) * 100)
    if (cancellationRate > 10) {
      warnings.push({
        type: 'cancellation-rate',
        severity: cancellationRate > 20 ? 'critical' : 'warning',
        message: `Cancellation rate is ${cancellationRate}% (threshold: 10%)`,
      })
    }

    return warnings
  }

  const warnings = buildWarnings()

  // Warnings Pagination state
  const [warningsPage, setWarningsPage] = useState(1)
  const [warningsPerPage, setWarningsPerPage] = useState(5)

  const totalWarningsPages = Math.ceil(warnings.length / warningsPerPage)
  const warningsStartIndex = (warningsPage - 1) * warningsPerPage
  const paginatedWarnings = warnings.slice(warningsStartIndex, warningsStartIndex + warningsPerPage)

  const [assignModal, setAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewOrderModal, setViewOrderModal] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [viewProviderModal, setViewProviderModal] = useState(false)
  const [viewProvider, setViewProvider] = useState(null)

  const handleAssignFromWarning = (order) => {
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

  const handleCancelFromWarning = (order) => {
    setCancelTarget(order)
  }

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

  const toggleProviderStatus = (providerId) => {
    const target = providers.find((p) => p.id === providerId)
    if (target) {
      const newStatus = target.status === 'Online' ? 'Offline' : 'Online'
      updateProvider(providerId, { status: newStatus })
      addChangelogEntry({
        action: `Provider Set ${newStatus}`,
        targetType: 'Provider',
        targetId: target.id,
        targetName: target.name,
        details: `Changed provider "${target.name}" status to ${newStatus}.`,
      })
    }
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, status: p.status === 'Online' ? 'Offline' : 'Online' } : p,
      ),
    )
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
  }

  return (
    <>
      <div className="mb-4">
        <h2>Roadside Assistance Dashboard</h2>
        <p className="text-medium-emphasis">Welcome back — here's what's happening right now</p>
      </div>

      {/* ---- Overall Stats ---- */}
      <CRow>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-medium-emphasis">Total Users</div>
                <div className="fs-4 fw-semibold">{stats.totalUsers}</div>
              </div>
              <CIcon icon={cilUser} size="xxl" className="text-primary" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-medium-emphasis">Total Providers</div>
                <div className="fs-4 fw-semibold">{stats.totalProviders}</div>
              </div>
              <CIcon icon={cilPeople} size="xxl" className="text-success" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-medium-emphasis">Total Orders</div>
                <div className="fs-4 fw-semibold">{stats.totalOrders}</div>
              </div>
              <CIcon icon={cilList} size="xxl" className="text-info" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-medium-emphasis">Online Providers</div>
                <div className="fs-4 fw-semibold">{stats.onlineProviders}</div>
              </div>
              <CIcon icon={cilCheck} size="xxl" className="text-success" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ---- Today's Snapshot ---- */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <h5 className="mb-3">Today at a Glance</h5>
        </CCol>
        {(() => {
          const todayStats = getScopedStats('today', orders, providers)
          return (
            <>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="mb-3">
                  <CCardBody className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-medium-emphasis">Today's Orders</div>
                      <div className="fs-4 fw-semibold">{todayStats.totalOrders}</div>
                    </div>
                    <CIcon icon={cilClock} size="xl" className="text-primary" />
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="mb-3">
                  <CCardBody className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-medium-emphasis">Completed Today</div>
                      <div className="fs-4 fw-semibold">{todayStats.completedOrders}</div>
                    </div>
                    <CIcon icon={cilCheck} size="xl" className="text-success" />
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="mb-3">
                  <CCardBody className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-medium-emphasis">Pending Today</div>
                      <div className="fs-4 fw-semibold">{todayStats.pendingOrders}</div>
                    </div>
                    <CIcon icon={cilWarning} size="xl" className="text-warning" />
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="mb-3">
                  <CCardBody className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-medium-emphasis">Today's Revenue</div>
                      <div className="fs-4 fw-semibold">{todayStats.revenue.toLocaleString()} EGP</div>
                    </div>
                    <CIcon icon={cilChart} size="xl" className="text-info" />
                  </CCardBody>
                </CCard>
              </CCol>
            </>
          )
        })()}
      </CRow>

      {/* ---- Warnings / Needs Attention ---- */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard className="mb-4 border-start border-start-4 border-danger">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilWarning} className="text-danger" />
                <strong>Needs Attention — {warnings.length} issue{warnings.length !== 1 ? 's' : ''}</strong>
              </div>
              {warnings.length > 0 && (
                <CButton size="sm" color="danger" variant="outline" onClick={() => navigate('/orders')}>
                  View All
                </CButton>
              )}
            </CCardHeader>
             <CCardBody>
               {warnings.length === 0 ? (
                 <p className="text-success mb-0">Good job! No issues requiring attention.</p>
               ) : (
                 <>
                   <CListGroup flush>
                     {paginatedWarnings.map((w, idx) => (
                       <CListGroupItem key={idx} className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                         <div className="d-flex align-items-center gap-3">
                           <CBadge color={w.severity === 'critical' ? 'danger' : 'warning'} className="text-uppercase">
                             {w.severity}
                           </CBadge>
                           <span>{w.message}</span>
                         </div>
                         <div className="d-flex gap-2">
                           {w.type === 'stale-pending' && w.order && (
                             <>
                               <CButton size="sm" color="info" variant="outline" onClick={() => { setViewOrder(w.order); setViewOrderModal(true); }}>
                                 View
                               </CButton>
                               <CButton size="sm" color="primary" onClick={() => handleAssignFromWarning(w.order)}>
                                 Assign
                               </CButton>
                               <CButton size="sm" color="danger" variant="outline" onClick={() => handleCancelFromWarning(w.order)}>
                                 Cancel
                               </CButton>
                             </>
                           )}
                           {w.type === 'stuck-progress' && w.order && (
                             <>
                               <CButton size="sm" color="info" variant="outline" onClick={() => { setViewOrder(w.order); setViewOrderModal(true); }}>
                                 View
                               </CButton>
                               <CButton size="sm" color="warning" variant="outline" onClick={() => handleCancelFromWarning(w.order)}>
                                 Cancel Order
                               </CButton>
                             </>
                           )}
                           {w.type === 'low-rating' && w.provider && (
                             <>
                               <CButton size="sm" color="info" variant="outline" onClick={() => { setViewProvider(w.provider); setViewProviderModal(true); }}>
                                 View
                               </CButton>
                               <CButton
                                 size="sm"
                                 color={w.provider.status === 'Online' ? 'secondary' : 'success'}
                                 variant="outline"
                                 onClick={() => toggleProviderStatus(w.provider.id)}
                               >
                                 {w.provider.status === 'Online' ? 'Take Offline' : 'Bring Online'}
                               </CButton>
                             </>
                           )}
                           {w.type === 'cancellation-rate' && (
                             <CButton size="sm" color="info" variant="outline" onClick={() => navigate('/reports')}>
                               View Report
                             </CButton>
                           )}
                         </div>
                       </CListGroupItem>
                     ))}
                   </CListGroup>
                   <Pagination
                     currentPage={warningsPage}
                     totalPages={totalWarningsPages}
                     itemsPerPage={warningsPerPage}
                     setCurrentPage={setWarningsPage}
                     setItemsPerPage={setWarningsPerPage}
                     totalItems={warnings.length}
                     label="warnings"
                   />
                 </>
               )}
             </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ---- Recent Orders ---- */}
      <CRow>
        <CCol xs={12} lg={8}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>Recent Orders</span>
              <Link to="/orders">
                <CButton size="sm" color="primary">View All</CButton>
              </Link>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Order ID</CTableHeaderCell>
                    <CTableHeaderCell>User</CTableHeaderCell>
                    <CTableHeaderCell>Service</CTableHeaderCell>
                    <CTableHeaderCell>Provider</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Time</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentOrders.map((order) => (
                    <CTableRow key={order.id}>
                      <CTableDataCell className="fw-semibold">{order.id}</CTableDataCell>
                      <CTableDataCell>{order.user}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="light" textColor="dark" className="border">{order.service}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{order.provider}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusConfig[order.status].color}>{order.status}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{formatTime(order.createdAt)}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} lg={4}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilTask} className="me-2" />
                <strong>Quick Stats</strong>
              </div>
              <CFormSelect
                size="sm"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{ width: '130px' }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </CFormSelect>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <div className="text-medium-emphasis">
                  {scope === 'all' ? 'Total' : `${scope.charAt(0).toUpperCase() + scope.slice(1)}`} Revenue
                </div>
                <div className="fs-5 fw-semibold">{stats.revenue.toLocaleString()} EGP</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Active Orders</div>
                <div className="fs-5 fw-semibold">{stats.activeOrders}</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Cancellation Rate</div>
                <div className="fs-5 fw-semibold">
                  {stats.cancellationRate}%
                </div>
              </div>
              <div>
                <div className="text-medium-emphasis">Avg Provider Rating</div>
                <div className="fs-5 fw-semibold">
                  {stats.avgRating} / 5.0
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ---- Assign Provider Modal ---- */}
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
                {getAssignableProviders(selectedOrder.service, providers).map((p) => (
                  <option key={p.id} value={p.name}>{p.name} ({p.phone})</option>
                ))}
                {getAssignableProviders(selectedOrder.service, providers).length === 0 && (
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

      {/* ---- Cancel Order Confirmation ---- */}
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

      {/* ---- Order Detail Modal ---- */}
      <CModal visible={viewOrderModal} onClose={() => setViewOrderModal(false)} alignment="center" size="lg">
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
                <CBadge color={statusConfig[viewOrder.status]?.color}>{viewOrder.status}</CBadge>
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
                <div className="text-medium-emphasis">Provider Phone</div>
                <div className="fw-semibold">{providers.find((p) => p.name === viewOrder.provider)?.phone || 'N/A'}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Location</div>
                <div className="fw-semibold">{viewOrder.location}</div>
              </CCol>
              <CCol md={6} className="mb-3">
                <div className="text-medium-emphasis">Created At</div>
                <div className="fw-semibold">
                  {new Date(viewOrder.createdAt).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setViewOrderModal(false)}>Close</CButton>
        </CModalFooter>
      </CModal>

      {/* ---- Provider Detail Modal ---- */}
      <CModal visible={viewProviderModal} onClose={() => setViewProviderModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Provider Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {viewProvider && (
            <>
              <div className="mb-3">
                <div className="text-medium-emphasis">Provider</div>
                <div className="fw-semibold">{viewProvider.name}</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Phone</div>
                <div className="fw-semibold">{viewProvider.phone}</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Services</div>
                <div>
                  {viewProvider.services.map((s) => (
                    <CBadge color="light" textColor="dark" className="me-1 border" key={s}>{s}</CBadge>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Rating</div>
                <div className="fw-semibold">
                  <span className="text-warning">{'★'.repeat(Math.round(viewProvider.rating))}</span>{' '}
                  {viewProvider.rating}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Orders Completed</div>
                <div className="fw-semibold">{viewProvider.ordersCompleted}</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Location</div>
                <div className="fw-semibold">{viewProvider.location}</div>
              </div>
              <div className="mb-3">
                <div className="text-medium-emphasis">Status</div>
                <CBadge color={viewProvider.status === 'Online' ? 'success' : 'secondary'}>{viewProvider.status}</CBadge>
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setViewProviderModal(false)}>Close</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Dashboard
