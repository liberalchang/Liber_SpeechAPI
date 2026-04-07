import { useState } from 'react';
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Hearing as HearingIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { loadConfig } from '../lib/storage';
import { createApiClient } from '../lib/api';
import type { BackendConfig, ASRResponse } from '../lib/types';

export default function AsrPage() {
  const [cfg] = useState<BackendConfig>(loadConfig());
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('openai/whisper-large-v3');
  const [language, setLanguage] = useState('');
  const [task, setTask] = useState<'transcribe' | 'translate'>('transcribe');
  const [timestamps, setTimestamps] = useState<'chunk' | 'word'>('chunk');
  const [outputPath, setOutputPath] = useState('');
  
  // 高级设置参数
  const [device, setDevice] = useState('auto');
  const [batchSize, setBatchSize] = useState(24);
  const [flash, setFlash] = useState(false);
  const [hfToken, setHfToken] = useState('');
  const [diarizationModel, setDiarizationModel] = useState('pyannote/speaker-diarization-3.1');
  const [numSpeakers, setNumSpeakers] = useState<number | null>(null);
  const [minSpeakers, setMinSpeakers] = useState<number | null>(null);
  const [maxSpeakers, setMaxSpeakers] = useState<number | null>(null);
  
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '请求失败');
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <HearingIcon color="primary" />
        语音转文字 (ASR)
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* 左侧：输入和常规设置 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              音频输入
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ p: 2, borderStyle: 'dashed', mb: 2 }}
              >
                点击上传音频文件
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              {file && (
                <Chip 
                  label={file.name} 
                  color="primary" 
                  variant="outlined"
                  onDelete={() => setFile(null)}
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">或</Typography>
            </Divider>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="音频 URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                InputProps={{
                  startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              常规设置
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="模型名称"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="openai/whisper-large-v3"
                  margin="normal"
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="语言代码"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="例如 zh（留空为自动检测）"
                  margin="normal"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>任务类型</InputLabel>
                  <Select
                    value={task}
                    onChange={(e) => setTask(e.target.value as 'transcribe' | 'translate')}
                    label="任务类型"
                  >
                    <MenuItem value="transcribe">transcribe（转录）</MenuItem>
                    <MenuItem value="translate">translate（翻译）</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>时间戳级别</InputLabel>
                  <Select
                    value={timestamps}
                    onChange={(e) => setTimestamps(e.target.value as 'chunk' | 'word')}
                    label="时间戳级别"
                  >
                    <MenuItem value="chunk">chunk（分段）</MenuItem>
                    <MenuItem value="word">word（词级）</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="输出文件路径"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  placeholder="例如 output.json"
                  margin="normal"
                />
              </Box>
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
                    label="批次大小"
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 64, step: 1 }}
                    margin="normal"
                  />
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Flash Attention 2</InputLabel>
                    <Select
                      value={flash ? 'true' : 'false'}
                      onChange={(e) => setFlash(e.target.value === 'true')}
                      label="Flash Attention 2"
                    >
                      <MenuItem value="false">关闭</MenuItem>
                      <MenuItem value="true">开启</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="HF访问令牌"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    placeholder="可选"
                    type="password"
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="说话人分割模型"
                    value={diarizationModel}
                    onChange={(e) => setDiarizationModel(e.target.value)}
                    margin="normal"
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <TextField
                        fullWidth
                        label="说话人数量"
                        type="number"
                        value={numSpeakers || ''}
                        onChange={(e) => setNumSpeakers(e.target.value ? parseInt(e.target.value) : null)}
                        inputProps={{ min: 1 }}
                        margin="normal"
                      />
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <TextField
                        fullWidth
                        label="最小说话人数量"
                        type="number"
                        value={minSpeakers || ''}
                        onChange={(e) => setMinSpeakers(e.target.value ? parseInt(e.target.value) : null)}
                        inputProps={{ min: 1 }}
                        margin="normal"
                      />
                    </Box>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="最大说话人数量"
                    type="number"
                    value={maxSpeakers || ''}
                    onChange={(e) => setMaxSpeakers(e.target.value ? parseInt(e.target.value) : null)}
                    inputProps={{ min: 1 }}
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
          onClick={handleTranscribe}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <HearingIcon />}
          sx={{ minWidth: 200 }}
        >
          {loading ? '转录中...' : '开始转录'}
        </Button>
      </Box>

      {/* 错误信息 */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {/* 结果显示 */}
      {result && (
        <Paper sx={{ mt: 3, p: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom color="success.contrastText">
            转录成功！
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={downloadTxt}
            >
              下载 TXT
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={downloadJson}
            >
              下载 JSON
            </Button>
          </Box>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">转录文本</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography 
                  component="pre" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '1rem',
                    lineHeight: 1.6
                  }}
                >
                  {result.text}
                </Typography>
              </Paper>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">分段详情</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>开始 (s)</TableCell>
                      <TableCell>结束 (s)</TableCell>
                      <TableCell>文本</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.chunks.map((chunk, index) => (
                      <TableRow key={index}>
                        <TableCell>{chunk.start.toFixed(2)}</TableCell>
                        <TableCell>{chunk.end.toFixed(2)}</TableCell>
                        <TableCell>{chunk.text}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </Box>
  );
}
