import React from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CRow, CForm, CFormCheck, CFormInput, CFormLabel, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings } from '@coreui/icons'

const Settings = () => {
  return (
    <>
      <div className="mb-4">
        <h2>System Settings</h2>
        <p className="text-medium-emphasis">Manage application configuration and preferences</p>
      </div>
      <CRow>
        <CCol xs={12} lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <CIcon icon={cilSettings} className="me-2" />
              General Settings
            </CCardHeader>
            <CCardBody>
              <CForm>
                <div className="mb-3">
                  <CFormLabel>Platform Name</CFormLabel>
                  <CFormInput defaultValue="ATLAN Admin Dashboard" disabled />
                </div>
                <div className="mb-3">
                  <CFormLabel>Admin Email</CFormLabel>
                  <CFormInput defaultValue="admin@atlan.eg" disabled />
                </div>
                <CFormCheck label="Enable email notifications" defaultChecked disabled className="mb-3" />
                <CFormCheck label="Enable SMS alerts" disabled className="mb-3" />
                <CButton color="primary" disabled>Save Changes</CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <CIcon icon={cilSettings} className="me-2" />
              Notification Preferences
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CFormCheck label="New order alerts" defaultChecked disabled className="mb-3" />
                <CFormCheck label="Provider status changes" defaultChecked disabled className="mb-3" />
                <CFormCheck label="Low ratings alerts" disabled className="mb-3" />
                <CFormCheck label="System updates" disabled className="mb-3" />
                <CButton color="primary" disabled>Save Preferences</CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Settings
