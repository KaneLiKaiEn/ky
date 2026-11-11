import { usePreview } from "../context";
import { useRead } from "./useRead";
export function useBackground(enabled = true) {
  const { service, query } = usePreview();
  const read = useRead(
    enabled ? `background:${query.unitId}` : null,
    (signal) =>
      service.background(
        {
          unit_id: query.unitId,
          work_type: "metric",
          theme_name: "default",
          inherit_parent: true,
        },
        signal,
      ),
  );
  const format = (read.data?.file_format || "png")
    .replace(/^image\//i, "")
    .replace(/^\./, "")
    .toLowerCase();
  const image =
    read.data?.file_content && /^(png|jpe?g|webp)$/.test(format)
      ? `url("data:image/${format === "jpg" ? "jpeg" : format};base64,${read.data.file_content}")`
      : undefined;
  return { ...read, image };
}
