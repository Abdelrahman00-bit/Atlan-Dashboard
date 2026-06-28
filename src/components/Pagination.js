import React from 'react'
import { CButton, CFormSelect } from '@coreui/react'

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
  totalItems,
  label = 'items'
}) => {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages = []
    const showMax = 5
    
    if (totalPages <= showMax + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }
    return pages
  }

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between mt-3 pt-3 border-top">
      <div className="text-medium-emphasis mb-2 mb-md-0">
        Showing <strong>{totalItems === 0 ? 0 : startIndex}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> {label}
      </div>
      <div className="d-flex align-items-center gap-2">
        <CButton
          size="sm"
          color="light"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </CButton>
        
        <div className="d-flex gap-1">
          {getPages().map((page, idx) => (
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="d-flex align-items-center px-1 text-medium-emphasis">...</span>
            ) : (
              <CButton
                key={page}
                size="sm"
                color={currentPage === page ? 'primary' : 'light'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </CButton>
            )
          ))}
        </div>

        <CButton
          size="sm"
          color="light"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </CButton>

        <div className="d-flex align-items-center gap-2 ms-2">
          <span className="text-small text-medium-emphasis">Jump to:</span>
          <CFormSelect
            size="sm"
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            style={{ width: '70px' }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <option key={page} value={page}>{page}</option>
            ))}
          </CFormSelect>
        </div>

        <CFormSelect
          size="sm"
          value={itemsPerPage}
          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          style={{ width: '80px' }}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </CFormSelect>
      </div>
    </div>
  )
}

export default Pagination
