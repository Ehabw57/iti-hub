import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IntlayerProvider } from 'react-intlayer'
import QueryProvider from './providers/QueryProvider.jsx'
import AuthProvider from './providers/AuthProvider.jsx'
import RequireAuthProvider from './providers/RequireAuthProvider.jsx'
import SocketProvider from './providers/SocketProvider.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
    <IntlayerProvider>
        <QueryProvider>
            <AuthProvider>
                <RequireAuthProvider>
                    <SocketProvider>
                        <App />
                        <Toaster position="bottom-right" />
                    </SocketProvider>
                </RequireAuthProvider>
            </AuthProvider>
        </QueryProvider>
    </IntlayerProvider>
)
