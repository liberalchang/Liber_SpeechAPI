// Types for Liber Speech API
export interface BackendConfig {
  baseUrl: string;
  apiPrefix: string;
  token: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  asr_ready: boolean;
  tts_ready: boolean;
}

export interface ASRResponse {
  text: string;
  chunks: Array<{
    start: number;
    end: number;
    text: string;
    speaker: string | null;
  }>;
  meta: Record<string, any>;
}

export interface TTSResponse {
  audio_url: string;
  meta: {
    format: string;
    sample_rate: number;
  };
}

export interface ErrorResponse {
  error: string;
  code: number;
}
