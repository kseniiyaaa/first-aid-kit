import { Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage.jsx'
import HomePage from './pages/HomePage.jsx'

function App() {
    return (
        <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/home" element={<HomePage />} />
        </Routes>
    )
}

export default App
