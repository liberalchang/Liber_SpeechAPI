import { useState } from 'react';
import { loadConfig } from '../lib/storage';
import { createApiClient } from '../lib/api';
import type { BackendConfig, ASRResponse } from '../lib/types';

export default function AsrPage() {
  const [cfg] = useState<BackendConfig>(loadConfig());
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('');
  const [task, setTask] = useState<'transcribe' | 'translate'>('transcribe');
  const [timestamps, setTimestamps] = useState<'chunk' | 'word'>('chunk');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ASRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTranscribe() {
    if (!file && !url.trim()) {
      setError('请上传音频文件或提供音频 URL');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const api = createApiClient(cfg);
      const resp = await api.transcribe(file, url || null, language || null, task, timestamps);
      if ('error' in resp) {
        setError(resp.error);
      } else {
        setResult(resp);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    if (!result) return;
    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'asr.txt';
    a.click();
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'asr.json';
    a.click();
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>语音转文字 (ASR)</h2>
      <div style={{ marginBottom: 12 }}>
        <label>上传音频文件：</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginLeft: 8 }}
        />
        {file && <p style={{ fontSize: '0.8em', color: '#666' }}>{file.name}</p>}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>或音频 URL：</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/audio.mp3"
          style={{ marginLeft: 8, width: 300 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>语言（可选）：</label>
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="例如 zh"
          style={{ marginLeft: 8 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>任务：</label>
        <select value={task} onChange={(e) => setTask(e.target.value as any)} style={{ marginLeft: 8 }}>
          <option value="transcribe">transcribe（转录）</option>
          <option value="translate">translate（翻译）</option>
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>时间戳级别：</label>
        <select value={timestamps} onChange={(e) => setTimestamps(e.target.value as any)} style={{ marginLeft: 8 }}>
          <option value="chunk">chunk（分段）</option>
          <option value="word">word（词级）</option>
        </select>
      </div>
      <button onClick={handleTranscribe} disabled={loading}>
        {loading ? '转录中...' : '开始转录'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 12 }}>错误：{error}</p>}
      {result && (
        <div style={{ marginTop: 12, background: '#f0f8ff', padding: 12, borderRadius: 4 }}>
          <p>转录成功！</p>
          <div style={{ marginTop: 8 }}>
            <button onClick={downloadTxt} style={{ marginRight: 8 }}>下载 TXT</button>
            <button onClick={downloadJson}>下载 JSON</button>
          </div>
          <h4 style={{ marginTop: 12 }}>转录文本：</h4>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, borderRadius: 4 }}>
            {result.text}
          </pre>
          <h4>分段详情：</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ padding: 6, border: '1px solid #ccc' }}>开始 (s)</th>
                <th style={{ padding: 6, border: '1px solid #ccc' }}>结束 (s)</th>
                <th style={{ padding: 6, border: '1px solid #ccc' }}>文本</th>
              </tr>
            </thead>
            <tbody>
              {result.chunks.map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: 6, border: '1px solid #ccc' }}>{c.start.toFixed(2)}</td>
                  <td style={{ padding: 6, border: '1px solid #ccc' }}>{c.end.toFixed(2)}</td>
                  <td style={{ padding: 6, border: '1px solid #ccc' }}>{c.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
