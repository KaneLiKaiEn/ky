import { useEffect, useState } from "react";
import { getElemProperty2 } from "@/api/elem";
import { getSectionElemList } from "@/api/form";
import type { ElemProp } from "../components/DataElem/types";
import type { SectionProp } from "../components/Section/types";
import { buildSectionDefinition } from "../model/sectionDefinition";

interface SectionDefinitionState {
  key: string;
  loading: boolean;
  elemList: ElemProp[];
  error: string | null;
}

export const useSectionDefinition = ({
  form_id,
  section_id,
  section_version,
}: SectionProp) => {
  const key = JSON.stringify([form_id, section_id, section_version]);
  const [state, setState] = useState<SectionDefinitionState>({
    key,
    loading: true,
    elemList: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ key, loading: true, elemList: [], error: null });
    const load = async () => {
      try {
        // Version remains omitted until the existing backend version policy changes.
        const sectionRes = await getSectionElemList({ section_id });
        if (sectionRes.code !== 0) throw new Error(sectionRes.message || "分段配置加载失败");
        const sectionRows = sectionRes.row_list ?? [];
        const idList = sectionRows.map((row) => row.elem_id)
          .filter((id): id is number => id != null);
        let elemList: ElemProp[] = [];
        if (idList.length > 0) {
          const elemRes = await getElemProperty2({ id_list: idList });
          if (elemRes.code !== 0) throw new Error(elemRes.message || "元素配置加载失败");
          elemList = buildSectionDefinition(section_id, sectionRows, elemRes.elem_list ?? []);
        }
        if (!cancelled) setState({ key, loading: false, elemList, error: null });
      } catch (error) {
        if (!cancelled) setState({
          key,
          loading: false,
          elemList: [],
          error: error instanceof Error ? error.message : "分段配置加载失败，请重新打开表单后重试",
        });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [form_id, section_id, section_version, key]);

  return state.key === key ? state : {
    key,
    loading: true,
    elemList: [],
    error: null,
  };
};
