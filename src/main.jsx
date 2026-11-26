import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

class ChatWaveErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('ChatWave render crash:', error, info) }
  render() {
    if (this.state.error) return <div style={{minHeight:'100vh',background:'#101827',color:'#fff',padding:'24px',fontFamily:'sans-serif',boxSizing:'border-box'}}><h2>ChatWave mengalami kesalahan</h2><p>Informasi error untuk membantu perbaikan:</p><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:'#222b3b',padding:'16px',borderRadius:'12px'}}>{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre><button onClick={()=>location.reload()} style={{padding:'12px 18px',borderRadius:'10px'}}>Muat ulang</button></div>
    return this.props.children
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<ChatWaveErrorBoundary><App /></ChatWaveErrorBoundary>)

window.addEventListener('error', event => {
  console.error('ChatWave global error:', event.error || event.message)
})
window.addEventListener('unhandledrejection', event => {
  console.error('ChatWave promise error:', event.reason)
})
