import Header from "./components/header/Header.jsx";
import {AuthProvider} from "./context/AuthProvider.jsx";

export default function Layout({ children }) {
    return (
        <div>
            <AuthProvider>
                <Header isLoggedIn={true} />
                {children}
            </AuthProvider>
        </div>
    );
}