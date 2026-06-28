import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CFormInput,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilHistory, cilSearch } from '@coreui/icons'
import { getChangelog } from '../../data/profileData'

const targetColors = {
  User: 'info',
  Provider: 'success',
  Order: 'warning',
  General: 'secondary',
}

const Changelog = () => {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLogs(getChangelog())
  }, [])

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase()
    return (
      log.action.toLowerCase().includes(term) ||
      log.admin.toLowerCase().includes(term) ||
      (log.targetName && log.targetName.toLowerCase().includes(term)) ||
      (log.targetType && log.targetType.toLowerCase().includes(term)) ||
      log.details.toLowerCase().includes(term)
    )
  })

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString()
  }

  const getTargetDisplay = (log) => {
    if (!log.targetType || log.targetType === 'General' || !log.targetName) {
      return <span className="text-secondary fst-italic">-</span>
    }
    return (
      <div>
        <CBadge color={targetColors[log.targetType] || 'secondary'} className="me-1">
          {log.targetType}
        </CBadge>
        <span className="fw-semibold">{log.targetName}</span>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        <h2>Admin Changelog</h2>
        <p className="text-medium-emphasis">
          Track and review all administrator actions across the platform
        </p>
      </div>

      <CCard>
        <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilHistory} className="text-primary" />
            <strong>Action Log</strong>
          </div>
        </CCardHeader>
        <CCardBody>
          <div className="mb-3 position-relative">
            <CFormInput
              placeholder="Search by action, admin, target type, target name, or details..."
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
                <CTableHeaderCell style={{ width: '60px' }}>ID</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '170px' }}>Date & Time</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '150px' }}>Admin</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '180px' }}>Action</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '200px' }}>Target</CTableHeaderCell>
                <CTableHeaderCell>Details</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredLogs.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center text-secondary py-5 fs-5">
                    No log entries found.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredLogs.map((log) => (
                  <CTableRow key={log.id}>
                    <CTableDataCell className="fw-semibold">#{log.id}</CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {formatDate(log.timestamp)}
                    </CTableDataCell>
                    <CTableDataCell className="fw-semibold">{log.admin}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="primary">{log.action}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{getTargetDisplay(log)}</CTableDataCell>
                    <CTableDataCell>{log.details}</CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default Changelog
