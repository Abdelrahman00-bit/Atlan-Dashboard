import React, { useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CFormInput, CFormSelect, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilPencil, cilPlus, cilTrash } from '@coreui/icons'
import { SERVICES, updateService } from '../../data/sharedData'
import { addChangelogEntry } from '../../data/profileData'

const Services = () => {
  const [services, setServices] = useState(SERVICES)
  const [showModal, setShowModal] = useState(false)
  const [editService, setEditService] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', basePrice: '', pricePerKm: '', status: 'Active' })

  const openAdd = () => {
    setEditService(null)
    setForm({ name: '', description: '', basePrice: '', pricePerKm: '', status: 'Active' })
    setShowModal(true)
  }

  const openEdit = (svc) => {
    setEditService(svc)
    setForm({ ...svc })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name || form.basePrice === '' || form.pricePerKm === '') return
    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      pricePerKm: Number(form.pricePerKm),
    }
    if (editService) {
      updateService(editService.name, payload)
      setServices((prev) => prev.map((s) => (s.name === editService.name ? { ...s, ...payload } : s)))
      addChangelogEntry({
        action: 'Service Updated',
        targetType: 'General',
        details: `Updated service "${form.name}" pricing.`,
      })
    } else {
      SERVICES.push(payload)
      setServices([...SERVICES])
      addChangelogEntry({
        action: 'Service Created',
        targetType: 'General',
        details: `Created new service "${form.name}".`,
      })
    }
    setShowModal(false)
  }

  const handleDelete = (name) => {
    const idx = SERVICES.findIndex((s) => s.name === name)
    if (idx !== -1) {
      SERVICES.splice(idx, 1)
      setServices([...SERVICES])
      addChangelogEntry({
        action: 'Service Deleted',
        targetType: 'General',
        details: `Deleted service "${name}".`,
      })
    }
  }

  const toggleStatus = (svc) => {
    const newStatus = svc.status === 'Active' ? 'Inactive' : 'Active'
    updateService(svc.name, { status: newStatus })
    setServices((prev) => prev.map((s) => (s.name === svc.name ? { ...s, status: newStatus } : s)))
    addChangelogEntry({
      action: `Service Set ${newStatus}`,
      targetType: 'General',
      details: `Changed service "${svc.name}" status to ${newStatus}.`,
    })
  }

  return (
    <>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2>Services</h2>
          <p className="text-medium-emphasis mb-0">Manage available roadside assistance services and their pricing</p>
        </div>
        <CButton color="primary" onClick={openAdd} className="d-flex align-items-center gap-2">
          <CIcon icon={cilPlus} size="sm" /> Add Service
        </CButton>
      </div>

      <CCard>
        <CCardHeader className="d-flex align-items-center gap-2">
          <CIcon icon={cilSettings} className="text-primary" />
          <strong>All Services</strong>
        </CCardHeader>
        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Service</CTableHeaderCell>
                <CTableHeaderCell>Description</CTableHeaderCell>
                <CTableHeaderCell>Base Price</CTableHeaderCell>
                <CTableHeaderCell>Price / KM</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {services.map((svc) => (
                <CTableRow key={svc.name}>
                  <CTableDataCell className="fw-semibold">{svc.name}</CTableDataCell>
                  <CTableDataCell>{svc.description}</CTableDataCell>
                  <CTableDataCell>{svc.basePrice} EGP</CTableDataCell>
                  <CTableDataCell>{svc.pricePerKm} EGP/km</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={svc.status === 'Active' ? 'success' : 'secondary'}>{svc.status}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CButton color="primary" size="sm" className="me-2" onClick={() => openEdit(svc)}>
                      <CIcon icon={cilPencil} size="sm" /> Edit
                    </CButton>
                    <CButton color={svc.status === 'Active' ? 'warning' : 'success'} size="sm" className="me-2" onClick={() => toggleStatus(svc)}>
                      {svc.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </CButton>
                    <CButton color="danger" size="sm" onClick={() => handleDelete(svc.name)}>
                      <CIcon icon={cilTrash} size="sm" />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Add / Edit Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>{editService ? 'Edit Service' : 'Add New Service'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Service Name</label>
            <CFormInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Battery Jump"
              disabled={!!editService}
            />
          </div>
          <div className="mb-3">
            <label className="text-medium-emphasis small">Description</label>
            <CFormTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the service"
              rows={2}
            />
          </div>
           <CRow className="mb-3">
             <CCol sm={6}>
               <label className="text-medium-emphasis small">Base Price (EGP)</label>
               <CFormInput
                 type="number"
                 value={form.basePrice}
                 onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                 placeholder="250"
               />
             </CCol>
             <CCol sm={6}>
               <label className="text-medium-emphasis small">Price per KM (EGP)</label>
               <CFormInput
                 type="number"
                 value={form.pricePerKm}
                 onChange={(e) => setForm({ ...form, pricePerKm: e.target.value })}
                 placeholder="10"
               />
             </CCol>
           </CRow>
           <div className="mb-3">
             <label className="text-medium-emphasis small">Status</label>
             <CFormSelect
               value={form.status}
               onChange={(e) => setForm({ ...form, status: e.target.value })}
             >
               <option value="Active">Active</option>
               <option value="Inactive">Inactive</option>
             </CFormSelect>
           </div>
           <div className="mb-3">
             <label className="text-medium-emphasis small">Estimated Total (for 10km)</label>
             <div className="fs-5 fw-bold text-primary">
               {(Number(form.basePrice) || 0) + (Number(form.pricePerKm) || 0) * 10} EGP
             </div>
           </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
           <CButton color="primary" onClick={handleSave} disabled={!form.name || form.basePrice === '' || form.pricePerKm === ''}>
             {editService ? 'Save Changes' : 'Add Service'}
           </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Services