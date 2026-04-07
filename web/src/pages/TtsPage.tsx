import { useState } from 'react';
import { loadConfig } from '../lib/storage';
import { createApiClient } from '../lib/api';
import type { BackendConfig, TTSResponse } from '../lib/types';

export default function TtsPage() {
  const [cfg] = useState<BackendConfig>(loadConfig());
  const [text, setText] = useState('');
  const [model, setModel] = useState<'multilingual' | 'turbo' | 'standard'>('multilingual');
  const [language, setLanguage] = useState('');
  const [format, setFormat] = useState<'wav' | 'mp4' | 'ogg_opus'>('wav');
  const [audioPrompt, setAudioPrompt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TTSResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSynthesize() {
    if (!text.trim()) {
      setError('请输入要合成的文本');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const api = createApiClient(cfg);
      const resp = await api.synthesize(text, model, language || null, format, audioPrompt);
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

  const audioUrl = result ? cfg.baseUrl.replace(/\/$/, '') + result.audio_url : null;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>文字转语音 (TTS)</h2>
      <div style={{ marginBottom: 12 }}>
        <label>文本内容：</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>参考音频（音色克隆，可选）：</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioPrompt(e.target.files?.[0] || null)}
          style={{ marginTop: 4 }}
        />
        {audioPrompt && <p style={{ fontSize: '0.8em', color: '#666' }}>{audioPrompt.name}</p>}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>模型：</label>
        <select value={model} onChange={(e) => setModel(e.target.value as any)} style={{ marginLeft: 8 }}>
          <option value="multilingual">multilingual</option>
          <option value="turbo">turbo</option>
          <option value="standard">standard</option>
        </select>
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
        <label>输出格式：</label>
        <select value={format} onChange={(e) => setFormat(e.target.value as any)} style={{ marginLeft: 8 }}>
          <option value="wav">wav</option>
          <option value="mp4">mp4</option>
          <option value="ogg_opus">ogg_opus</option>
        </select>
      </div>
      <button onClick={handleSynthesize} disabled={loading}>
        {loading ? '合成中...' : '合成语音'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 12 }}>错误：{error}</p>}
      {result && audioUrl && (
        <div style={{ marginTop: 12, background: '#f0f8ff', padding: 12, borderRadius: 4 }}>
          <p>合成成功！</p>
          <audio controls src={audioUrl} style={{ width: '100%', marginTop: 8 }} />
          <p>
            <a href={audioUrl} download={`tts.${format}`} style={{ marginRight: 12 }}>
              下载
            </a>
          </p>
          <pre style={{ fontSize: '0.8em', color: '#666' }}>{JSON.stringify(result.meta, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
