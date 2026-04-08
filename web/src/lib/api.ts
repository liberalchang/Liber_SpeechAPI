import type { BackendConfig, HealthResponse, ASRResponse, TTSResponse, ErrorResponse, DefaultParams } from "./types";

export class ApiClient {
  private cfg: BackendConfig;

  constructor(config: BackendConfig) {
    this.cfg = config;
  }

  private get urlBase() {
    return this.cfg.baseUrl.replace(/\/$/, "");
  }

  private get apiPrefix() {
    return this.cfg.apiPrefix ? this.cfg.apiPrefix.replace(/^\/+|\/+$/g, "") : "";
  }

  private getFullUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.replace(/^\/+/, "");
    if (this.apiPrefix) {
      return `${this.urlBase}/${this.apiPrefix}/${normalizedEndpoint}`;
    }
    return `${this.urlBase}/${normalizedEndpoint}`;
  }

  private headers(isFormData = false): HeadersInit {
    const headers: HeadersInit = {};
    // 对于 FormData，让浏览器自动设置 Content-Type
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (this.cfg.token) {
      headers["Authorization"] = `Bearer ${this.cfg.token}`;
    }
    return headers;
  }

  async health(): Promise<HealthResponse | ErrorResponse> {
    console.log("前端: 发送健康检查请求");
    const res = await fetch(this.getFullUrl("/health"), {
      headers: this.headers(false),
    });
    const result = await res.json();
    console.log("前端: 健康检查响应", result);
    return result;
  }

  async warmup(): Promise<{ status: string } | ErrorResponse> {
    console.log("前端: 发送预热请求");
    const res = await fetch(this.getFullUrl("/warmup"), {
      method: "POST",
      headers: this.headers(false),
    });
    const result = await res.json();
    console.log("前端: 预热响应", result);
    return result;
  }

  async getDefaultParams(): Promise<DefaultParams | ErrorResponse> {
    console.log("前端: 发送获取默认参数请求");
    const res = await fetch(this.getFullUrl("/default-params"), {
      headers: this.headers(false),
    });
    const result = await res.json();
    console.log("前端: 默认参数响应", result);
    return result;
  }

  async transcribe(
    file: File | null,
    url: string | null,
    language: string | null,
    task: string,
    timestamps: string
  ): Promise<ASRResponse | ErrorResponse> {
    console.log("前端: 发送 ASR 转录请求", { file: file?.name, url, language, task, timestamps });
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }
    if (url) {
      formData.append("url", url);
    }
    if (language) {
      formData.append("language", language);
    }
    formData.append("task", task);
    formData.append("timestamps", timestamps);

    const res = await fetch(this.getFullUrl("/asr/transcribe"), {
      method: "POST",
      body: formData,
      headers: this.headers(true),
    });
    const result = await res.json();
    console.log("前端: ASR 转录响应", result);
    return result;
  }

  async synthesize(
    text: string,
    model: string,
    language: string | null,
    format: string,
    audioPrompt: File | null
  ): Promise<TTSResponse | ErrorResponse> {
    console.log("前端: 发送 TTS 合成请求", { text: text.substring(0, 50) + "...", model, language, format, audioPrompt: audioPrompt?.name });
    const formData = new FormData();
    formData.append("text", text);
    formData.append("model", model);
    if (language) formData.append("language", language);
    formData.append("format", format);
    if (audioPrompt) formData.append("audio_prompt", audioPrompt);

    const response = await fetch(this.getFullUrl("/tts/synthesize"), {
      method: "POST",
      body: formData,
      headers: this.headers(true),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log("前端: TTS 合成失败", error);
      return { error: error || "请求失败" } as ErrorResponse;
    }

    const result = await response.json() as Promise<TTSResponse>;
    console.log("前端: TTS 合成响应", result);
    return result;
  }

  async asr(audioFile: File, options: {
    language?: string;
    model?: string;
  } = {}): Promise<ASRResponse | ErrorResponse> {
    const formData = new FormData();
    formData.append("audio", audioFile);
    if (options.language) formData.append("language", options.language);
    if (options.model) formData.append("model", options.model);

    const res = await fetch(this.getFullUrl("/asr"), {
      method: "POST",
      body: formData,
      headers: this.headers(true),
    });
    return res.json();
  }

  async tts(text: string, options: {
    voice?: string;
    speed?: number;
    format?: string;
  } = {}): Promise<TTSResponse | ErrorResponse> {
    const res = await fetch(this.getFullUrl("/tts"), {
      method: "POST",
      headers: this.headers(false),
      body: JSON.stringify({
        text,
        ...options,
      }),
    });
    return res.json();
  }
}

export function createApiClient(config: BackendConfig): ApiClient {
  return new ApiClient(config);
}
