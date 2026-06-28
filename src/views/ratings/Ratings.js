import React from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilStar, cilUser } from '@coreui/icons'

const allRatings = [
  { id: '#ORD-001', user: 'Ahmed Magdy', provider: 'Speedy Fix', rating: 5, comment: 'Quick and professional service!', date: '2026-06-13' },
  { id: '#ORD-002', user: 'Fatima Hassan', provider: 'Quick Fuel', rating: 4, comment: 'Good but took a while.', date: '2026-06-13' },
  { id: '#ORD-003', user: 'Mohamed Ali', provider: 'Tow Egypt', rating: 5, comment: 'Excellent towing service.', date: '2026-06-13' },
]

const Ratings = () => {
  return (
    <>
      <div className="mb-4">
        <h2>Ratings & Reviews</h2>
        <p className="text-medium-emphasis">Monitor service quality through user feedback and ratings</p>
      </div>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilStar} className="me-2" />
              Recent Ratings
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Order ID</CTableHeaderCell>
                    <CTableHeaderCell>User</CTableHeaderCell>
                    <CTableHeaderCell>Provider</CTableHeaderCell>
                    <CTableHeaderCell>Rating</CTableHeaderCell>
                    <CTableHeaderCell>Comment</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {allRatings.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>{r.id}</CTableDataCell>
                      <CTableDataCell>{r.user}</CTableDataCell>
                      <CTableDataCell>{r.provider}</CTableDataCell>
                      <CTableDataCell>
                        <span className="text-warning">{'★'.repeat(r.rating)}</span>
                      </CTableDataCell>
                      <CTableDataCell>{r.comment}</CTableDataCell>
                      <CTableDataCell>{r.date}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Ratings
