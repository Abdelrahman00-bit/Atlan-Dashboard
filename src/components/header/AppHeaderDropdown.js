import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { addChangelogEntry, getProfile } from '../../data/profileData'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const [avatarSrc, setAvatarSrc] = useState(() => getProfile().avatar || avatar8)

  useEffect(() => {
    const handleUpdate = () => {
      setAvatarSrc(getProfile().avatar || avatar8)
    }
    window.addEventListener('profileUpdated', handleUpdate)
    return () => window.removeEventListener('profileUpdated', handleUpdate)
  }, [])

  const handleLogout = () => {
    addChangelogEntry({
      action: 'System Logout',
      targetType: 'General',
      details: 'Admin logged out of the dashboard.',
    })
    localStorage.removeItem('isAuthenticated')
    navigate('/login')
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'inline-block',
            verticalAlign: 'middle'
          }}
        >
          <img
            src={avatarSrc}
            alt="Avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
        <CDropdownItem href="/#/profile">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem href="/#/settings">
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem
          as="button"
          type="button"
          onClick={handleLogout}
        >
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
