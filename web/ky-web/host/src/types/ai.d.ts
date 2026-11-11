export interface ChatReq {
  model_code?: string;
  agent_type?: string;
  question: string;
  debug_api_detail?: boolean;
  active_patient_id?: string;
  active_visit_id?: string;
  active_baby_id?: string;
  active_emr_id?: string;
  active_ops_id?: string;
  active_anes_id?: string;
  active_lib_id?: string;
}

/** 后端 SSE event 类型 */
export type ChatSseEvent =
  | "connected"
  | "route"
  | "thinking"
  | "message"
  | "done"
  | string;

export interface ChatStreamOptions {
  signal?: AbortSignal;
  /** 仅 message 事件的 content 增量 */
  onChunk: (text: string) => void;
  /** 可选：透传全部 SSE 事件（connected / thinking / done 等） */
  onEvent?: (event: ChatSseEvent, data: Record<string, unknown>) => void;
}
