import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { App, Button, Drawer, Input, Select, Space, theme } from "antd";
import type { InputRef } from "antd";
import { AudioOutlined, SendOutlined, StopOutlined } from "@ant-design/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { appThemeVars } from "comm/theme";
import { getSessionId } from "comm/session";
import { chatStream } from "@/api/ai";
import { getSessionInfo } from "@/api/auth";
import { getLibList } from "@/api/metric";
import { retrieveDict2ItemList } from "@/api/sys";
import { recognizeSpeech } from "@/api/speech";
import type { LibRow } from "@/types/metric";
import type { Dict2ItemRow } from "@/types/sys";
import { AudioRecorder } from "@/utils/audioRecorder";
import "./index.scss";

interface AiChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  /** 思考 / 连接过程文案，回复生成后仍保留展示 */
  thinking?: string;
}

const ACTIVE_ID_KEYS = [
  "active_patient_id",
  "active_visit_id",
  "active_baby_id",
  "active_emr_id",
  "active_ops_id",
  "active_anes_id",
] as const;

/** 读取当前非空的活动 id，避免依赖线上未部署的 comm/session 新导出 */
const getActiveIds = (): Partial<
  Record<(typeof ACTIVE_ID_KEYS)[number], string>
> => {
  const ids: Partial<Record<(typeof ACTIVE_ID_KEYS)[number], string>> = {};
  for (const key of ACTIVE_ID_KEYS) {
    const value = sessionStorage.getItem(key);
    if (value) ids[key] = value;
  }
  return ids;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  role: "assistant",
  content: "你好，我是AI助手，有什么可以帮你的吗？",
};

const MODEL_DICT_NAME = "ai.model";
const AGENT_DICT_NAME = "ai.agent";
const METRIC_AGENT_TYPE = "metric";

type DictOption = { value: string; label: string };

const ALL_OPTION: DictOption = { value: "", label: "全部" };

const markdownPlugins = [remarkGfm];

const markdownComponents = {
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

const AssistantMarkdown: React.FC<{ content: string }> = ({ content }) => (
  <div className="ai-chat-drawer__markdown">
    <Markdown remarkPlugins={markdownPlugins} components={markdownComponents}>
      {content}
    </Markdown>
  </div>
);

const ChatBubble = React.memo(
  ({ chatMessage }: { chatMessage: ChatMessage }) => {
    const pending = chatMessage.role === "assistant" && !chatMessage.content;
    return (
      <div
        className={`ai-chat-drawer__row ai-chat-drawer__row--${chatMessage.role}`}
      >
        <div
          className={`ai-chat-drawer__bubble ai-chat-drawer__bubble--${chatMessage.role}${
            pending ? " ai-chat-drawer__bubble--pending" : ""
          }`}
        >
          {chatMessage.role === "assistant" && chatMessage.thinking ? (
            <div className="ai-chat-drawer__thinking">
              {chatMessage.thinking}
            </div>
          ) : null}
          {chatMessage.role === "assistant" ? (
            chatMessage.content ? (
              <AssistantMarkdown content={chatMessage.content} />
            ) : !chatMessage.thinking ? (
              "思考中…"
            ) : null
          ) : (
            chatMessage.content
          )}
        </div>
      </div>
    );
  },
);
ChatBubble.displayName = "ChatBubble";

const dictRowsToOptions = (rows: Dict2ItemRow[]): DictOption[] =>
  rows
    .map((row) => ({
      value: row.item_code?.trim() || row.item_value?.trim() || "",
      label: row.item_name?.trim() || "",
    }))
    .filter((item) => item.value && item.label);

const libRowsToOptions = (rows: LibRow[]): DictOption[] =>
  rows
    .map((row) => ({
      value: row.lib_id != null ? String(row.lib_id) : "",
      label: row.lib_name?.trim() || "",
    }))
    .filter((item) => item.value && item.label);

const keepSelectedValue = (options: DictOption[], current?: string) =>
  options.some((item) => item.value === current) ? current : undefined;

const AiChat: React.FC<AiChatDrawerProps> = ({ open, onClose }) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [modelOptions, setModelOptions] = useState<DictOption[]>([]);
  const [agentOptions, setAgentOptions] = useState<DictOption[]>([]);
  const [modelCode, setModelCode] = useState<string>();
  const [agentType, setAgentType] = useState("");
  const [libOptions, setLibOptions] = useState<DictOption[]>([]);
  const [libId, setLibId] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [libLoading, setLibLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);
  const nextIdRef = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const themeVars = useMemo(() => appThemeVars(token), [token]);
  const agentSelectOptions = useMemo(
    () => [ALL_OPTION, ...agentOptions],
    [agentOptions],
  );
  const libSelectOptions = useMemo(
    () => [ALL_OPTION, ...libOptions],
    [libOptions],
  );
  const showLibSelect = agentType === METRIC_AGENT_TYPE;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, scrollToBottom]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ cursor: "end" });
    });
  }, []);

  const handleAfterOpenChange = useCallback(
    (visible: boolean) => {
      if (visible) focusInput();
    },
    [focusInput],
  );

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      recorderRef.current?.cancel();
      recorderRef.current = null;
      setIsRecording(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    nextIdRef.current = 1;
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setSending(false);
    setIsRecording(false);
    setIsRecognizing(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setDictLoading(true);

    const loadDictOptions = async (dictName: string) => {
      const res = await retrieveDict2ItemList({ dict_code: dictName });
      return dictRowsToOptions(res.row_list ?? []);
    };

    Promise.allSettled([
      loadDictOptions(MODEL_DICT_NAME),
      loadDictOptions(AGENT_DICT_NAME),
    ])
      .then(([modelResult, agentResult]) => {
        if (cancelled) return;
        const models =
          modelResult.status === "fulfilled" ? modelResult.value : [];
        const agents =
          agentResult.status === "fulfilled" ? agentResult.value : [];
        setModelOptions(models);
        setAgentOptions(agents);
        setModelCode(
          (prev) => keepSelectedValue(models, prev) ?? models[0]?.value,
        );
        setAgentType(
          (prev) => keepSelectedValue([ALL_OPTION, ...agents], prev) ?? "",
        );
      })
      .finally(() => {
        if (!cancelled) setDictLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !showLibSelect) {
      setLibLoading(false);
      return;
    }

    let cancelled = false;
    setLibLoading(true);

    const loadLibOptions = async () => {
      const sessionId = getSessionId();
      if (!sessionId) {
        setLibOptions([]);
        setLibId("");
        return;
      }

      const sessionRes = await getSessionInfo({ session_id: sessionId });
      if (cancelled) return;

      const orgId =
        sessionRes.session_info?.org_id ?? sessionRes.access_info?.org_id;
      if (orgId == null) {
        setLibOptions([]);
        setLibId("");
        return;
      }

      const res = await getLibList({ org_id: orgId });
      if (cancelled) return;

      const libs = libRowsToOptions(res.row_list ?? []);
      setLibOptions(libs);
      setLibId((prev) => keepSelectedValue([ALL_OPTION, ...libs], prev) ?? "");
    };

    loadLibOptions()
      .catch(() => {
        if (cancelled) return;
        setLibOptions([]);
        setLibId("");
      })
      .finally(() => {
        if (!cancelled) setLibLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, showLibSelect]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      recorderRef.current?.cancel();
    };
  }, []);

  const handleToggleRecord = useCallback(async () => {
    if (isRecognizing || sending) return;

    if (!isRecording) {
      try {
        const recorder = new AudioRecorder();
        await recorder.start();
        recorderRef.current = recorder;
        setIsRecording(true);
        message.info("开始录音，再次点击结束");
      } catch {
        recorderRef.current?.cancel();
        recorderRef.current = null;
        message.error("无法启动录音，请检查麦克风权限");
      }
      return;
    }

    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsRecording(false);
    if (!recorder) return;

    setIsRecognizing(true);
    const hide = message.loading("语音识别中…", 0);
    try {
      const text = await recognizeSpeech(await recorder.stop());
      if (text) {
        setInput((current) => current + text);
        message.success("识别成功");
        inputRef.current?.focus();
      } else {
        message.warning("未识别到内容");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "语音识别失败";
      message.error(errorMessage);
    } finally {
      hide();
      setIsRecognizing(false);
    }
  }, [isRecording, isRecognizing, sending, message]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = {
      id: nextIdRef.current++,
      role: "user",
      content: text,
    };
    const assistantId = nextIdRef.current++;
    const replyMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinking: "思考中…",
    };

    setMessages((prev) => [...prev, userMessage, replyMessage]);
    setInput("");
    setSending(true);

    try {
      await chatStream(
        {
          question: text,
          ...(modelCode ? { model_code: modelCode } : {}),
          ...(agentType ? { agent_type: agentType } : {}),
          ...(showLibSelect && libId ? { active_lib_id: libId } : {}),
          ...getActiveIds(),
        },
        {
          signal: controller.signal,
          onChunk: (chunk) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId
                  ? { ...item, content: item.content + chunk }
                  : item,
              ),
            );
          },
          onEvent: (event, data) => {
            if (event !== "thinking") return;
            const thinkingText =
              typeof data.message === "string"
                ? data.message
                : typeof data.content === "string"
                  ? data.content
                  : undefined;
            if (!thinkingText) return;
            setMessages((prev) =>
              prev.map((item) => {
                if (item.id !== assistantId) return item;
                const next =
                  item.thinking && item.thinking !== "思考中…"
                    ? `${item.thinking}\n${thinkingText}`
                    : thinkingText;
                return { ...item, thinking: next };
              }),
            );
          },
        },
      );

      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId && !item.content
            ? { ...item, content: "（无回复）" }
            : item,
        ),
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : "请求失败";
      message.error(msg);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? { ...item, content: item.content || msg }
            : item,
        ),
      );
    } finally {
      if (abortRef.current === controller) {
        setSending(false);
      }
    }
  }, [input, sending, modelCode, agentType, showLibSelect, libId, message]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Drawer
      title="AI 助手"
      placement="right"
      width={620}
      open={open}
      onClose={onClose}
      afterOpenChange={handleAfterOpenChange}
      styles={{ body: { padding: 0 } }}
    >
      <div className="ai-chat-drawer" style={themeVars}>
        <div className="ai-chat-drawer__list" ref={listRef}>
          {messages.map((chatMessage) => (
            <ChatBubble key={chatMessage.id} chatMessage={chatMessage} />
          ))}
        </div>

        <div className="ai-chat-drawer__toolbar">
          <Space size={8}>
            <Select
              size="small"
              allowClear
              placeholder="模型"
              value={modelCode}
              onChange={setModelCode}
              options={modelOptions}
              optionLabelProp="label"
              labelRender={(item) => item.label}
              loading={dictLoading}
              popupMatchSelectWidth={false}
              style={{ minWidth: 140 }}
            />
            <Select
              size="small"
              placeholder="Agent"
              value={agentType}
              onChange={setAgentType}
              options={agentSelectOptions}
              optionLabelProp="label"
              labelRender={(item) => item.label}
              loading={dictLoading}
              popupMatchSelectWidth={false}
              style={{ minWidth: 100 }}
            />
            {showLibSelect ? (
              <Select
                size="small"
                placeholder="指标库"
                value={libId}
                onChange={setLibId}
                options={libSelectOptions}
                optionLabelProp="label"
                labelRender={(item) => item.label}
                loading={libLoading}
                popupMatchSelectWidth={false}
                style={{ minWidth: 120 }}
              />
            ) : null}
          </Space>
        </div>

        <div className="ai-chat-drawer__composer">
          <Input.TextArea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            autoSize={{ minRows: 1, maxRows: 4 }}
            variant="borderless"
            disabled={sending}
          />
          <Button
            type={isRecording ? "primary" : "default"}
            danger={isRecording}
            icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
            disabled={(sending || isRecognizing) && !isRecording}
            loading={isRecognizing}
            onClick={handleToggleRecord}
            title={isRecording ? "停止录音" : "语音输入"}
            aria-label={isRecording ? "停止录音" : "语音输入"}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            disabled={!input.trim() || sending || isRecording || isRecognizing}
            loading={sending}
            onClick={handleSend}
          >
            发送
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default AiChat;
