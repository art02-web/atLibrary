import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import UserDashboard from './pages/user/UserDashboard'
import BrowseBooks from './pages/user/BrowseBooks'
import BookDetails from './pages/user/BookDetails'
import MyBorrows from './pages/user/MyBorrows'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageBooks from './pages/admin/ManageBooks'
import ManageBorrows from './pages/admin/ManageBorrows'
import ManageUsers from './pages/admin/ManageUsers'

// Shows the right dashboard for the logged-in role
function Dashboard() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <UserDashboard />
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/books" element={<BrowseBooks />} />
            <Route path="/books/:id" element={<BookDetails />} />
            <Route path="/profile" element={<Profile />} />

            {/* Members only */}
            <Route element={<ProtectedRoute roles={['user']} />}>
              <Route path="/my-borrows" element={<MyBorrows />} />
            </Route>

            {/* Admins only */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="books" element={<ManageBooks />} />
              <Route path="borrows" element={<ManageBorrows />} />
              <Route path="users" element={<ManageUsers />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
