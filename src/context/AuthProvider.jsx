import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext({ isAuthenticated: false, login: () => {}, logout: () => {} })

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const token = Cookies.get('authToken')
        setIsAuthenticated(!!token)
    }, [])

    const login = () => {
        Cookies.set('authToken', 'mock-token', { expires: 7 })
        setIsAuthenticated(true)
    }

    const logout = () => {
        Cookies.remove('authToken')
        setIsAuthenticated(false)
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
