import { useEffect, useState } from "react";
import { Checkbox, Modal, message } from "antd";
import dayjs from "dayjs";
import { newProblemAssess } from "@/api/clinic";
import { newCareProblemAssess } from "@/api/careProblem";

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";
const CLOSE_TAG = "[CLOSE]";

export type ProblemAssessSource = "DOCTOR" | "NURSE";

export interface ProblemAssessModalProps {
  open: boolean;
  source: ProblemAssessSource;
  problem_id: number;
  assess_score: number;
  assess_total?: number;
  assess_result?: string;
  assess_color?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ProblemAssessModal({
  open,
  source,
  problem_id,
  assess_score,
  assess_total,
  assess_result,
  assess_color,
  onSaved,
  onCancel,
}: ProblemAssessModalProps) {
  const [saving, setSaving] = useState(false);
  const [closeProblem, setCloseProblem] = useState(false);
  const color = assess_color || "#1677ff";

  useEffect(() => {
    if (open) setCloseProblem(false);
  }, [open]);

  const handleOk = async () => {
    setSaving(true);
    try {
      const assess_tag = closeProblem ? CLOSE_TAG : "";
      const assess_time = dayjs().format(DATETIME_FORMAT);
      const assess_desc = assess_result ?? "";
      const res =
        source === "DOCTOR"
          ? await newProblemAssess({
              problem_id,
              assess_time,
              assess_value: String(assess_score),
              assess_desc,
              assess_tag,
            })
          : await newCareProblemAssess({
              problem_id,
              assess_time,
              assess_value: assess_score,
              assess_desc,
              assess_tag,
            });
      if (res.code !== 0) {
        message.error(res.message || "保存评估失败");
        return;
      }
      message.success("保存评估成功");
      onSaved();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "保存评估失败",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="评估结果"
      open={open}
      width={420}
      destroyOnHidden
      confirmLoading={saving}
      okText="确定"
      cancelText="取消"
      onOk={() => void handleOk()}
      onCancel={onCancel}
    >
      <div className="flex flex-col gap-4 py-2">
        <div
          className="inline-flex items-baseline gap-2 self-start rounded-lg border px-4 py-2.5 shadow-sm"
          style={{
            borderColor: color,
            backgroundColor: `${color}14`,
          }}
        >
          <span className="text-sm font-medium text-gray-600">得分</span>
          <span
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color }}
          >
            {assess_score}
          </span>
          {assess_total != null ? (
            <span className="text-base text-gray-500">/ {assess_total}</span>
          ) : null}
          {assess_result ? (
            <span
              className="ml-1 rounded px-2 py-0.5 text-sm font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {assess_result}
            </span>
          ) : null}
        </div>
        <Checkbox
          checked={closeProblem}
          onChange={(e) => setCloseProblem(e.target.checked)}
        >
          关闭问题
        </Checkbox>
      </div>
    </Modal>
  );
}
