import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Divider,
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import { 
  Description as DescriptionIcon,
  MenuBook as BookIcon,
  Api as ApiIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
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
  const theme = useTheme();
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <BookIcon color="primary" fontSize="large" />
        系统文档
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, height: { md: 'calc(100vh - 200px)' } }}>
        {/* 左侧导航 */}
        <Paper 
          sx={{ 
            width: { xs: '100%', md: 280 }, 
            flexShrink: 0, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon color="primary" />
              文档列表
            </Typography>
          </Box>
          
          <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
            {docs.map(doc => (
              <ListItem key={doc.key} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selected === doc.key}
                  onClick={() => setSelected(doc.key)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      }
                    }
                  }}
                >
                  <ListItemText 
                    primary={doc.title} 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontWeight: selected === doc.key ? 'bold' : 'normal'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />
          
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold" sx={{ mb: 1.5 }}>
              快捷入口
            </Typography>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<ApiIcon />} 
              endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              href={`${cfg.baseUrl}/docs`} 
              target="_blank"
              sx={{ mb: 1, justifyContent: 'flex-start' }}
            >
              Swagger UI
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<ApiIcon />} 
              endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              href={`${cfg.baseUrl}/redoc`} 
              target="_blank"
              sx={{ justifyContent: 'flex-start' }}
            >
              ReDoc
            </Button>
          </Box>
        </Paper>

        {/* 右侧内容 */}
        <Paper 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            p: { xs: 3, md: 5 },
            '& img': { maxWidth: '100%', borderRadius: 2 },
            '& pre': { 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
              overflowX: 'auto'
            },
            '& code': { 
              fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
              bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
              padding: '2px 6px',
              borderRadius: 1
            },
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              margin: 0,
              padding: '8px 16px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              borderRadius: '0 8px 8px 0'
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              mb: 3
            },
            '& th, & td': {
              border: `1px solid ${theme.palette.divider}`,
              padding: '8px 12px',
              textAlign: 'left'
            },
            '& th': {
              bgcolor: theme.palette.background.default,
              fontWeight: 'bold'
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: theme.palette.text.primary,
              marginTop: '1.5em',
              marginBottom: '0.5em',
              fontWeight: 600
            },
            '& h1': { borderBottom: `1px solid ${theme.palette.divider}`, paddingBottom: '0.3em' },
            '& h2': { borderBottom: `1px solid ${theme.palette.divider}`, paddingBottom: '0.3em' },
            '& a': { color: theme.palette.primary.main, textDecoration: 'none' },
            '& a:hover': { textDecoration: 'underline' }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
