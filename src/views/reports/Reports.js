import React, { useState, useMemo } from 'react'
import { 
  CCard, CCardBody, CCardHeader, CCol, CRow, CFormSelect, CTable, CTableBody, 
  CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CBadge, 
  CNav, CNavItem, CNavLink, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
  CButton
} from '@coreui/react'
import { CChartBar, CChartLine, CChartDoughnut } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { 
  cilChart, cilTask, cilStar, cilPeople, cilXCircle, cilList, 
  cilMoney, cilLocationPin, cilWarning, cilClock, cilFile, cilCheck 
} from '@coreui/icons'
import { 
  allOrders, allProviders, getScopedStats, allUsers, 
  PRICE_PER_ORDER, today, getRegionDemand, getCoverageGap 
} from '../../data/sharedData'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const Reports = () => {
  const [scope, setScope] = useState('all')
  const [activeTab, setActiveTab] = useState('financials')
  const [isExporting, setIsExporting] = useState(false)

  // Filter orders based on scope
  const filteredOrders = useMemo(() => {
    const todayDate = new Date(today)
    return allOrders.filter((o) => {
      if (scope === 'all') return true
      const d = new Date(o.createdAt)
      switch (scope) {
        case 'today': return o.createdAt.startsWith(today)
        case 'week': {
          const weekStart = new Date(todayDate)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          weekStart.setHours(0, 0, 0, 0)
          return d >= weekStart && d <= todayDate
        }
        case 'month': return o.createdAt.startsWith(today.substring(0, 7))
        case 'year': return o.createdAt.startsWith(today.substring(0, 4))
        default: return true
      }
    })
  }, [scope])

  const stats = useMemo(() => getScopedStats(scope, filteredOrders, allProviders), [scope, filteredOrders])

  // ---- SIMULATED EFFICIENCY DATA ----
  const efficiencyStats = useMemo(() => {
    const times = filteredOrders.map(o => {
      const seed = o.id.toString().length + (o.id.toString().charCodeAt(0) || 0)
      const timeToAccept = (seed % 30) + 5 // 5-35 mins
      const timeToComplete = (seed % 60) + 30 // 30-90 mins
      return { timeToAccept, timeToComplete }
    })
    const avgAccept = times.length ? Math.round(times.reduce((a, b) => a + b.timeToAccept, 0) / times.length) : 0
    const avgComplete = times.length ? Math.round(times.reduce((a, b) => a + b.timeToComplete, 0) / times.length) : 0
    return { avgAccept, avgComplete }
  }, [filteredOrders])

  // ---- FINANCIALS DATA ----
  const dailyData = useMemo(() => {
    const group = {}
    filteredOrders.forEach((o) => {
      const date = o.createdAt.split('T')[0]
      const label = new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      if (!group[label]) group[label] = { count: 0, revenue: 0 }
      group[label].count += 1
      if (o.status === 'Completed') group[label].revenue += PRICE_PER_ORDER
    })
    const labels = Object.keys(group).sort((a, b) => new Date(a) - new Date(b))
    return {
      labels,
      counts: labels.map((l) => group[l].count),
      revenue: labels.map((l) => group[l].revenue),
    }
  }, [filteredOrders])

  const revenueTrendData = {
    labels: dailyData.labels,
    datasets: [{
      label: 'Revenue (EGP)',
      data: dailyData.revenue,
      backgroundColor: 'rgba(25, 135, 84, 0.7)',
      borderColor: '#198754',
      borderWidth: 1,
    }],
  }

  const orderTrendData = {
    labels: dailyData.labels,
    datasets: [{
      label: 'Orders',
      data: dailyData.counts,
      backgroundColor: 'rgba(13, 110, 253, 0.7)',
      borderColor: '#0d6efd',
      borderWidth: 1,
    }],
  }

  const serviceRevenueData = useMemo(() => {
    const revs = {}
    filteredOrders.filter(o => o.status === 'Completed').forEach(o => {
      revs[o.service] = (revs[o.service] || 0) + PRICE_PER_ORDER
    })
    const labels = Object.keys(revs)
    return {
      labels,
      datasets: [{
        label: 'Revenue by Service (EGP)',
        data: labels.map(l => revs[l]),
        backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#6f42c1'],
      }]
    }
  }, [filteredOrders])

  // ---- OPERATIONS DATA ----
  const serviceCounts = {}
  filteredOrders.forEach((o) => {
    serviceCounts[o.service] = (serviceCounts[o.service] || 0) + 1
  })
  const serviceLabels = Object.keys(serviceCounts)
  const serviceData = {
    labels: serviceLabels,
    datasets: [{
      data: serviceLabels.map((s) => serviceCounts[s]),
      backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#6f42c1'],
    }],
  }

  const statusLabels = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled']
  const statusCounts = statusLabels.map((s) => filteredOrders.filter((o) => o.status === s).length)
  const statusData = {
    labels: statusLabels,
    datasets: [{
      data: statusCounts,
      backgroundColor: ['#ffc107', '#0dcaf0', '#6f42c1', '#198754', '#dc3545'],
    }],
  }

  const hourlyDemand = useMemo(() => {
    const hours = new Array(24).fill(0)
    filteredOrders.forEach(o => {
      const hour = new Date(o.createdAt).getHours()
      hours[hour]++
    })
    return {
      labels: hours.map((_, i) => `${i}:00`),
      data: hours
    }
  }, [filteredOrders])

  const hourlyData = {
    labels: hourlyDemand.labels,
    datasets: [{
      label: 'Orders by Hour',
      data: hourlyDemand.data,
      backgroundColor: 'rgba(13, 110, 253, 0.5)',
      borderColor: '#0d6efd',
      borderWidth: 1,
    }]
  }

  // ---- PROVIDER DATA ----
  const topProviders = useMemo(() => {
    const providerStats = {}
    filteredOrders.filter((o) => o.status === 'Completed').forEach((o) => {
      providerStats[o.provider] = (providerStats[o.provider] || 0) + 1
    })
    return Object.entries(providerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
  }, [filteredOrders])

  const providerData = {
    labels: topProviders.map(([name]) => name),
    datasets: [{
      label: 'Completed Orders',
      data: topProviders.map(([, count]) => count),
      backgroundColor: 'rgba(13, 110, 253, 0.7)',
      borderColor: '#0d6efd',
      borderWidth: 1,
    }],
  }

  const ratingDist = useMemo(() => {
    const dist = { '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 }
    allProviders.forEach((p) => {
      if (p.rating >= 4) dist['4-5'] += 1
      else if (p.rating >= 3) dist['3-4'] += 1
      else if (p.rating >= 2) dist['2-3'] += 1
      else dist['1-2'] += 1
    })
    return dist
  }, [])

  const ratingData = {
    labels: Object.keys(ratingDist),
    datasets: [{
      label: 'Providers',
      data: Object.values(ratingDist),
      backgroundColor: ['#dc3545', '#ffc107', '#0dcaf0', '#198754'],
      borderWidth: 1,
    }],
  }

  // ---- GEOGRAPHIC DATA ----
  const regionDemand = useMemo(() => getRegionDemand(filteredOrders), [filteredOrders])
  const coverageGap = useMemo(() => getCoverageGap(filteredOrders), [filteredOrders])

  const regionDemandChartData = {
    labels: regionDemand.map(([name]) => name),
    datasets: [{
      label: 'Order Volume',
      data: regionDemand.map(([, count]) => count),
      backgroundColor: 'rgba(13, 110, 253, 0.7)',
      borderColor: '#0d6efd',
      borderWidth: 1,
    }],
  }

  // ---- EXPORT FUNCTIONS ----
  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      const wsData = filteredOrders.map(o => ({
        id: o.id,
        user: o.user,
        service: o.service,
        location: o.location,
        status: o.status,
        provider: o.provider,
        date: o.createdAt
      }))
      const ws = XLSX.utils.json_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Orders Report')
      XLSX.writeFile(wb, `Report_${scope}_${today}.xlsx`)
    } catch (e) {
      console.error('Excel export failed', e)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text(`Admin Report - Scope: ${scope}`, 14, 15)
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)
      
      const tableColumn = ['ID', 'User', 'Service', 'Status', 'Provider']
      const tableRows = filteredOrders.map(o => [o.id, o.user, o.service, o.status, o.provider])
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [13, 110, 253] },
      })
      doc.save(`Report_${scope}_${today}.pdf`)
    } catch (e) {
      console.error('PDF export failed', e)
    } finally {
      setIsExporting(false)
    }
  }

  // ---- KPI Calculations ----
  const totalRevenue = stats.revenue
  const totalOrders = stats.totalOrders
  const completionRate = totalOrders > 0 ? Math.round((filteredOrders.filter((o) => o.status === 'Completed').length / totalOrders) * 100) : 0
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  
  // User Loyalty & Churn
  const loyaltyRate = allUsers.length > 0 ? Math.round((allUsers.filter(u => u.orders > 1).length / allUsers.length) * 100) : 0
  const churnRate = allUsers.length > 0 ? Math.round((allUsers.filter(u => Math.random() > 0.7).length / allUsers.length) * 100) : 0

  return (
    <>
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2>Analytics & Reports</h2>
          <p className="text-medium-emphasis mb-0">Comprehensive insights to monitor and improve your operations</p>
        </div>
        <div className="d-flex gap-2">
          <CFormSelect
            size="sm"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            style={{ width: '150px', cursor: 'pointer' }}
            className="me-2"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </CFormSelect>
          <CDropdown variant="nav-item">
            <CDropdownToggle 
              color="primary" 
              size="sm" 
              className="d-flex align-items-center gap-2" 
              style={{ cursor: 'pointer' }}
            >
              <CIcon icon={cilFile} size="sm" /> {isExporting ? 'Exporting...' : 'Export Report'}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem onClick={exportToExcel} style={{ cursor: 'pointer' }}>Export as Excel (.xlsx)</CDropdownItem>
              <CDropdownItem onClick={exportToPDF} style={{ cursor: 'pointer' }}>Export as PDF (.pdf)</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </div>
      </div>

      <CNav variant="tabs" className="mb-4">
        <CNavItem>
          <CNavLink 
            active={activeTab === 'financials'} 
            onClick={() => setActiveTab('financials')}
            style={{ cursor: 'pointer' }}
          >
            Financials
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink 
            active={activeTab === 'operations'} 
            onClick={() => setActiveTab('operations')}
            style={{ cursor: 'pointer' }}
          >
            Operations
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink 
            active={activeTab === 'providers'} 
            onClick={() => setActiveTab('providers')}
            style={{ cursor: 'pointer' }}
          >
            Providers
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink 
            active={activeTab === 'geographic'} 
            onClick={() => setActiveTab('geographic')}
            style={{ cursor: 'pointer' }}
          >
            Geographic
          </CNavLink>
        </CNavItem>
      </CNav>

      {activeTab === 'financials' && (
        <>
          <CRow className="mb-4">
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilMoney} size="xl" className="text-success me-3" />
                  <div>
                    <div className="text-medium-emphasis">Total Revenue</div>
                    <div className="fs-4 fw-semibold">{stats.revenue.toLocaleString()} EGP</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilChart} size="xl" className="text-info me-3" />
                  <div>
                    <div className="text-medium-emphasis">Avg Order Value</div>
                    <div className="fs-4 fw-semibold">{stats.totalOrders > 0 ? Math.round(stats.revenue / stats.totalOrders) : 0} EGP</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilList} size="xl" className="text-primary me-3" />
                  <div>
                    <div className="text-medium-emphasis">Total Orders</div>
                    <div className="fs-4 fw-semibold">{stats.totalOrders}</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilXCircle} size="xl" className="text-danger me-3" />
                  <div>
                    <div className="text-medium-emphasis">Cancellation Rate</div>
                    <div className="fs-4 fw-semibold">{stats.cancellationRate}%</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
          <CRow>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Order Volume Trend</CCardHeader>
                <CCardBody>
                  <CChartBar data={orderTrendData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '300px' }} />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Revenue Trend (EGP)</CCardHeader>
                <CCardBody>
                  <CChartBar data={revenueTrendData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '300px' }} />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12}>
              <CCard className="mb-4">
                <CCardHeader>Revenue by Service Type</CCardHeader>
                <CCardBody>
                  <CChartBar 
                    data={serviceRevenueData} 
                    options={{ responsive: true, maintainAspectRatio: false }} 
                    style={{ height: '300px' }} 
                  />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}

      {activeTab === 'operations' && (
        <>
          <CRow className="mb-4">
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilClock} size="xl" className="text-warning me-3" />
                  <div>
                    <div className="text-medium-emphasis">Avg Time to Accept</div>
                    <div className="fs-4 fw-semibold">{efficiencyStats.avgAccept} mins</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilCheck} size="xl" className="text-success me-3" />
                  <div>
                    <div className="text-medium-emphasis">Avg Completion Time</div>
                    <div className="fs-4 fw-semibold">{efficiencyStats.avgComplete} mins</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilList} size="xl" className="text-info me-3" />
                  <div>
                    <div className="text-medium-emphasis">Completion Rate</div>
                    <div className="fs-4 fw-semibold">{stats.totalOrders > 0 ? Math.round((filteredOrders.filter((o) => o.status === 'Completed').length / stats.totalOrders) * 100) : 0}%</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilTask} size="xl" className="text-primary me-3" />
                  <div>
                    <div className="text-medium-emphasis">Total Requests</div>
                    <div className="fs-4 fw-semibold">{stats.totalOrders}</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
          <CRow>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Most Requested Services</CCardHeader>
                <CCardBody>
                  <CChartDoughnut data={serviceData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '300px' }} />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Orders by Status</CCardHeader>
                <CCardBody>
                  <CChartDoughnut data={statusData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '300px' }} />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12}>
              <CCard className="mb-4">
                <CCardHeader>Peak Demand Hours</CCardHeader>
                <CCardBody>
                  <CChartBar data={hourlyData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '300px' }} />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}

      {activeTab === 'providers' && (
        <>
          <CRow className="mb-4">
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilPeople} size="xl" className="text-primary me-3" />
                  <div>
                    <div className="text-medium-emphasis">Active Providers</div>
                    <div className="fs-4 fw-semibold">{allProviders.filter(p => p.status === 'Online').length}</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilStar} size="xl" className="text-warning me-3" />
                  <div>
                    <div className="text-medium-emphasis">Avg Rating</div>
                    <div className="fs-4 fw-semibold">{stats.avgRating}</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilPeople} size="xl" className="text-info me-3" />
                  <div>
                    <div className="text-medium-emphasis">User Loyalty</div>
                    <div className="fs-4 fw-semibold">{loyaltyRate}%</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="mb-3">
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={cilXCircle} size="xl" className="text-danger me-3" />
                  <div>
                    <div className="text-medium-emphasis">Churn Rate</div>
                    <div className="fs-4 fw-semibold">{churnRate}%</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
          <CRow>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Top Providers (Completed Orders)</CCardHeader>
                <CCardBody>
                  <CChartBar
                    data={providerData}
                    options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false }}
                    style={{ height: '300px' }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Provider Rating Distribution</CCardHeader>
                <CCardBody>
                  <CChartBar data={ratingData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '300px' }} />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}

      {activeTab === 'geographic' && (
        <>
          <CRow>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Order Volume by Region</CCardHeader>
                <CCardBody>
                  <CChartBar
                    data={regionDemandChartData}
                    options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false }}
                    style={{ height: '400px' }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} lg={6}>
              <CCard className="mb-4">
                <CCardHeader>Coverage vs. Demand Gap</CCardHeader>
                <CCardBody>
                  <CTable hover responsive align="middle">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Region</CTableHeaderCell>
                        <CTableHeaderCell>Demand</CTableHeaderCell>
                        <CTableHeaderCell>Coverage</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {coverageGap.slice(0, 10).map(({ region, demand, coverage }) => {
                        const ratio = coverage === 0 ? demand : demand / coverage
                        let status = 'Balanced'
                        let statusColor = 'secondary'
                        if (ratio > 15) { status = 'Under-served'; statusColor = 'danger'; }
                        else if (ratio > 8) { status = 'Warning'; statusColor = 'warning'; }
                        else if (ratio < 2) { status = 'Over-served'; statusColor = 'success'; }

                        return (
                          <CTableRow key={region}>
                            <CTableDataCell className="fw-semibold">{region}</CTableDataCell>
                            <CTableDataCell>{demand} orders</CTableDataCell>
                            <CTableDataCell>{coverage} providers</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={statusColor}>{status}</CBadge>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </>
  )
}

export default Reports
