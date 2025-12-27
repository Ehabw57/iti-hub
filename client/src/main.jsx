import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IntlayerProvider } from 'react-intlayer'
import QueryProvider from './providers/QueryProvider.jsx'
import AuthProvider from './providers/AuthProvider.jsx'
import SocketProvider from './providers/SocketProvider.jsx'
import LoginRequiredModal from './components/auth/LoginRequiredModal.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
    <IntlayerProvider>
        <QueryProvider>
            <AuthProvider>
                <SocketProvider>
                    <App />
                    <Toaster position="bottom-right" />
                    <LoginRequiredModal />
                </SocketProvider>
            </AuthProvider>
        </QueryProvider>
    </IntlayerProvider>
)
