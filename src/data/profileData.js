/**
 * Profile and Changelog Data Management
 *
 * Uses localStorage to persist admin profile and action logs.
 * @module profileData
 */

const PROFILE_KEY = 'atlan_admin_profile'
const CHANGELOG_KEY = 'atlan_admin_changelog'

const defaultProfile = {
  name: 'Admin User',
  email: 'admin@atlan.eg',
  phone: '+20 10 123 4567',
  role: 'Super Admin',
  bio: 'Platform administrator overseeing daily operations.',
  avatar: null,
}

// ---- Profile Helpers ----

export const getProfile = () => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    return stored ? { ...defaultProfile, ...JSON.parse(stored) } : { ...defaultProfile }
  } catch {
    return { ...defaultProfile }
  }
}

export const saveProfile = (data) => {
  const current = getProfile()
  const updated = { ...current, ...data }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('profileUpdated'))
  addChangelogEntry({
    action: 'Profile Updated',
    targetType: 'General',
    details: 'Admin profile information was updated.',
  })
  return updated
}

export const getAdminName = () => {
  const profile = getProfile()
  return profile.name || 'Admin User'
}

// ---- Changelog Helpers ----

export const getChangelog = () => {
  try {
    const stored = localStorage.getItem(CHANGELOG_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  // Seed with initial entry if empty
  const seed = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      admin: getAdminName(),
      action: 'System Login',
      targetType: 'General',
      targetId: null,
      targetName: null,
      details: 'Admin logged into the dashboard.',
    },
  ]
  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(seed))
  return seed
}

/**
 * Add a new changelog entry.
 * @param {Object} entry
 * @param {string} entry.action - e.g. 'Block User', 'Cancel Order' etc.
 * @param {string} [entry.targetType='General'] - 'User', 'Provider', 'Order', or 'General'
 * @param {string|number} [entry.targetId=null]
 * @param {string} [entry.targetName=null]
 * @param {string} entry.details
 */
export const addChangelogEntry = (entry) => {
  const logs = getChangelog()
  const newEntry = {
    id: logs.length > 0 ? Math.max(...logs.map((l) => l.id)) + 1 : 1,
    timestamp: new Date().toISOString(),
    admin: getAdminName(),
    action: entry.action,
    targetType: entry.targetType || 'General',
    targetId: entry.targetId ?? null,
    targetName: entry.targetName ?? null,
    details: entry.details || '',
  }
  const updated = [newEntry, ...logs].slice(0, 500) // keep last 500 entries
  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(updated))
  return updated
}
