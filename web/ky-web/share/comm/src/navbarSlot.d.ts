export declare const NAVBAR_SLOT_ID = "app-navbar-slot";
/** 获取 host navbar 中间的槽位 DOM 节点 */
export declare const getNavbarSlot: () => HTMLElement | null;
/** 子应用页面获取槽位节点，配合 ReactDOM.createPortal 渲染任意 React 内容 */
export declare const useNavbarSlot: () => HTMLElement | null;
