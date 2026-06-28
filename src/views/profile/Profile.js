import React, { useState, useEffect, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CButton,
  CAvatar,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilSave, cilPencil } from '@coreui/icons'
import { getProfile, saveProfile } from '../../data/profileData'
import avatar8 from './../../assets/images/avatars/8.jpg'

const Profile = () => {
  const [profile, setProfile] = useState(getProfile)
  const [form, setForm] = useState(getProfile)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const p = getProfile()
    setProfile(p)
    setForm(p)
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleAvatarClick = () => {
    if (editing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      const updated = saveProfile(form)
      setProfile(updated)
      setForm(updated)
      setEditing(false)
      setSaving(false)
      setAlert({ type: 'success', message: 'Profile updated successfully!' })
      setTimeout(() => setAlert(null), 3000)
    }, 500)
  }

  const handleCancel = () => {
    setForm(profile)
    setEditing(false)
    setAlert(null)
  }

  return (
    <>
      <div className="mb-4">
        <h2>Admin Profile</h2>
        <p className="text-medium-emphasis">View and manage your administrator profile</p>
      </div>

      {alert && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </CAlert>
      )}

      <CRow>
        <CCol xs={12} lg={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <CIcon icon={cilUser} className="me-2" />
              Profile Picture
            </CCardHeader>
            <CCardBody className="text-center">
              <div
                onClick={handleAvatarClick}
                style={{ cursor: editing ? 'pointer' : 'default', display: 'inline-block' }}
                title={editing ? 'Click to change avatar' : ''}
              >
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--cui-border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--cui-body-bg)'
                  }}
                >
                  <img
                    src={form.avatar || avatar8}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <h4 className="mt-3 mb-1">{profile.name}</h4>
              <p className="text-medium-emphasis mb-0">{profile.role}</p>
              <p className="text-medium-emphasis small">{profile.email}</p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} lg={8}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>
                <CIcon icon={cilPencil} className="me-2" />
                Profile Information
              </span>
              {!editing ? (
                <CButton color="primary" size="sm" onClick={() => setEditing(true)}>
                  <CIcon icon={cilPencil} className="me-1" />
                  Edit Profile
                </CButton>
              ) : (
                <div className="d-flex gap-2">
                  <CButton color="secondary" size="sm" onClick={handleCancel}>
                    Cancel
                  </CButton>
                  <CButton color="primary" size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSave} className="me-1" />}
                    Save Changes
                  </CButton>
                </div>
              )}
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel>Full Name</CFormLabel>
                    <CFormInput
                      value={form.name}
                      onChange={handleChange('name')}
                      disabled={!editing}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Email</CFormLabel>
                    <CFormInput
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      disabled={!editing}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel>Phone Number</CFormLabel>
                    <CFormInput
                      value={form.phone}
                      onChange={handleChange('phone')}
                      disabled={!editing}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Role</CFormLabel>
                    <CFormInput value={form.role} disabled />
                  </CCol>
                </CRow>
                <div className="mb-3">
                  <CFormLabel>Bio</CFormLabel>
                  <CFormTextarea
                    rows={4}
                    value={form.bio}
                    onChange={handleChange('bio')}
                    disabled={!editing}
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Profile
