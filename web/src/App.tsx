import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import TtsPage from './pages/TtsPage'
import AsrPage from './pages/AsrPage'
import DocsPage from './pages/DocsPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', background: '#f9f9f9' }}>
        <Link to="/tts" style={{ marginRight: '1rem' }}>文字转语音</Link>
        <Link to="/asr" style={{ marginRight: '1rem' }}>语音转文字</Link>
        <Link to="/docs" style={{ marginRight: '1rem' }}>文档</Link>
        <Link to="/settings">设置</Link>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/tts" element={<TtsPage />} />
          <Route path="/asr" element={<AsrPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<div><h2>Liber Speech 前端</h2><p>请选择功能：</p><nav><Link to="/tts">文字转语音</Link> | <Link to="/asr">语音转文字</Link> | <Link to="/docs">文档</Link> | <Link to="/settings">设置</Link></nav></div>} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
