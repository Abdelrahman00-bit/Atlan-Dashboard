import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CButtonGroup, CFormInput, CFormSelect,
  CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch, cilPeople, cilUser, cilLockLocked,
  cilHistory, cilFilter, cilPhone, cilPlus,
} from '@coreui/icons'
import Pagination from '../../components/Pagination'
import { allUsers, updateUser, createUser } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'

const roleConfig = {
  Client:   { color: 'info',    label: 'Client' },
  Admin:    { color: 'danger',  label: 'Admin' },
  Provider: { color: 'success', label: 'Provider' },
}

const Users = () => {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(allUsers)
  const [blockTarget, setBlockTarget] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', phone: '', vehicle: '', role: 'Client' })
  const navigate = useNavigate()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const filters = ['All', 'Client', 'Admin', 'Provider']

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === 'All' || u.role === filter
    const term = search.toLowerCase()
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.phone.toLowerCase().includes(term) ||
      u.vehicle.toLowerCase().includes(term)
    return matchesFilter && matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter, search])

  const toggleBlock = (id) => {
    const target = users.find((u) => u.id === id)
    if (target) {
      const newStatus = target.status === 'Active' ? 'Blocked' : 'Active'
      const actionVerb = newStatus === 'Blocked' ? 'Blocked' : 'Unblocked'
      updateUser(id, { status: newStatus })
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
      )
      addChangelogEntry({
        action: `User ${actionVerb}`,
        targetType: 'User',
        targetId: target.id,
        targetName: target.name,
        details: `${actionVerb} user "${target.name}" (${target.role}). Phone: ${target.phone}`,
      })
    }
    setBlockTarget(null)
  }

  const handleCreateUser = () => {
    if (!createForm.name || !createForm.phone) return
    const newUser = createUser({ ...createForm, status: 'Active' })
    setUsers((prev) => [...prev, newUser])
    setShowCreateModal(false)
    setCreateForm({ name: '', phone: '', vehicle: '', role: 'Client' })
    addChangelogEntry({
      action: 'User Created',
      targetType: 'User',
      targetId: newUser.id,
      targetName: newUser.name,
      details: `Created new ${newUser.role} user: ${newUser.name} (${newUser.phone})`,
    })
  }

  return (
    <>
      <div className="mb-4">
        <h2>Users Management</h2>
        <p className="text-medium-emphasis">Manage clients, admins, and providers</p>
      </div>

      <CRow className="mb-4">
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilPeople} size="xl" className="text-primary me-3" />
              <div>
                <div className="text-medium-emphasis">Total Users</div>
                <div className="fs-4 fw-semibold">{users.length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilUser} size="xl" className="text-info me-3" />
              <div>
                <div className="text-medium-emphasis">Clients</div>
                <div className="fs-4 fw-semibold">{users.filter((u) => u.role === 'Client').length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilPeople} size="xl" className="text-success me-3" />
              <div>
                <div className="text-medium-emphasis">Providers</div>
                <div className="fs-4 fw-semibold">{users.filter((u) => u.role === 'Provider').length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center">
              <CIcon icon={cilLockLocked} size="xl" className="text-danger me-3" />
              <div>
                <div className="text-medium-emphasis">Admins</div>
                <div className="fs-4 fw-semibold">{users.filter((u) => u.role === 'Admin').length}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilFilter} className="text-primary" />
            <strong>Users</strong>
          </div>
           <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
             <CButton color="primary" size="sm" onClick={() => setShowCreateModal(true)}>
               <CIcon icon={cilPlus} className="me-1" /> Add User
             </CButton>
             {filters.map((f) => (
               <CButton key={f} color={filter === f ? 'primary' : 'light'} size="sm" onClick={() => setFilter(f)}>
                 {f}
               </CButton>
             ))}
           </div>
        </CCardHeader>
        <CCardBody>
          <div className="mb-3 position-relative">
            <CFormInput
              placeholder="Search by name, phone, or vehicle..."
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

          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Phone</CTableHeaderCell>
                <CTableHeaderCell>Vehicle</CTableHeaderCell>
                <CTableHeaderCell>Orders</CTableHeaderCell>
                <CTableHeaderCell>Role</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {paginatedUsers.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center text-secondary py-5 fs-5">
                    No users found.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <CTableRow key={user.id}>
                    <CTableDataCell className="fw-semibold">{user.name}</CTableDataCell>
                    <CTableDataCell>
                      <CIcon icon={cilPhone} size="sm" className="me-1 text-secondary" />
                      {user.phone}
                    </CTableDataCell>
                    <CTableDataCell>{user.vehicle}</CTableDataCell>
                    <CTableDataCell>{user.orders}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={roleConfig[user.role].color}>{roleConfig[user.role].label}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={user.status === 'Active' ? 'success' : 'danger'}>{user.status}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButtonGroup>
                        <CButton color="primary" size="sm" onClick={() => navigate(`/users/detail/${user.id}`)}>
                          View
                        </CButton>
                        <CButton
                          color={user.status === 'Active' ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => setBlockTarget(user)}
                        >
                          {user.status === 'Active' ? 'Block' : 'Unblock'}
                        </CButton>
                      </CButtonGroup>
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
            totalItems={filteredUsers.length}
            label="users"
          />
        </CCardBody>
      </CCard>


      <CModal visible={!!blockTarget} onClose={() => setBlockTarget(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>{blockTarget?.status === 'Active' ? 'Block User' : 'Unblock User'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {blockTarget && (
            <>
              <p>Are you sure you want to {blockTarget.status === 'Active' ? 'block' : 'unblock'} <strong>{blockTarget.name}</strong>?</p>
              <p className="text-medium-emphasis mb-0">This user is a {roleConfig[blockTarget.role].label} with {blockTarget.orders} orders.</p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setBlockTarget(null)}>Cancel</CButton>
          <CButton color={blockTarget?.status === 'Active' ? 'danger' : 'success'} onClick={() => toggleBlock(blockTarget.id)}>
            {blockTarget?.status === 'Active' ? 'Block' : 'Unblock'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Add New User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex flex-column gap-3">
            <CFormInput
              label="Full Name"
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
            <CFormInput
              label="Vehicle (Optional)"
              placeholder="e.g. Toyota Corolla"
              value={createForm.vehicle}
              onChange={(e) => setCreateForm({ ...createForm, vehicle: e.target.value })}
            />
            <CFormSelect
              label="Role"
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            >
              <option value="Client">Client</option>
              <option value="Provider">Provider</option>
              <option value="Admin">Admin</option>
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCreateModal(false)}>Cancel</CButton>
          <CButton color="primary" onClick={handleCreateUser}>Create User</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Users
