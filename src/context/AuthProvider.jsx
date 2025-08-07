import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext({ isAuthenticated: false })

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const token = Cookies.get('authToken')
        setIsAuthenticated(!!token)
    }, [])

    return (
        <AuthContext.Provider value={{ isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
