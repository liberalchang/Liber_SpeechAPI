import { useState, useEffect } from 'react';
import { loadConfig, saveConfig } from '../lib/storage';
import { createApiClient } from '../lib/api';
import type { BackendConfig, HealthResponse } from '../lib/types';

export default function SettingsPage() {
  const [cfg, setCfg] = useState<BackendConfig>({ baseUrl: '', apiPrefix: '', token: '' });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = loadConfig();
    setCfg(current);
  }, []);

  async function testConnection() {
    setLoading(true);
    setError(null);
    try {
      const api = createApiClient(cfg);
      const result = await api.health();
      if ('error' in result) {
        setError(result.error);
        setHealth(null);
      } else {
        setHealth(result);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    saveConfig(cfg);
    alert('配置已保存');
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>后端配置</h2>
      <div style={{ marginBottom: 12 }}>
        <label>后端地址：</label>
        <input
          type="text"
          value={cfg.baseUrl}
          onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })}
          placeholder="http://localhost:5555"
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>API 前缀：</label>
        <input
          type="text"
          value={cfg.apiPrefix}
          onChange={(e) => setCfg({ ...cfg, apiPrefix: e.target.value })}
          placeholder="/api/v1"
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Token（可选）：</label>
        <input
          type="text"
          value={cfg.token}
          onChange={(e) => setCfg({ ...cfg, token: e.target.value })}
          placeholder="留空则不使用鉴权"
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>
      <button onClick={handleSave} style={{ marginRight: 12 }}>保存配置</button>
      <button onClick={testConnection} disabled={loading}>
        {loading ? '检测中...' : '测试连接'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 12 }}>错误：{error}</p>}
      {health && (
        <div style={{ marginTop: 12, background: '#f0f8ff', padding: 12, borderRadius: 4 }}>
          <p>状态：{health.status}</p>
          <p>版本：{health.version}</p>
          <p>ASR 就绪：{health.asr_ready ? '是' : '否'}</p>
          <p>TTS 就绪：{health.tts_ready ? '是' : '否'}</p>
        </div>
      )}
    </div>
  );
}
