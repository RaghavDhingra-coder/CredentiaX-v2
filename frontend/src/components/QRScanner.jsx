import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { parseQRCode } from '../utils/parseQRCode.js'

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CameraIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  )
}

function FlipCameraIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ─── Scanner states ───────────────────────────────────────────────────────────
// idle → starting → scanning → success | error | denied

/**
 * QRScanner — live camera QR code reader.
 *
 * Props:
 *   onScan(certId: string) — called once with a valid cert ID
 *   onClose()              — called when user dismisses the modal
 */
export default function QRScanner({ onScan, onClose }) {
  const uid        = useId().replace(/:/g, '')   // stable DOM id, no colons
  const viewId     = `qr-view-${uid}`

  const scannerRef = useRef(null)   // Html5Qrcode instance
  const scannedRef = useRef(false)  // prevent duplicate callbacks
  const mountedRef = useRef(true)

  const [phase,      setPhase]      = useState('idle')   // idle|starting|scanning|success|error|denied
  const [errMsg,     setErrMsg]     = useState('')
  const [scannedId,  setScannedId]  = useState(null)
  const [cameras,    setCameras]    = useState([])
  const [activeCam,  setActiveCam]  = useState(null)     // deviceId string

  // ── Cleanup ───────────────────────────────────────────────────────────────

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current
    if (!s) return
    try {
      const state = s.getState()
      // state 2 = SCANNING, state 3 = PAUSED
      if (state === 2 || state === 3) {
        await s.stop()
      }
    } catch {
      // ignore — scanner may already be stopped
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [stopScanner])

  // ── Start scanning ────────────────────────────────────────────────────────

  const startScanner = useCallback(async (deviceId) => {
    if (!mountedRef.current) return

    // Stop any previous instance
    await stopScanner()
    if (scannerRef.current) {
      try { scannerRef.current.clear() } catch { /* ignored */ }
      scannerRef.current = null
    }

    scannedRef.current = false
    setPhase('starting')
    setErrMsg('')

    let cameraList = cameras
    if (cameraList.length === 0) {
      try {
        cameraList = await Html5Qrcode.getCameras()
        if (!mountedRef.current) return
        setCameras(cameraList)
      } catch (err) {
        if (!mountedRef.current) return
        const msg = err?.message || ''
        if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
          setPhase('denied')
        } else {
          setPhase('error')
          setErrMsg('Could not access camera. Make sure a camera is connected.')
        }
        return
      }
    }

    if (cameraList.length === 0) {
      if (mountedRef.current) {
        setPhase('error')
        setErrMsg('No cameras detected on this device.')
      }
      return
    }

    // Pick camera: supplied deviceId → rear-facing → first available
    const chosenId = deviceId
      ?? cameraList.find(c => /back|rear|environment/i.test(c.label))?.id
      ?? cameraList[0].id

    if (mountedRef.current) setActiveCam(chosenId)

    const scanner = new Html5Qrcode(viewId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner

    const config = {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1,
      disableFlip: false,
    }

    function onSuccess(decodedText) {
      if (scannedRef.current) return
      const certId = parseQRCode(decodedText)
      if (!certId) return   // silently ignore unrecognised QR codes

      scannedRef.current = true
      stopScanner()
      if (mountedRef.current) {
        setScannedId(certId)
        setPhase('success')
        // Delay so user sees the success frame briefly
        setTimeout(() => { if (mountedRef.current) onScan(certId) }, 900)
      }
    }

    try {
      await scanner.start({ deviceId: { exact: chosenId } }, config, onSuccess, () => {})
      if (mountedRef.current) setPhase('scanning')
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err?.message || ''
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        setPhase('denied')
      } else {
        setPhase('error')
        setErrMsg(msg || 'Failed to start camera. Try a different browser or camera.')
      }
    }
  }, [cameras, stopScanner, viewId, onScan])

  // Auto-start on mount
  useEffect(() => {
    startScanner(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Camera switcher ───────────────────────────────────────────────────────

  const otherCamera = cameras.find(c => c.id !== activeCam)

  async function switchCamera() {
    if (!otherCamera) return
    await startScanner(otherCamera.id)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scan QR Code</p>
              <p className="text-xs text-slate-500">Point camera at certificate QR</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { stopScanner(); onClose() }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <XIcon />
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="relative bg-black" style={{ minHeight: 300 }}>

          {/* html5-qrcode mounts here */}
          <div id={viewId} className="w-full" />

          {/* Animated corner frame overlay (shown while scanning) */}
          {phase === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-52 h-52">
                {/* corners */}
                {[
                  'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                  'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                  'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                ].map((cls, i) => (
                  <span key={i} className={`absolute w-7 h-7 border-indigo-400 ${cls}`} />
                ))}
                {/* scan line */}
                <span className="absolute left-0 right-0 h-0.5 bg-indigo-400/70 animate-[scanline_2s_ease-in-out_infinite]"
                  style={{ top: '50%', boxShadow: '0 0 8px rgba(99,102,241,0.7)' }} />
              </div>
            </div>
          )}

          {/* Starting overlay */}
          {phase === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Starting camera…</p>
            </div>
          )}

          {/* Success overlay */}
          {phase === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/80">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-pulse">
                <CheckIcon />
              </div>
              <p className="text-emerald-400 font-semibold text-sm">QR Code Detected</p>
              {scannedId && <p className="font-mono text-xs text-emerald-300/70">{scannedId}</p>}
            </div>
          )}

          {/* Permission denied overlay */}
          {phase === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-950/95">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <CameraIcon className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm mb-1">Camera Access Denied</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Allow camera access in your browser settings, then reload and try again.
                </p>
              </div>
              <div className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-left space-y-1 w-full">
                <p className="font-medium text-slate-400 mb-1.5">How to enable:</p>
                <p>Chrome: address bar lock icon → Permissions → Camera</p>
                <p>Safari: Settings → Websites → Camera</p>
                <p>Firefox: address bar camera icon → Allow</p>
              </div>
            </div>
          )}

          {/* Generic error overlay */}
          {phase === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-950/95">
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-slate-300 text-sm">{errMsg}</p>
              <button
                type="button"
                onClick={() => startScanner(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer / controls */}
        <div className="px-5 py-4 flex items-center justify-between border-t border-slate-800">
          <p className="text-xs text-slate-500">
            {phase === 'scanning' && 'Hold steady — scanning…'}
            {phase === 'starting' && 'Requesting camera…'}
            {phase === 'success' && 'Verifying credential…'}
            {phase === 'idle'    && 'Ready'}
            {phase === 'denied' || phase === 'error' ? 'Camera unavailable' : ''}
          </p>
          <div className="flex items-center gap-2">
            {/* Camera flip — only show when multiple cameras & scanning */}
            {otherCamera && (phase === 'scanning' || phase === 'starting') && (
              <button
                type="button"
                onClick={switchCamera}
                title={`Switch to ${otherCamera.label || 'other camera'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all border border-slate-700"
              >
                <FlipCameraIcon />
                Flip
              </button>
            )}
            {/* Rescan button after success */}
            {phase === 'success' && (
              <button
                type="button"
                onClick={() => startScanner(activeCam)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all border border-slate-700"
              >
                Scan Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
