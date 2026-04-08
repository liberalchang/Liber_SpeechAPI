import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  RecordVoiceOver as VoiceIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  AudioFile as AudioFileIcon
} from '@mui/icons-material';
import { loadConfig } from '../lib/storage';
import { createApiClient } from '../lib/api';
import type { BackendConfig, TTSResponse, DefaultParams } from '../lib/types';

export default function TtsPage() {
  const [cfg] = useState<BackendConfig>(loadConfig());
  const [text, setText] = useState('');
  const [model, setModel] = useState<'multilingual' | 'turbo' | 'standard'>('multilingual');
  const [language, setLanguage] = useState('');
  const [format, setFormat] = useState<'wav' | 'mp4' | 'ogg_opus'>('wav');
  const [audioPrompt, setAudioPrompt] = useState<File | null>(null);
  
  // 高级设置参数
  const [device, setDevice] = useState('auto');
  const [repetitionPenalty, setRepetitionPenalty] = useState(1.2);
  const [temperature, setTemperature] = useState(0.8);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(1000);
  const [exaggeration, setExaggeration] = useState(0.0);
  const [cfgWeight, setCfgWeight] = useState(0.0);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TTSResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 页面加载时获取后端默认参数
  useEffect(() => {
    const loadDefaultParams = async () => {
      try {
        const api = createApiClient(cfg);
        const response = await api.getDefaultParams();
        if ('error' in response) {
          console.error('获取默认参数失败:', response.error);
          return;
        }
        
        const defaultParams = response as DefaultParams;
        const ttsDefaults = defaultParams.tts;
        
        // 更新表单默认值
        if (ttsDefaults.model) setModel(ttsDefaults.model as 'multilingual' | 'turbo' | 'standard');
        if (ttsDefaults.language) setLanguage(ttsDefaults.language);
        if (ttsDefaults.format) setFormat(ttsDefaults.format as 'wav' | 'mp4' | 'ogg_opus');
        if (ttsDefaults.device) setDevice(ttsDefaults.device);
        if (ttsDefaults.repetition_penalty) setRepetitionPenalty(ttsDefaults.repetition_penalty);
        if (ttsDefaults.temperature) setTemperature(ttsDefaults.temperature);
        if (ttsDefaults.top_p) setTopP(ttsDefaults.top_p);
        if (ttsDefaults.top_k) setTopK(ttsDefaults.top_k);
        if (ttsDefaults.exaggeration) setExaggeration(ttsDefaults.exaggeration);
        if (ttsDefaults.cfg_weight) setCfgWeight(ttsDefaults.cfg_weight);
        
        console.log('已从后端加载TTS默认参数:', defaultParams);
      } catch (error) {
        console.error('加载默认参数时出错:', error);
      }
    };

    loadDefaultParams();
  }, [cfg]);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
    }
  }

  const audioUrl = result ? cfg.baseUrl.replace(/\/$/, '') + result.audio_url : null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <VoiceIcon color="primary" />
        文字转语音 (TTS)
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* 左侧：输入和常规设置 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              文本输入
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="请输入要合成的文本"
              value={text}
              onChange={(e) => setText(e.target.value)}
              variant="outlined"
              margin="normal"
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              常规设置
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>模型</InputLabel>
                  <Select
                    value={model}
                    onChange={(e) => setModel(e.target.value as 'multilingual' | 'turbo' | 'standard')}
                    label="模型"
                  >
                    <MenuItem value="multilingual">multilingual</MenuItem>
                    <MenuItem value="turbo">turbo</MenuItem>
                    <MenuItem value="standard">standard</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="语言代码"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="例如 zh"
                  margin="normal"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="语速 (CFG权重)"
                  type="number"
                  value={cfgWeight}
                  onChange={(e) => setCfgWeight(parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                  margin="normal"
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>输出格式</InputLabel>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as 'wav' | 'mp4' | 'ogg_opus')}
                    label="输出格式"
                  >
                    <MenuItem value="wav">wav</MenuItem>
                    <MenuItem value="mp4">mp4</MenuItem>
                    <MenuItem value="ogg_opus">ogg_opus</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AudioFileIcon />}
                sx={{ mr: 2 }}
              >
                选择参考音频（音色克隆）
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => setAudioPrompt(e.target.files?.[0] || null)}
                />
              </Button>
              {audioPrompt && (
                <Chip 
                  label={audioPrompt.name} 
                  color="primary" 
                  variant="outlined"
                  onDelete={() => setAudioPrompt(null)}
                />
              )}
            </Box>
          </Paper>
        </Box>

        {/* 右侧：高级设置 */}
        <Box sx={{ width: { xs: '100%', md: '350px' } }}>
          <Paper sx={{ p: 3 }}>
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  高级设置
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>推理设备</InputLabel>
                    <Select
                      value={device}
                      onChange={(e) => setDevice(e.target.value)}
                      label="推理设备"
                    >
                      <MenuItem value="auto">auto</MenuItem>
                      <MenuItem value="cpu">cpu</MenuItem>
                      <MenuItem value="cuda">cuda</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="重复惩罚系数"
                    type="number"
                    value={repetitionPenalty}
                    onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
                    inputProps={{ min: 0.5, max: 2, step: 0.1 }}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="采样温度"
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    inputProps={{ min: 0.1, max: 2, step: 0.1 }}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="核采样概率阈值"
                    type="number"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    inputProps={{ min: 0.1, max: 1, step: 0.05 }}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="最高K个候选token"
                    type="number"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 2000, step: 50 }}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="夸张度系数"
                    type="number"
                    value={exaggeration}
                    onChange={(e) => setExaggeration(parseFloat(e.target.value))}
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    margin="normal"
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>
      </Box>

      {/* 执行按钮 */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSynthesize}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <VoiceIcon />}
          sx={{ minWidth: 200 }}
        >
          {loading ? '合成中...' : '合成语音'}
        </Button>
      </Box>

      {/* 错误信息 */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {/* 结果显示 */}
      {result && audioUrl && (
        <Paper sx={{ mt: 3, p: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom color="success.contrastText">
            合成成功！
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <audio controls src={audioUrl} style={{ flex: 1 }} />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              href={audioUrl}
              download={`tts.${format}`}
            >
              下载
            </Button>
          </Box>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>详细信息</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre style={{ fontSize: '0.8em', overflow: 'auto' }}>
                {JSON.stringify(result.meta, null, 2)}
              </pre>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </Box>
  );
}
