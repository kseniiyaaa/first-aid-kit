import '../styles/Header.css'

export default function Header() {
    return (
        <header className="header">
            <div className="logo"><img src="/src/img/logo.svg" alt="MediKit Logo" className="logo-image" />MediKit</div>
            <div className="auth-buttons">
                <button className="login">Login</button>
                <button className="signup">Sign Up</button>
            </div>
        </header>
    )
}