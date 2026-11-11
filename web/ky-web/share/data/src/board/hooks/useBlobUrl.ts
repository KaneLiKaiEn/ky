import { useEffect, useState } from "react";
import { base64Blob } from "../utils/media";
import { errorText } from "comm/utils";

/** Every created URL is released when bytes/type change or the consumer unmounts. */
export function useBlobUrl(content: unknown, type: string) {
  const [state, setState] = useState<{ url?: string; error?: string }>({});
  useEffect(() => {
    setState({});
    if (content === undefined || content === null || content === "") return;
    try {
      const url = URL.createObjectURL(base64Blob(content, type));
      setState({ url });
      return () => URL.revokeObjectURL(url);
    } catch (error) {
      setState({ error: `无法预览文件：${errorText(error)}` });
    }
  }, [content, type]);
  return state;
}
