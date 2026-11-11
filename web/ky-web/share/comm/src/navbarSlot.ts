import { useEffect, useState } from "react";

export const NAVBAR_SLOT_ID = "app-navbar-slot";

/** 获取 host navbar 中间的槽位 DOM 节点 */
export const getNavbarSlot = (): HTMLElement | null =>
  typeof document === "undefined"
    ? null
    : document.getElementById(NAVBAR_SLOT_ID);

/** 子应用页面获取槽位节点，配合 ReactDOM.createPortal 渲染任意 React 内容 */
export const useNavbarSlot = (): HTMLElement | null => {
  const [el, setEl] = useState<HTMLElement | null>(() => getNavbarSlot());
  useEffect(() => {
    if (!el) setEl(getNavbarSlot());
  }, [el]);
  return el;
};
