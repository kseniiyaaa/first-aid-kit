import Header from "./components/header/Header.jsx";
import Footer from "./components/footer/Footer.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import './styles/layout.css';

export default function Layout({ children }) {
    return (
        <div className="app-shell">
            <AuthProvider>
                <Header />
                <main className="app-main">
                    {children}
                </main>
                <Footer />
            </AuthProvider>
        </div>
    );
}
