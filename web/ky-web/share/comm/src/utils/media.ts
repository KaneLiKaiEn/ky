export function fileBase64(
  file: File,
  failureMessage = "读取文件失败，请重新选择",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(failureMessage));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

export function base64Blob(
  content: unknown,
  mime: string,
  failureMessage = "文件内容应为 base64 字符串",
): Blob {
  if (typeof content !== "string") throw new Error(failureMessage);
  const bytes = Uint8Array.from(atob(content), (character) =>
    character.charCodeAt(0),
  );
  return new Blob([bytes], { type: mime });
}
