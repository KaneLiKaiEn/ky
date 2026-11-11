import { useEffect, useState } from "react";
import { getSessionId } from "comm/session";
import { getDiseaseListAPI } from "@/api/cohort";
import { getSessionInfo } from "@/api/auth";
import { retrieveDict2ItemList } from "@/api/sys";

const VISIT_OP_TYPE_DICT_NAME = "visit.op.type";
const DISEASE_TYPE = "病种";

type SelectOption = {
  label: string;
  value: string | number;
};

type UseTemplateSaveFormOptionsParams = {
  deptId?: number;
  userId?: number;
  enabled?: boolean;
};

export const useTemplateSaveFormOptions = ({
  deptId,
  userId,
  enabled = true,
}: UseTemplateSaveFormOptionsParams = {}) => {
  const [visitOpTypeOptions, setVisitOpTypeOptions] = useState<SelectOption[]>([]);
  const [diseaseOptions, setDiseaseOptions] = useState<SelectOption[]>([]);
  const [visitTypeLoading, setVisitTypeLoading] = useState(false);
  const [diseaseLoading, setDiseaseLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const loadVisitTypeOptions = async () => {
      setVisitTypeLoading(true);
      try {
        const res = await retrieveDict2ItemList({
          dict_code: VISIT_OP_TYPE_DICT_NAME,
          retrieve_input: "*",
        });
        if (cancelled) return;
        setVisitOpTypeOptions(
          (res.row_list ?? [])
            .map((item) => item.item_name?.trim())
            .filter((name): name is string => !!name)
            .map((name) => ({ label: name, value: name })),
        );
      } catch {
        if (!cancelled) setVisitOpTypeOptions([]);
      } finally {
        if (!cancelled) setVisitTypeLoading(false);
      }
    };

    void loadVisitTypeOptions();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const loadDiseaseOptions = async () => {
      setDiseaseLoading(true);
      try {
        let resolvedDeptId = deptId;
        let resolvedUserId = userId;

        if (resolvedDeptId == null || resolvedUserId == null) {
          const sessionId = getSessionId();
          if (sessionId) {
            const sessionRes = await getSessionInfo({ session_id: sessionId });
            resolvedDeptId ??= sessionRes.session_info?.dept_id;
            resolvedUserId ??= sessionRes.session_info?.user_id;
          }
        }

        if (resolvedDeptId == null || resolvedUserId == null) {
          if (!cancelled) setDiseaseOptions([]);
          return;
        }

        const res = await getDiseaseListAPI({
          dept_id: resolvedDeptId,
          user_id: resolvedUserId,
          disease_type: DISEASE_TYPE,
        });
        if (cancelled) return;
        setDiseaseOptions(
          (res.row_list ?? [])
            .filter(
              (item) => item.disease_id != null && item.disease_name?.trim(),
            )
            .map((item) => ({
              label: item.disease_name!.trim(),
              value: item.disease_id!,
            })),
        );
      } catch {
        if (!cancelled) setDiseaseOptions([]);
      } finally {
        if (!cancelled) setDiseaseLoading(false);
      }
    };

    void loadDiseaseOptions();
    return () => {
      cancelled = true;
    };
  }, [deptId, userId, enabled]);

  return {
    visitOpTypeOptions,
    diseaseOptions,
    visitTypeLoading,
    diseaseLoading,
  };
};
