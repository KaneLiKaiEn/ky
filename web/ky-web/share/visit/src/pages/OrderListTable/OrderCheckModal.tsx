import { useMemo, useState } from "react";
import { Alert, Checkbox, Input, Modal } from "antd";
import type {
  OrderCheckAlertCommentRow,
  OrderCheckAlertRow,
  OrderCheckConfirmCommentRow,
  OrderCheckConfirmRow,
} from "@/types/ordent";
import RestrictedDrugAuthModal from "./RestrictedDrugAuthModal";

const { TextArea } = Input;

interface OrderCheckDraft {
  commentDesc: string;
  selfPay: boolean;
}

export interface OrderCheckModalResult {
  alert_list: OrderCheckAlertCommentRow[];
  confirm_list: OrderCheckConfirmCommentRow[];
}

interface OrderCheckModalProps {
  open: boolean;
  confirmList: OrderCheckConfirmRow[];
  alertList: OrderCheckAlertRow[];
  confirmLoading?: boolean;
  onCancel: () => void;
  onOk: (result: OrderCheckModalResult) => void;
  onAuthRestrictedDrug?: () => void;
}

function judgeLabelText(level?: string): string {
  const l = (level ?? "").toUpperCase();
  if (l.includes("DENY") || l.includes("REJECT")) return "拒绝";
  if (l.includes("WARN")) return "警告";
  if (l.includes("INFO") || l.includes("HINT")) return "提示";
  return level ? "提示" : "";
}

function labelColor(level?: string): string {
  const text = judgeLabelText(level);
  if (text === "拒绝") return "var(--app-theme-error, #ff4d4f)";
  if (text === "警告") return "var(--app-theme-warning, #faad14)";
  return "var(--app-theme-info, #1677ff)";
}

function isRestrictedDrugDeny(item: OrderCheckAlertRow): boolean {
  return (
    (item.alert_level ?? "").toUpperCase() === "DENY" &&
    item.alert_name === "限制级药品"
  );
}

/** 提交前质控弹窗（人工审核 / 自动审核 / 限制级药品授权） */
function OrderCheckModal({
  open,
  confirmList,
  alertList,
  confirmLoading,
  onCancel,
  onOk,
  onAuthRestrictedDrug,
}: OrderCheckModalProps) {
  const [confirmDrafts, setConfirmDrafts] = useState<
    Record<number, OrderCheckDraft>
  >({});
  const [alertDrafts, setAlertDrafts] = useState<
    Record<number, OrderCheckDraft>
  >({});

  const existAlertDeny = useMemo(
    () => alertList.some((a) => (a.alert_level ?? "").toUpperCase() === "DENY"),
    [alertList],
  );

  const patchConfirm = (id: number, patch: Partial<OrderCheckDraft>) => {
    setConfirmDrafts((prev) => ({
      ...prev,
      [id]: {
        commentDesc: prev[id]?.commentDesc ?? "",
        selfPay: prev[id]?.selfPay ?? false,
        ...patch,
      },
    }));
  };

  const patchAlert = (id: number, patch: Partial<OrderCheckDraft>) => {
    setAlertDrafts((prev) => ({
      ...prev,
      [id]: {
        commentDesc: prev[id]?.commentDesc ?? "",
        selfPay: prev[id]?.selfPay ?? false,
        ...patch,
      },
    }));
  };

  const handleOk = () => {
    if (existAlertDeny) return;

    const confirm_list: OrderCheckConfirmCommentRow[] = confirmList.map(
      (item, index) => {
        const id = item.confirm_id ?? index;
        const draft = confirmDrafts[id];
        return {
          confirm_id: item.confirm_id,
          comment_desc: draft?.commentDesc || undefined,
          order_tag: draft?.selfPay ? "[自费]" : undefined,
        };
      },
    );

    const alert_list: OrderCheckAlertCommentRow[] = alertList
      .filter((item) => judgeLabelText(item.alert_level) === "警告")
      .map((item, index) => {
        const id = item.alert_id ?? index;
        const draft = alertDrafts[id];
        return {
          alert_id: item.alert_id,
          comment_desc: draft?.commentDesc || undefined,
          order_tag: draft?.selfPay ? "[自费]" : undefined,
        };
      });

    onOk({ alert_list, confirm_list });
  };

  return (
    <Modal
      title="医嘱质控审核"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定提交"
      cancelText="取消"
      okButtonProps={{ disabled: existAlertDeny, loading: confirmLoading }}
      width={640}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible) {
          setConfirmDrafts({});
          setAlertDrafts({});
        }
      }}
    >
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        {confirmList.length > 0 ? (
          <section>
            <div className="mb-2 rounded bg-amber-50 px-2 py-1 text-amber-800">
              需要人工审核：
            </div>
            {confirmList.map((item, index) => {
              const id = item.confirm_id ?? index;
              const draft = confirmDrafts[id] ?? {
                commentDesc: "",
                selfPay: false,
              };
              return (
                <div key={`confirm-${id}`} className="mb-3 flex flex-col gap-1">
                  <div>
                    <span className="mr-2">{index + 1}.</span>
                    <span>{item.confirm_desc || item.alert_desc || "-"}</span>
                  </div>
                  <div className="flex gap-2">
                    <TextArea
                      rows={2}
                      placeholder="解释说明"
                      value={draft.commentDesc}
                      onChange={(e) =>
                        patchConfirm(id, { commentDesc: e.target.value })
                      }
                      className="flex-1"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-red-500">
                      <Checkbox
                        checked={draft.selfPay}
                        onChange={(e) =>
                          patchConfirm(id, { selfPay: e.target.checked })
                        }
                      />
                      自费
                    </label>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        {alertList.length > 0 ? (
          <section>
            <div className="mb-2 rounded bg-sky-50 p-2 text-sky-800">
              自动审核：
            </div>
            {alertList.map((item, index) => {
              const id = item.alert_id ?? index;
              const label = judgeLabelText(item.alert_level);
              const draft = alertDrafts[id] ?? {
                commentDesc: "",
                selfPay: false,
              };
              return (
                <div key={`alert-${id}`} className="mb-3 flex flex-col gap-1">
                  <div>
                    <span className="mr-2">{index + 1}.</span>
                    {label ? (
                      <span
                        className="mr-1 font-medium"
                        style={{ color: labelColor(item.alert_level) }}
                      >
                        {label}：
                      </span>
                    ) : null}
                    <span>
                      {item.alert_desc || "-"}
                      {item.alert_note ? `(${item.alert_note})` : ""}
                    </span>
                  </div>
                  {label === "警告" ? (
                    <div className="flex gap-2">
                      <TextArea
                        rows={2}
                        placeholder="解释说明"
                        value={draft.commentDesc}
                        onChange={(e) =>
                          patchAlert(id, { commentDesc: e.target.value })
                        }
                        className="flex-1"
                      />
                      <label className="flex shrink-0 items-center gap-1 text-red-500">
                        <Checkbox
                          checked={draft.selfPay}
                          onChange={(e) =>
                            patchAlert(id, { selfPay: e.target.checked })
                          }
                        />
                        自费
                      </label>
                    </div>
                  ) : null}
                  {isRestrictedDrugDeny(item) ? (
                    <RestrictedDrugAuthModal
                      orderId={item.order_id}
                      onAuthRestrictedDrug={onAuthRestrictedDrug}
                    />
                  ) : null}
                </div>
              );
            })}
          </section>
        ) : null}

        {existAlertDeny ? (
          <Alert
            type="warning"
            showIcon
            message="自动审核存在拒绝信息，无法提交医嘱"
          />
        ) : null}

        {alertList.length === 0 && confirmList.length === 0 ? (
          <div className="py-4 text-center text-(--app-theme-primary)">
            没有质控信息，可以点击确定后提交
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default OrderCheckModal;
