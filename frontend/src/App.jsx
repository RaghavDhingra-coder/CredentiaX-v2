import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '13px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#1e293b' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
              },
            }}
          />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
