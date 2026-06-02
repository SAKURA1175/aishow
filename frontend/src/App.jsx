import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Chat from '@/pages/Chat'
import Documents from '@/pages/Documents'
import Profile from '@/pages/Profile'
import History from '@/pages/History'
import Admin from '@/pages/Admin'
import Layout from '@/pages/Layout'
import StarMap from '@/pages/StarMap'
import Resume from '@/pages/Resume'
import Classes from '@/pages/Classes'
import Assignments from '@/pages/Assignments'
import Grades from '@/pages/Grades'
import Schedule from '@/pages/Schedule'
import WrongQuestions from '@/pages/WrongQuestions'
import Notes from '@/pages/Notes'
import Forum from '@/pages/Forum'
import CheckinPage from '@/pages/CheckinPage'
import Exams from '@/pages/Exams'

export default function App() {
  const basename = window.location.pathname.startsWith('/app') ? '/app' : undefined

  return (
    <BrowserRouter basename={basename}>
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="documents" element={<Documents />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<History />} />
          <Route path="starmap" element={<StarMap />} />
          <Route path="resume" element={<Resume />} />
          <Route path="classes" element={<Classes />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="grades" element={<Grades />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="wrong-questions" element={<WrongQuestions />} />
          <Route path="notes" element={<Notes />} />
          <Route path="forum" element={<Forum />} />
          <Route path="checkin" element={<CheckinPage />} />
          <Route path="exams" element={<Exams />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
