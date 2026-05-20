import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers'
import toast from 'react-hot-toast'
import api from '../services/api.js'

const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '80002', 10)

const POLYGON_AMOY = {
  chainId: '0x13882',
  chainName: 'Polygon Amoy',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
}

const HARDHAT_LOCAL = {
  chainId: '0x7a69',
  chainName: 'Hardhat Local',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
}

function chainName(id) {
  if (id === 80002) return 'Polygon Amoy'
  if (id === 31337) return 'Hardhat Local'
  return `Chain ${id}`
}

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [address, setAddress]     = useState(() => localStorage.getItem('cx_wallet') || null)
  const [network, setNetwork]     = useState(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [provider, setProvider]   = useState(null)

  const isInstalled = typeof window !== 'undefined' && !!window.ethereum

  function updateNetwork(chainId) {
    const id = typeof chainId === 'bigint' ? Number(chainId) : parseInt(chainId, 16)
    setIsCorrectNetwork(id === TARGET_CHAIN_ID)
    setNetwork(chainName(id))
  }

  async function syncProviderState(eth) {
    try {
      const p = new BrowserProvider(eth)
      setProvider(p)
      const network = await p.getNetwork()
      updateNetwork(network.chainId)
      const accounts = await p.listAccounts()
      if (accounts.length > 0) {
        const addr = accounts[0].address
        setAddress(addr)
        localStorage.setItem('cx_wallet', addr)
      } else {
        setAddress(null)
        localStorage.removeItem('cx_wallet')
      }
    } catch {
      // provider unavailable
    }
  }

  useEffect(() => {
    if (!isInstalled) return

    syncProviderState(window.ethereum)

    function onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        setAddress(null)
        localStorage.removeItem('cx_wallet')
        toast('Wallet disconnected', { icon: '🔌' })
      } else {
        setAddress(accounts[0])
        localStorage.setItem('cx_wallet', accounts[0])
      }
    }

    function onChainChanged(chainId) {
      updateNetwork(chainId)
    }

    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged', onChainChanged)
    }
  }, [isInstalled])

  const switchToAmoy = useCallback(async () => {
    if (!isInstalled) return
    const targetNetwork = TARGET_CHAIN_ID === 31337 ? HARDHAT_LOCAL : POLYGON_AMOY
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      })
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [targetNetwork],
        })
      } else {
        throw err
      }
    }
  }, [isInstalled])

  const connect = useCallback(async () => {
    if (!isInstalled) {
      toast.error('MetaMask is not installed. Please install it to continue.')
      return
    }
    setConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const addr = accounts[0]

      const p = new BrowserProvider(window.ethereum)
      setProvider(p)
      const net = await p.getNetwork()
      updateNetwork(net.chainId)

      if (Number(net.chainId) !== TARGET_CHAIN_ID) {
        const label = TARGET_CHAIN_ID === 31337 ? 'Hardhat Local' : 'Polygon Amoy'
        toast(`Switching to ${label}…`, { icon: '🔄' })
        await switchToAmoy()
      }

      setAddress(addr)
      localStorage.setItem('cx_wallet', addr)

      // Persist to backend
      await api.patch('/auth/wallet', { walletAddress: addr })
      toast.success('Wallet connected')
    } catch (err) {
      if (err.code === 4001) {
        toast.error('Connection rejected')
      } else {
        toast.error(err.message || 'Failed to connect wallet')
      }
    } finally {
      setConnecting(false)
    }
  }, [isInstalled, switchToAmoy])

  const disconnect = useCallback(async () => {
    setAddress(null)
    setProvider(null)
    setNetwork(null)
    setIsCorrectNetwork(false)
    localStorage.removeItem('cx_wallet')
    try {
      await api.patch('/auth/wallet', { walletAddress: null })
    } catch {
      // non-critical
    }
    toast('Wallet disconnected', { icon: '🔌' })
  }, [])

  const getSigner = useCallback(async () => {
    if (!provider) throw new Error('Wallet not connected')
    return provider.getSigner()
  }, [provider])

  return (
    <WalletContext.Provider value={{ address, network, isCorrectNetwork, connecting, provider, isInstalled, connect, disconnect, switchToAmoy, getSigner }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
