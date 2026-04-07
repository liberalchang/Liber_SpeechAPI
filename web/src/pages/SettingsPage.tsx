import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon, 
  WifiTethering as TestIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { loadConfig, saveConfig } from '../lib/storage';
import { createApiClient } from '../lib/api';
import type { BackendConfig, HealthResponse } from '../lib/types';

export default function SettingsPage() {
  const [cfg, setCfg] = useState<BackendConfig>({ baseUrl: '', apiPrefix: '', token: '' });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const current = loadConfig();
    setCfg(current);
  }, []);

  async function testConnection() {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const api = createApiClient(cfg);
      
      // 先检查健康状态
      const healthResult = await api.health();
      if ('error' in healthResult) {
        setError(healthResult.error);
        setHealth(null);
        return;
      }
      
      // 如果健康检查通过，调用预热接口
      console.log("前端: 开始预热模型...");
      const warmupResult = await api.warmup();
      if ('error' in warmupResult) {
        setError(warmupResult.error || '预热失败');
        setHealth(healthResult);
      } else {
        console.log("前端: 模型预热完成");
        // 预热完成后再次检查健康状态
        const finalHealthResult = await api.health();
        if ('error' in finalHealthResult) {
          setError(finalHealthResult.error);
          setHealth(null);
        } else {
          setHealth(finalHealthResult);
          setError(null);
          setSuccessMsg('连接成功，模型预热完成！');
        }
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
    setSuccessMsg('配置已保存');
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <SettingsIcon color="primary" fontSize="large" />
        系统设置
      </Typography>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
              后端 API 配置
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="后端地址"
                value={cfg.baseUrl}
                onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })}
                placeholder="http://localhost:5555"
                helperText="Liber Speech 后端服务的完整 URL"
              />
              
              <TextField
                fullWidth
                label="API 前缀"
                value={cfg.apiPrefix}
                onChange={(e) => setCfg({ ...cfg, apiPrefix: e.target.value })}
                placeholder="/api/v1"
                helperText="API 的路由前缀，通常为 /api/v1"
              />
              
              <TextField
                fullWidth
                label="认证 Token"
                type="password"
                value={cfg.token}
                onChange={(e) => setCfg({ ...cfg, token: e.target.value })}
                placeholder="留空则不使用鉴权"
                helperText="如果后端开启了 Token 鉴权，请在此输入"
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />} 
                onClick={handleSave}
                size="large"
                sx={{ flex: 1 }}
              >
                保存配置
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />} 
                onClick={testConnection}
                disabled={loading}
                size="large"
                sx={{ flex: 1 }}
              >
                {loading ? '检测中...' : '测试连接'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            
            {successMsg && (
              <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                {successMsg}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="服务状态" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}
            />
            <CardContent sx={{ p: 3 }}>
              {health ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">系统状态</Typography>
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label={health.status} 
                      color="success" 
                      variant="outlined" 
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">API 版本</Typography>
                    <Typography fontWeight="medium">{health.version}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">ASR 服务</Typography>
                    <Chip 
                      icon={health.asr_ready ? <CheckCircleIcon /> : <ErrorIcon />} 
                      label={health.asr_ready ? '就绪' : '未就绪'} 
                      color={health.asr_ready ? 'success' : 'error'} 
                      size="small"
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">TTS 服务</Typography>
                    <Chip 
                      icon={health.tts_ready ? <CheckCircleIcon /> : <ErrorIcon />} 
                      label={health.tts_ready ? '就绪' : '未就绪'} 
                      color={health.tts_ready ? 'success' : 'error'} 
                      size="small"
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <TestIcon sx={{ fontSize: 48, opacity: 0.2, mb: 2 }} />
                  <Typography>
                    尚未测试连接
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    点击左侧的"测试连接"按钮获取服务状态
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
