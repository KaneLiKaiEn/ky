import React, { useEffect, useRef, useState } from "react";
import "./index.scss";

type PanelPosition = {
  left: number;
  top: number;
};

interface FloatingPanelProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** 可拖动的悬浮面板。关闭后仍保持挂载，再次打开时保留上次位置。 */
const FloatingPanel: React.FC<FloatingPanelProps> = ({
  title,
  open,
  onClose,
  children,
}) => {
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const onBarPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".floating-panel__close")) return;
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
      setPosition({
        left: Math.min(Math.max(0, ev.clientX - offsetX), maxLeft),
        top: Math.min(Math.max(0, ev.clientY - offsetY), maxTop),
      });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      dragCleanupRef.current = null;
    };
    dragCleanupRef.current?.();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    dragCleanupRef.current = stop;
  };

  if (!open) return null;

  return (
    <aside
      ref={panelRef}
      className="floating-panel"
      style={
        position
          ? { left: position.left, top: position.top, right: "auto" }
          : undefined
      }
      role="dialog"
      aria-label={title}
    >
      <div className="floating-panel__bar" onPointerDown={onBarPointerDown}>
        <span className="floating-panel__title">{title}</span>
        <button
          type="button"
          className="floating-panel__close"
          aria-label="关闭"
          onClick={onClose}
        >
          <i className="bi bi-x-lg" aria-hidden />
        </button>
      </div>
      {children}
    </aside>
  );
};

export default FloatingPanel;
