import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="w-full border-t border-slate-800 bg-slate-900/40">
        <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-6">
          <p className="text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} CredentiaX · Decentralized Identity Network
          </p>
        </div>
      </footer>
    </div>
  )
}
