import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadConfig } from '../lib/storage';

// Vite glob: load all .md files from docs/ as raw strings
const modules = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

interface DocMeta {
  key: string;
  title: string;
}

const docTitles: Record<string, string> = {
  '../docs/API.md': 'API 接口文档',
  '../docs/Windows使用指南.md': 'Windows 使用指南',
  '../docs/CLI测试使用文档.md': 'CLI 测试使用文档',
  '../docs/参数管理系统说明.md': '参数管理系统说明',
  '../docs/chatterbox-参数说明文档.md': 'Chatterbox 参数说明',
  '../docs/insanely-fast-whisper-参数说明文档.md': 'Insanely Fast Whisper 参数说明',
  '../docs/实现记录.md': '实现记录',
  '../docs/开发计划.md': '开发计划',
  '../docs/配置系统修复总结.md': '配置系统修复总结',
  '../docs/TTS修复总结.md': 'TTS 修复总结',
  '../docs/Web前端界面规划.md': 'Web 前端界面规划',
};

export default function DocsPage() {
  const [cfg] = useState(() => loadConfig());
  const [selected, setSelected] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const docs: DocMeta[] = Object.keys(modules).map(key => ({
    key,
    title: docTitles[key] || key.replace('../docs/', '').replace('.md', ''),
  }));

  async function loadDoc(path: string) {
    setLoading(true);
    try {
      const mod = modules[path];
      if (mod) {
        const txt = await mod();
        setContent(txt);
      }
    } catch (e) {
      setContent('加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (docs.length > 0 && !selected) {
      setSelected(docs[0].key);
      loadDoc(docs[0].key);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      loadDoc(selected);
    }
  }, [selected]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      <aside style={{ width: 260, padding: '1rem', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
        <h3>文档列表</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {docs.map(doc => (
            <li key={doc.key} style={{ marginBottom: 4 }}>
              <button
                onClick={() => setSelected(doc.key)}
                style={{
                  background: selected === doc.key ? '#e0f0ff' : 'transparent',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  padding: '6px 8px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {doc.title}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #ccc' }}>
          <h4>快捷入口</h4>
          <a href={`${cfg.baseUrl}/docs`} target="_blank" style={{ display: 'block', marginBottom: 4 }}>Swagger UI</a>
          <a href={`${cfg.baseUrl}/redoc`} target="_blank" style={{ display: 'block' }}>ReDoc</a>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {loading ? (
          <p>加载中...</p>
        ) : (
          <div style={{ maxWidth: 800 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
}
