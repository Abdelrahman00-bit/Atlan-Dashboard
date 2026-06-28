import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CFormInput, CFormSelect,
  CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch, cilPeople, cilCheckCircle, cilXCircle, cilFilter, cilPhone, cilPlus,
} from '@coreui/icons'
import { allProviders, updateProvider, createProvider, LOCATIONS } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'
import Pagination from '../../components/Pagination'

const SERVICE_TYPES = ['Battery', 'Fuel', 'Tire', 'Winch']

const Providers = () => {
  const [statusFilter, setStatusFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [providers, setProviders] = useState(allProviders)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    location: LOCATIONS[0].name,
    services: [],
    status: 'Offline',
  })
  const navigate = useNavigate()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const statusFilters = ['All', 'Online', 'Offline', 'Available']

  const filteredProviders = providers.filter((p) => {
    let matchesStatus
    if (statusFilter === 'All') matchesStatus = true
    else if (statusFilter === 'Available') matchesStatus = p.status === 'Online' && p.available
    else matchesStatus = p.status === statusFilter

    const matchesService = serviceFilter === 'All' || p.services.includes(serviceFilter)

    const term = search.toLowerCase()
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.phone.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term) ||
      p.services.some((s) => s.toLowerCase().includes(term))

    return matchesStatus && matchesService && matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProviders = filteredProviders.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, serviceFilter, search])

  const toggleStatus = (id) => {
    const target = providers.find((p) => p.id === id)
    if (target) {
      const newStatus = target.status === 'Online' ? 'Offline' : 'Online'
      updateProvider(id, { status: newStatus })
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
      )
      addChangelogEntry({
        action: `Provider Set ${newStatus}`,
        targetType: 'Provider',
        targetId: target.id,
        targetName: target.name,
        details: `Changed provider "${target.name}" status to ${newStatus}.`,
      })
    }
  }

  const handleCreateProvider = () => {
    if (!createForm.name || !createForm.phone) return
    const newProvider = createProvider({ ...createForm })
    setProviders((prev) => [...prev, newProvider])
    setShowCreateModal(false)
    setCreateForm({
      name: '',
      phone: '',
      location: LOCATIONS[0].name,
      services: [],
      status: 'Offline',
    })
    addChangelogEntry({
      action: 'Provider Created',
      targetType: 'Provider',
      targetId: newProvider.id,
      targetName: newProvider.name,
      details: `Created new provider: ${newProvider.name} (${newProvider.phone}) located in ${newProvider.location}`,
    })
  }

  const toggleServiceSelection = (svc) => {
    setCreateForm((prev) => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter((s) => s !== svc)
        : [...prev.services, svc],
    }))
  }

  return (
    <>
      <div className="mb-4">
        <h2>Providers Management</h2>
        <p className="text-medium-emphasis">Manage and monitor service providers</p>
      </div>

      <CRow className="mb-4">
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilPeople} size="xl" className="text-primary me-3" />
              <div>
                <div className="text-medium-emphasis">Total Providers</div>
                <div className="fs-4 fw-semibold">{providers.length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilCheckCircle} size="xl" className="text-success me-3" />
              <div>
                <div className="text-medium-emphasis">Online</div>
                <div className="fs-4 fw-semibold">{providers.filter((p) => p.status === 'Online').length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilXCircle} size="xl" className="text-secondary me-3" />
              <div>
                <div className="text-medium-emphasis">Offline</div>
                <div className="fs-4 fw-semibold">{providers.filter((p) => p.status === 'Offline').length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilCheckCircle} size="xl" className="text-info me-3" />
              <div>
                <div className="text-medium-emphasis">Available</div>
                <div className="fs-4 fw-semibold">
                  {providers.filter((p) => p.status === 'Online' && p.available).length}
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader>
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilFilter} className="text-primary" />
              <strong>Providers</strong>
            </div>
            <CButton color="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <CIcon icon={cilPlus} className="me-1" /> Add Provider
            </CButton>
          </div>
          {/* Status Filter */}
          <div className="d-flex flex-wrap gap-2 mb-2">
            {['All', 'Online', 'Offline', 'Available'].map((f) => (
              <CButton key={f} color={statusFilter === f ? 'primary' : 'light'} size="sm" onClick={() => setStatusFilter(f)}>
                {f}
              </CButton>
            ))}
          </div>
          {/* Service Filter */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-small text-secondary me-1">Service:</span>
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
          </div>
        </CCardHeader>
        <CCardBody>
          <div className="mb-3 position-relative">
            <CFormInput
              placeholder="Search by name, phone, service, or location..."
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

          <CTable hover responsive className="align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Provider</CTableHeaderCell>
                <CTableHeaderCell>Phone</CTableHeaderCell>
                <CTableHeaderCell>Services</CTableHeaderCell>
                <CTableHeaderCell>Rating</CTableHeaderCell>
                <CTableHeaderCell>Orders</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {paginatedProviders.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center text-secondary py-5 fs-5">
                    No providers found.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paginatedProviders.map((provider) => (
                  <CTableRow key={provider.id}>
                    <CTableDataCell className="fw-semibold">{provider.name}</CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      <CIcon icon={cilPhone} size="sm" className="me-1 text-secondary" />
                      {provider.phone}
                    </CTableDataCell>
                    <CTableDataCell>
                      {provider.services.map((s) => (
                        <CBadge color="light" textColor="dark" className="me-1 border" key={s}>
                          {s}
                        </CBadge>
                      ))}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className="text-warning">{'★'.repeat(Math.round(provider.rating))}</span>
                      <span className="ms-1">{provider.rating}</span>
                    </CTableDataCell>
                    <CTableDataCell>{provider.ordersCompleted}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={provider.status === 'Online' ? 'success' : 'secondary'}>
                        {provider.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="primary" size="sm" onClick={() => navigate(`/providers/detail/${provider.id}`)}>
                        View
                      </CButton>
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
            totalItems={filteredProviders.length}
            label="providers"
          />
        </CCardBody>
      </CCard>



      <CModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Add New Provider</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex flex-column gap-3">
            <CFormInput
              label="Full Name (Male Only)"
              placeholder="Enter full name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            <CFormInput
              label="Phone Number"
              placeholder="+20 ..."
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
            <CFormSelect
              label="Location"
              value={createForm.location}
              onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
            >
              {LOCATIONS.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </CFormSelect>
            <div>
              <label className="form-label">Services Provided</label>
              <div className="d-flex flex-wrap gap-2">
                {SERVICE_TYPES.map((s) => (
                  <CButton
                    key={s}
                    size="sm"
                    color={createForm.services.includes(s) ? 'primary' : 'outline-secondary'}
                    onClick={() => toggleServiceSelection(s)}
                  >
                    {s}
                  </CButton>
                ))}
              </div>
            </div>
            <CFormSelect
              label="Initial Status"
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCreateModal(false)}>Cancel</CButton>
          <CButton color="primary" onClick={handleCreateProvider}>Create Provider</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Providers
