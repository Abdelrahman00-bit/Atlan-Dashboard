/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application using React lazy loading
 * for code splitting and performance optimization.
 *
 * @module routes
 */

import React from 'react'

// Dashboard & Core
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Orders = React.lazy(() => import('./views/orders/Orders'))
const OrderDetail = React.lazy(() => import('./views/orders/OrderDetail'))
const Providers = React.lazy(() => import('./views/providers/Providers'))
const Users = React.lazy(() => import('./views/users/Users'))
const UserDetail = React.lazy(() => import('./views/users/UserDetail'))
const ProviderDetail = React.lazy(() => import('./views/providers/ProviderDetail'))
const Reports = React.lazy(() => import('./views/reports/Reports'))

// Stubs for remaining nav links
const Services = React.lazy(() => import('./views/services/Services'))
const Map = React.lazy(() => import('./views/map/LiveMap'))
const Ratings = React.lazy(() => import('./views/ratings/Ratings'))
const Settings = React.lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/orders', name: 'Orders', element: Orders },
  { path: '/orders/detail/:id', name: 'Order Detail', element: OrderDetail },
  { path: '/providers', name: 'Providers', element: Providers },
  { path: '/providers/detail/:id', name: 'Provider Detail', element: ProviderDetail },
  { path: '/users', name: 'Users', element: Users },
  { path: '/users/detail/:id', name: 'User Detail', element: UserDetail },
  { path: '/reports', name: 'Reports', element: Reports },
  { path: '/services', name: 'Services', element: Services },
  { path: '/map', name: 'Map Tracking', element: Map },
  { path: '/ratings', name: 'Ratings', element: Ratings },
  { path: '/settings', name: 'Settings', element: Settings },
]

export default routes
