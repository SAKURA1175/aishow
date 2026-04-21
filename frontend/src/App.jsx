import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Chat from '@/pages/Chat'
import Documents from '@/pages/Documents'
import Profile from '@/pages/Profile'
import History from '@/pages/History'
import Admin from '@/pages/Admin'
import Layout from '@/pages/Layout'
import StarMap from '@/pages/StarMap'
import Resume from '@/pages/Resume'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<Chat />} />
          <Route path="documents" element={<Documents />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<History />} />
          <Route path="starmap" element={<StarMap />} />
          <Route path="resume" element={<Resume />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
