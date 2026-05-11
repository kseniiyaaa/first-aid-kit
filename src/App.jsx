import { Routes, Route } from 'react-router-dom'
import WelcomePage      from './pages/WelcomePage.jsx'
import HomePage         from './pages/HomePage.jsx'
import LoginPage        from './pages/LoginPage.jsx'
import SignUpPage       from './pages/SignUpPage.jsx'
import KitPage          from './pages/KitPage.jsx'
import AccountPage      from './pages/AccountPage.jsx'
import AddDecisionPage  from './pages/AddDecisionPage.jsx'
import AddPillPage      from './pages/AddPillPage.jsx'
import AddReminderPage  from './pages/AddReminderPage.jsx'
import EditReminderPage from './pages/EditReminderPage.jsx'
import RemindersPage    from './pages/RemindersPage.jsx'
import PillPage         from './pages/PillPage.jsx'
import VerifyEmailPage      from './pages/VerifyEmailPage.jsx'
import ForgotPasswordPage   from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage    from './pages/ResetPasswordPage.jsx'
import ProtectedRoute       from './components/ProtectedRoute.jsx'

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/"             element={<WelcomePage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/signup"       element={<SignUpPage />} />
            <Route path="/verify-email"    element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            {/* Protected routes — redirect to /login if not authenticated */}
            <Route path="/home"       element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/kit"        element={<ProtectedRoute><KitPage /></ProtectedRoute>} />
            <Route path="/account"    element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/add"        element={<ProtectedRoute><AddDecisionPage /></ProtectedRoute>} />
            <Route path="/add/manual"   element={<ProtectedRoute><AddPillPage /></ProtectedRoute>} />
            <Route path="/add/reminder"        element={<ProtectedRoute><AddReminderPage /></ProtectedRoute>} />
            <Route path="/reminders"           element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/reminders/:id/edit"  element={<ProtectedRoute><EditReminderPage /></ProtectedRoute>} />
            <Route path="/pill/:id"            element={<ProtectedRoute><PillPage /></ProtectedRoute>} />
        </Routes>
    )
}

export default App
