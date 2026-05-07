import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    login: () => {},
    logout: () => {},
    updateUser: () => {},
})

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState(null)

    useEffect(() => {
        const token = Cookies.get('authToken')
        const storedUser = localStorage.getItem('medikit_user')
        if (token && storedUser) {
            setIsAuthenticated(true)
            setUser(JSON.parse(storedUser))
        }
    }, [])

    const login = (token, userData) => {
        Cookies.set('authToken', token, { expires: 7, sameSite: 'strict' })
        localStorage.setItem('medikit_user', JSON.stringify(userData))
        setIsAuthenticated(true)
        setUser(userData)
    }

    const logout = () => {
        Cookies.remove('authToken')
        localStorage.removeItem('medikit_user')
        setIsAuthenticated(false)
        setUser(null)
    }

    const updateUser = (partialData) => {
        const updated = { ...user, ...partialData }
        localStorage.setItem('medikit_user', JSON.stringify(updated))
        setUser(updated)
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
