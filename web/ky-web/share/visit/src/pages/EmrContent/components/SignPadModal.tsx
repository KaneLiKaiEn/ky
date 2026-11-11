import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Modal, Space, Switch, Tabs, Tag, Tooltip } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import { getVisitPropertyAPI } from "@/api/visit";
import type { EmrConsentRow, EmrConsentSignRow } from "@/types/emr";

export interface SignPadModalProps {
  open: boolean;
  visitId?: number;
  consentList: EmrConsentRow[];
  consentProperty: EmrConsentRow;
  signList: EmrConsentSignRow[];
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (
    property: EmrConsentRow,
    signList: EmrConsentSignRow[],
  ) => Promise<boolean>;
  onPropertyChange: (property: EmrConsentRow) => void;
}

const toBase64 = (dataUrl: string) => dataUrl.split(",")[1] ?? "";

const isBlankPng = (base64: string) => {
  if (!base64) return true;
  return base64.length < 200;
};

const pointFromEvent = (
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
) => {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
};

const drawSegment = (
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
) => {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#111";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
};

const SignPadModal: React.FC<SignPadModalProps> = ({
  open,
  visitId,
  consentList,
  consentProperty,
  signList,
  submitting,
  onCancel,
  onConfirm,
  onPropertyChange,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signMapRef = useRef<Record<number, string>>({});
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const dirtyRef = useRef(false);
  const prevOpenRef = useRef(false);
  const prevConsentIdRef = useRef<number | undefined>(undefined);
  const restoreGenRef = useRef(0);

  const [patientNo, setPatientNo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [activeConsentId, setActiveConsentId] = useState<number>();
  const [signMap, setSignMap] = useState<Record<number, string>>({});
  const [padEmpty, setPadEmpty] = useState(true);
  const [layoutTick, setLayoutTick] = useState(0);

  signMapRef.current = signMap;

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      prevConsentIdRef.current = undefined;
      drawingRef.current = false;
      lastPointRef.current = null;
      dirtyRef.current = false;
      restoreGenRef.current += 1;
      return;
    }

    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;

    if (justOpened) {
      const next: Record<number, string> = {};
      signList.forEach((item) => {
        if (item.consent_id != null) {
          next[item.consent_id] = item.sign_content ?? "";
        }
      });
      signMapRef.current = next;
      setSignMap(next);
      setActiveConsentId(consentList[0]?.consent_id);
      dirtyRef.current = false;
      setPadEmpty(true);
      return;
    }

    setActiveConsentId((current) => current ?? consentList[0]?.consent_id);
  }, [open, consentList, signList]);

  useEffect(() => {
    if (!open || !visitId) {
      setPatientNo("");
      setPatientName("");
      return;
    }

    void getVisitPropertyAPI({
      visit_id: visitId,
      column_visit: "*",
      column_patient: "*",
    }).then((res) => {
      setPatientNo(res.visit_property?.patient_no ?? "");
      setPatientName(res.patient_property?.patient_name ?? "");
    });
  }, [open, visitId]);

  const activeConsent = useMemo(
    () => consentList.find((item) => item.consent_id === activeConsentId),
    [activeConsentId, consentList],
  );

  const padWidth = Number(activeConsent?.sign_width) || 2000;
  const padHeight = Number(activeConsent?.sign_height) || 1000;
  const ratio = padHeight / padWidth || 0.5;
  const activeTitle = activeConsent
    ? `${activeConsent.consent_title ?? ""}${
        activeConsent.consent_desc ? `（${activeConsent.consent_desc}）` : ""
      }`
    : "";

  const fitCanvas = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const width = Math.floor(wrap.clientWidth);
    if (width <= 0) return;
    const height = Math.min(380, Math.max(320, Math.round(width * ratio)));
    if (canvas.width !== width || canvas.height !== height) {
      if (dirtyRef.current) return;
      canvas.width = width;
      canvas.height = height;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  };

  const restorePad = () => {
    if (dirtyRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gen = ++restoreGenRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const content =
      activeConsentId != null ? signMapRef.current[activeConsentId] : "";
    if (!content) {
      dirtyRef.current = false;
      setPadEmpty(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (gen !== restoreGenRef.current) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = `data:image/png;base64,${content}`;
    setPadEmpty(false);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const consentChanged = prevConsentIdRef.current !== activeConsentId;
    prevConsentIdRef.current = activeConsentId;
    if (consentChanged) {
      dirtyRef.current = false;
    }
    fitCanvas();
    restorePad();
    // 仅在弹窗打开、切换签名项、弹窗动画结束后同步画布
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeConsentId, ratio, layoutTick]);

  useEffect(() => {
    if (!open) return;

    const onMove = (event: PointerEvent) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const last = lastPointRef.current;
      if (!canvas || !ctx || !last) return;
      event.preventDefault();
      const point = pointFromEvent(canvas, event.clientX, event.clientY);
      if (!point) return;
      drawSegment(ctx, last, point);
      lastPointRef.current = point;
      dirtyRef.current = true;
    };

    const onUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastPointRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas || activeConsentId == null || !dirtyRef.current) return;
      const next = {
        ...signMapRef.current,
        [activeConsentId]: toBase64(canvas.toDataURL("image/png")),
      };
      signMapRef.current = next;
      setSignMap(next);
      setPadEmpty(false);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [open, activeConsentId]);

  const snapshotPad = () => {
    const canvas = canvasRef.current;
    if (!canvas || activeConsentId == null) return signMapRef.current;
    if (!dirtyRef.current) {
      return {
        ...signMapRef.current,
        [activeConsentId]: signMapRef.current[activeConsentId] ?? "",
      };
    }
    return {
      ...signMapRef.current,
      [activeConsentId]: toBase64(canvas.toDataURL("image/png")),
    };
  };

  const handleTabChange = (key: string) => {
    const next = snapshotPad();
    signMapRef.current = next;
    setSignMap(next);
    dirtyRef.current = false;
    drawingRef.current = false;
    lastPointRef.current = null;
    restoreGenRef.current += 1;
    setActiveConsentId(Number(key));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    const point = pointFromEvent(canvas, event.clientX, event.clientY);
    if (!ctx || !point) return;
    event.preventDefault();
    event.stopPropagation();
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = point;
    drawSegment(ctx, point, point);
    dirtyRef.current = true;
    setPadEmpty(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    dirtyRef.current = false;
    if (activeConsentId != null) {
      const next = { ...signMapRef.current, [activeConsentId]: "" };
      signMapRef.current = next;
      setSignMap(next);
    }
    setPadEmpty(true);
  };

  const handleConfirm = async () => {
    const latestMap = snapshotPad();
    signMapRef.current = latestMap;
    setSignMap(latestMap);
    const nextSignList = consentList.map((item) => ({
      consent_id: item.consent_id,
      sign_content:
        item.consent_id != null
          ? isBlankPng(latestMap[item.consent_id] ?? "")
            ? ""
            : (latestMap[item.consent_id] ?? "")
          : "",
    }));
    const ok = await onConfirm(consentProperty, nextSignList);
    if (ok) onCancel();
  };

  return (
    <Modal
      title="患者签名"
      open={open}
      onCancel={onCancel}
      centered
      width={880}
      style={{ maxWidth: "90vw" }}
      styles={{
        body: { paddingTop: 12, overflow: "hidden" },
      }}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible) setLayoutTick((tick) => tick + 1);
      }}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleConfirm}>
            确认
          </Button>
        </Space>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Space size={8} wrap>
          <Tag>病案号 {patientNo || "-"}</Tag>
          <Tag>姓名 {patientName || "-"}</Tag>
          {activeTitle ? (
            <span className="text-gray-500">{activeTitle}</span>
          ) : null}
        </Space>
        <Space size={8}>
          <span className="text-gray-500">代签</span>
          <Switch
            size="small"
            checked={Boolean(consentProperty.consent_tag)}
            onChange={(checked) =>
              onPropertyChange({
                ...consentProperty,
                consent_tag: checked ? "[代签]" : "",
              })
            }
          />
        </Space>
      </div>
      <Tabs
        type="card"
        size="small"
        activeKey={
          activeConsentId != null ? String(activeConsentId) : undefined
        }
        onChange={handleTabChange}
        items={consentList.map((item) => ({
          key: String(item.consent_id),
          label: (
            <span className="inline-flex items-center gap-1.5">
              {item.consent_title || `签名${item.consent_id}`}
              {item.consent_id != null && signMap[item.consent_id] ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              ) : null}
            </span>
          ),
        }))}
      />
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-lg border border-dashed border-gray-300 bg-white"
        style={{ userSelect: "none" }}
      >
        <div className="absolute right-2 top-2 z-10">
          <Tooltip title="清空">
            <Button size="small" icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
          </Tooltip>
        </div>
        <canvas
          ref={canvasRef}
          className="block bg-white"
          style={{
            display: "block",
            width: "100%",
            height: 320,
            cursor: "crosshair",
            touchAction: "none",
            pointerEvents: "auto",
          }}
          onPointerDown={handlePointerDown}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {padEmpty ? "请在框内签字后确认" : "请在虚线框内完成签字后确认"}
      </div>
    </Modal>
  );
};

export default SignPadModal;
