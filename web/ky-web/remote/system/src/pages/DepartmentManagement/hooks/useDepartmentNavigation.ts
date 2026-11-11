import { useSelectionNavigation } from "@/hooks/useSelectionNavigation";
import { readSelection, sameSelection, selectionParams } from "../navigation";

export function useDepartmentNavigation() {
  return useSelectionNavigation({
    readSelection,
    sameSelection,
    selectionParams,
    discardContent: "当前修改尚未保存，继续操作将丢弃这些修改。",
  });
}
