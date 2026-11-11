export { fileBase64, base64Blob } from "comm/utils";

export function mimeType(format: string, video = false): string {
  if (format.includes("/")) return format;
  const subtype = format.replace(/^\./, "").toLowerCase();
  if (subtype === "jpg") return "image/jpeg";
  if (["mp4", "webm", "ogg", "mov"].includes(subtype) || video)
    return `video/${subtype || "mp4"}`;
  return `image/${subtype || "png"}`;
}
