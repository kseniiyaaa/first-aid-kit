import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isInitialized } = useAuth()

    // Wait until auth state is restored from localStorage before deciding
    if (!isInitialized) return null

    if (!isAuthenticated) return <Navigate to="/login" replace />

    return children
}
