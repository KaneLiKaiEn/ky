import { getSessionId } from "comm/session";

/** Emit PROGRAM_COMMAND to host CORE PROGRAM via socket.io (SELECT_VISIT). */
export function emitSelectVisit(data: Record<string, unknown>) {
  const sendData = {
    appId: "nurse-station",
    sid: getSessionId(),
    data: {
      tag: "SELECT_VISIT",
      data,
    },
  };

  if (typeof window === "undefined" || !(window as any).CORE_PROGRAM) {
    console.warn("[BedsideCare selectVisit]", sendData);
    return;
  }

  const w = window as any;
  if (typeof w.io === "undefined") {
    console.warn("[BedsideCare selectVisit] socket.io not available", sendData);
    return;
  }

  const serverPort = w.WEBSOCKET_SERVER_PORT;
  const socket = w.io(
    typeof serverPort !== "undefined"
      ? `${window.location.hostname}:${serverPort}`
      : window.location.host,
  );
  socket.emit("PROGRAM_COMMAND", sendData);
}
