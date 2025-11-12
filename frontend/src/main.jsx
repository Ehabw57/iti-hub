import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IntlayerProvider } from 'react-intlayer'

createRoot(document.getElementById('root')).render(
    <IntlayerProvider>
        <App />
    </IntlayerProvider>
)
