import { getSessionId } from "comm/session";

/**
 * Bridge to host CORE PROGRAM (socket.io).
 * Used for PROGRAM_COMMAND such as OPEN_DATA_ISLAND.
 */
const io = (event: string, data: any, callback?: (...args: any[]) => void) => {
  const sendData = {
    appId: "nurse-station",
    sid: getSessionId(),
    data,
  };

  if (typeof window === "undefined" || !(window as any).CORE_PROGRAM) {
    console.warn("[CareRecord io]", event, sendData);
    return;
  }

  const w = window as any;
  if (typeof w.io === "undefined") {
    console.warn("[CareRecord io] socket.io not available", event, sendData);
    return;
  }

  const serverPort = w.WEBSOCKET_SERVER_PORT;
  const socket = w.io(
    typeof serverPort !== "undefined"
      ? `${window.location.hostname}:${serverPort}`
      : window.location.host,
  );
  socket.emit(event, sendData, callback);
};

export default io;
