import { useEffect, useRef, useState, type AnchorHTMLAttributes } from "react";
import { Alert, Button, Select, Spin } from "antd";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MetricRow } from "../../../types/metric.d.ts";
import { metricStream } from "../../../api/ai";
import { usePreview } from "../context";
import { metricAnalysisParams, metricName } from "../model";
import { useRead } from "../hooks/useRead";

const markdownPlugins = [remarkGfm];

const markdownComponents = {
  a: ({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

interface AnalysisResult {
  key: string;
  running: boolean;
  thinking: string;
  content: string;
  error?: string;
}

export default function AiAnalysisPanel({ metric }: { metric: MetricRow }) {
  const { detailQuery, libId, service } = usePreview();
  const models = useRead("ai-models", async (signal) => {
    const result = await service.dictionary(
      { dict_code: "ai.model", retrieve_input: "*", column_list: "*" },
      signal,
    );
    return (result.row_list ?? [])
      .map((row) => {
        const value = row.item_code?.trim() || row.item_value?.trim() || "";
        return { value, label: row.item_name?.trim() || value };
      })
      .filter((option) => option.value);
  });
  const [selectedModel, setSelectedModel] = useState<string>();
  const options = models.data ?? [];
  const modelCode = options.some((option) => option.value === selectedModel)
    ? selectedModel
    : options[0]?.value;
  const key = JSON.stringify([
    metric.metric_id,
    metric.metric_name,
    detailQuery.unitId,
    detailQuery.unitName,
    detailQuery.date,
    libId,
    modelCode,
  ]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const pending = useRef<AbortController | undefined>(undefined);
  const [result, setResult] = useState<AnalysisResult>();
  const analysis = result?.key === key ? result : undefined;
  const running = analysis?.running ?? false;

  useEffect(() => {
    setResult(undefined);
    return () => {
      pending.current?.abort();
      pending.current = undefined;
    };
  }, [key]);

  const run = async () => {
    if (!modelCode || models.loading || models.error || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const accepted = () =>
      !controller.signal.aborted &&
      currentKey.current === key &&
      pending.current === controller;
    const update = (
      change:
        | Partial<AnalysisResult>
        | ((previous: AnalysisResult) => Partial<AnalysisResult>),
    ) => {
      if (!accepted()) return;
      setResult((previous) =>
        previous?.key === key
          ? {
              ...previous,
              ...(typeof change === "function" ? change(previous) : change),
            }
          : previous,
      );
    };
    setResult({ key, running: true, thinking: "思考中…", content: "" });
    try {
      await metricStream(
        metricAnalysisParams(metric, detailQuery, libId, modelCode),
        {
          signal: controller.signal,
          onChunk: (chunk) => {
            update((previous) => ({ content: previous.content + chunk }));
          },
          onEvent: (event, data) => {
            if (event !== "thinking") return;
            const text =
              typeof data.message === "string"
                ? data.message
                : typeof data.content === "string"
                  ? data.content
                  : undefined;
            if (!text) return;
            update((previous) => ({
              thinking:
                previous.thinking && previous.thinking !== "思考中…"
                  ? `${previous.thinking}\n${text}`
                  : text,
            }));
          },
        },
      );
      update((previous) => ({
        running: false,
        content: previous.content || "（无回复）",
      }));
    } catch (error) {
      update({
        running: false,
        error: error instanceof Error ? error.message : "分析失败",
      });
    } finally {
      if (pending.current === controller) pending.current = undefined;
    }
  };

  if (models.loading || models.error || !modelCode) return null;

  return (
    <section className="mp-section mp-ai-analysis" aria-label="AI分析">
      <div className="mp-section-title">AI分析：{metricName(metric)}</div>
      <div className="mp-ai-actions">
        <Select
          aria-label="分析模型"
          size="small"
          value={modelCode}
          options={options}
          disabled={running}
          onChange={setSelectedModel}
        />
        <Button
          type="primary"
          size="small"
          loading={running}
          disabled={running}
          onClick={() => void run()}
        >
          {analysis ? "重新分析" : "AI分析"}
        </Button>
      </div>
      {analysis && (
        <div className="mp-ai-output" aria-live="polite">
          {analysis.error && (
            <Alert
              type="error"
              title={analysis.error}
              action={<Button onClick={() => void run()}>重试</Button>}
            />
          )}
          {analysis.thinking && (
            <div className="mp-ai-thinking">{analysis.thinking}</div>
          )}
          {analysis.content && (
            <div className="mp-ai-markdown">
              <Markdown
                remarkPlugins={markdownPlugins}
                components={markdownComponents}
              >
                {analysis.content}
              </Markdown>
            </div>
          )}
          {running && (
            <div className="mp-loading">
              <Spin />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
