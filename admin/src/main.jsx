import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'
import Stations from './pages/Stations'
import Transactions from './pages/Transactions'
import UsersPage from './pages/Users'
import SettingsPage from './pages/Settings'

import Login from './pages/Login'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/stations', element: <Stations /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
