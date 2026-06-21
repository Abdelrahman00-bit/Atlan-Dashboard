import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="#" rel="noopener noreferrer">
          ATLAN
        </a>
        <span className="ms-1">&copy; 2026 ATLAN Team.</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Powered by</span>
        <a href="#" rel="noopener noreferrer">
          ATLAN Team
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
