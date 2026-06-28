import React from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMap } from '@coreui/icons'

const Map = () => {
  return (
    <>
      <div className="mb-4">
        <h2>Map Tracking</h2>
        <p className="text-medium-emphasis">Real-time map tracking of users and providers</p>
      </div>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilMap} className="me-2" />
              Live Map
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">This page is under development. A live interactive map will be available here to track active orders and provider locations.</p>
              <div className="bg-light border rounded d-flex align-items-center justify-content-center" style={{ height: '400px' }}>
                <div className="text-center text-secondary">
                  <CIcon icon={cilMap} size="xxl" className="mb-3" />
                  <h4>Map Integration Coming Soon</h4>
                  <p>Real-time tracking of users, providers, and active orders will appear here.</p>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Map
