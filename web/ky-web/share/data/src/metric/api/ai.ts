import { getSessionId } from "comm/session";

/** ai/metric 请求。metric_id、unit_id 优先于名称。 */
export interface MetricAnalysisReq {
  metric_id?: number;
  metric_name?: string;
  lib_id?: number;
  exclude_lib_list?: number[];
  unit_id?: number;
  unit_name?: string;
  date_start?: string;
  date_end?: string;
  model_code?: string;
  question?: string;
}

/** 与 ai/chat 相同的 SSE event。 */
export type MetricSseEvent =
  "connected" | "route" | "thinking" | "message" | "done" | string;

export interface MetricStreamOptions {
  signal?: AbortSignal;
  /** 仅 message 事件的 content 增量 */
  onChunk: (text: string) => void;
  /** 透传全部 SSE 事件（connected / thinking / done 等） */
  onEvent?: (event: MetricSseEvent, data: Record<string, unknown>) => void;
}

interface SseFrame {
  event: string;
  data: string;
}

/** 按空行切分完整 SSE 帧，返回已完成帧与剩余半包 */
const takeCompleteFrames = (
  buffer: string,
): { frames: SseFrame[]; rest: string } => {
  const frames: SseFrame[] = [];
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";

  for (const block of parts) {
    if (!block.trim()) continue;

    let event = "message";
    const dataLines: string[] = [];

    for (const rawLine of block.split(/\r?\n/)) {
      if (!rawLine || rawLine.startsWith(":")) continue;
      if (rawLine.startsWith("event:")) {
        event = rawLine.slice(6).trim();
        continue;
      }
      if (rawLine.startsWith("data:")) {
        dataLines.push(rawLine.slice(5).trimStart());
      }
    }

    frames.push({ event, data: dataLines.join("\n") });
  }

  return { frames, rest };
};

const parseEventPayload = (data: string): Record<string, unknown> => {
  if (!data) return {};
  try {
    const json = JSON.parse(data) as unknown;
    if (json && typeof json === "object") {
      return json as Record<string, unknown>;
    }
  } catch {
    // 非 JSON 时按纯文本 content 处理
  }
  return { content: data };
};

const dispatchFrame = (
  frame: SseFrame,
  { onChunk, onEvent }: MetricStreamOptions,
): boolean => {
  const payload = parseEventPayload(frame.data);
  const event = frame.event as MetricSseEvent;
  onEvent?.(event, payload);

  if (event === "done") return true;

  if (event === "message") {
    const content = payload.content;
    if (typeof content === "string" && content) {
      onChunk(content);
    }
  }

  return false;
};

export const metricStream = async (
  params: MetricAnalysisReq,
  options: MetricStreamOptions,
): Promise<void> => {
  const sessionId = getSessionId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (sessionId) {
    headers["xmhis-session-id"] = sessionId;
  }

  const response = await fetch("/ai/metric", {
    method: "POST",
    headers,
    body: JSON.stringify(params),
    signal: options.signal,
  });

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // 保持默认错误文案
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("响应为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { frames, rest } = takeCompleteFrames(buffer);
    buffer = rest;

    for (const frame of frames) {
      if (dispatchFrame(frame, options)) return;
    }
  }

  buffer += decoder.decode();
  const { frames } = takeCompleteFrames(buffer + "\n\n");
  for (const frame of frames) {
    if (dispatchFrame(frame, options)) return;
  }
};
