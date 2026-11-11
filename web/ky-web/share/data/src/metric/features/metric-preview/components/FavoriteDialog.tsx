import { PreviewModal } from "../theme";
import { useEffect, useRef, useState } from "react";
import { Alert, Checkbox } from "antd";
import { addMetricFavorite } from "../../../api/metric";
import { usePreview } from "../context";
import { favoriteTags } from "../model";
import { errorText, useRead } from "../hooks/useRead";
import Feedback from "./Feedback";

export default function FavoriteDialog({
  metricId,
  close,
  saved,
}: {
  metricId: number;
  close: () => void;
  saved: (
    row: import("../../../types/metric.d.ts").MetricFavoriteRow,
  ) => Promise<void>;
}) {
  const { service, session, setBusy } = usePreview();
  const support = useRead(`today:${metricId}`, (signal) =>
    service.supportToday({ metric_id: metricId }, signal),
  );
  const property = useRead(`favorite-property:${metricId}`, (signal) =>
    service.property({ metric_id: metricId }, signal),
  );
  const [tags, setTags] = useState<string[]>([]),
    [writing, setWriting] = useState(false),
    [error, setError] = useState<string>();
  const lock = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      setBusy("favorite", false);
    };
  }, [setBusy]);
  useEffect(() => {
    if (support.data?.only_today) setTags(["TODAY"]);
  }, [support.data]);
  const save = async () => {
    if (lock.current || !support.data) return;
    lock.current = true;
    setWriting(true);
    setBusy("favorite", true);
    setError(undefined);
    try {
      const row = {
        user_id: session.userId,
        metric_id: metricId,
        favorite_tag: tags.map((tag) => `[${tag}]`).join(""),
      };
      const result = await addMetricFavorite(row);
      if (alive.current)
        await saved({
          ...property.data?.metric_property,
          ...row,
          favorite_id: result.favorite_id,
        });
    } catch (err) {
      if (alive.current) setError(errorText(err));
    } finally {
      lock.current = false;
      setBusy("favorite", false);
      if (alive.current) setWriting(false);
    }
  };
  return (
    <PreviewModal
      title="选择收藏标签"
      open
      onCancel={close}
      onOk={() => void save()}
      okText="确认收藏"
      cancelText="取消"
      confirmLoading={writing}
      closable={!writing}
      mask={{ closable: !writing }}
      keyboard={!writing}
      okButtonProps={{ disabled: !support.data || !!support.error }}
      cancelButtonProps={{ disabled: writing }}
      className="mp-modal"
      width={400}
    >
      <Feedback read={support} />
      {error && <Alert type="error" title={error} />}
      <p>请选择要添加的标签（可多选）：</p>
      <Checkbox.Group
        value={tags}
        onChange={(values) => setTags(values as string[])}
        options={favoriteTags.map(([label, value]) => ({
          label,
          value,
          disabled:
            writing ||
            (support.data?.only_today
              ? value !== "TODAY"
              : value === "TODAY" && !support.data?.support_today),
        }))}
      />
    </PreviewModal>
  );
}
