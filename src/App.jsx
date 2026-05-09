import { Routes, Route } from 'react-router-dom'
import WelcomePage      from './pages/WelcomePage.jsx'
import HomePage         from './pages/HomePage.jsx'
import LoginPage        from './pages/LoginPage.jsx'
import SignUpPage       from './pages/SignUpPage.jsx'
import KitPage          from './pages/KitPage.jsx'
import AccountPage      from './pages/AccountPage.jsx'
import AddDecisionPage  from './pages/AddDecisionPage.jsx'
import AddPillPage      from './pages/AddPillPage.jsx'
import PillPage         from './pages/PillPage.jsx'

function App() {
    return (
        <Routes>
            <Route path="/"           element={<WelcomePage />} />
            <Route path="/home"       element={<HomePage />} />
            <Route path="/login"      element={<LoginPage />} />
            <Route path="/signup"     element={<SignUpPage />} />
            <Route path="/kit"        element={<KitPage />} />
            <Route path="/account"    element={<AccountPage />} />
            <Route path="/add"        element={<AddDecisionPage />} />
            <Route path="/add/manual" element={<AddPillPage />} />
            <Route path="/pill/:id"   element={<PillPage />} />
        </Routes>
    )
}

export default App
