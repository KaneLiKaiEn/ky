import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getAllergyListAPI } from "@/api/allergy";
import { getVisitPropertyAPI } from "@/api/visit";
import AllergyHistory from "@/pages/AllergyHistory";
import type { AllergyRow } from "@/types/allergy";
import type { SectionCodeProps, SectionCodeRef } from "../types";
import { mapAllergyRowsToElemValues } from "./mapAllergyToElemValues";

/** 过敏史 SectionCode：胶囊 + 弹窗编辑，保存表单时汇总写入 elem_list */
const AllergyHistorySection = forwardRef<SectionCodeRef, SectionCodeProps>(
  function AllergyHistorySection({ visit_id, section }, ref) {
    const section_id = section.section_id ?? 0;
    const sectionTitle = section.section_title ?? section.section_name;
    const [patientId, setPatientId] = useState(0);
    const [allergyRows, setAllergyRows] = useState<AllergyRow[]>([]);
    const allergyRowsRef = useRef(allergyRows);
    allergyRowsRef.current = allergyRows;
    const patientIdRef = useRef(patientId);
    patientIdRef.current = patientId;

    const fetchAllergyRows = useCallback(async (pid: number) => {
      if (!pid) return [];
      try {
        const res = await getAllergyListAPI({
          patient_id: pid,
          allergy_type: "*",
        });
        return res.row_list ?? [];
      } catch {
        return [];
      }
    }, []);

    const loadAllergyRows = useCallback(
      async (pid: number) => {
        setAllergyRows(await fetchAllergyRows(pid));
      },
      [fetchAllergyRows],
    );

    useEffect(() => {
      let cancelled = false;

      const run = async () => {
        if (!visit_id) {
          setPatientId(0);
          setAllergyRows([]);
          return;
        }
        try {
          const visitRes = await getVisitPropertyAPI({
            visit_id,
            column_visit: "*",
            column_patient: "*",
          });
          if (cancelled) return;
          const pid =
            visitRes.visit_property?.patient_id ??
            visitRes.patient_property?.patient_id ??
            0;
          setPatientId(pid);
          const rows = await fetchAllergyRows(pid);
          if (cancelled) return;
          setAllergyRows(rows);
        } catch {
          if (!cancelled) {
            setPatientId(0);
            setAllergyRows([]);
          }
        }
      };

      void run();
      return () => {
        cancelled = true;
      };
    }, [visit_id, fetchAllergyRows]);

    useImperativeHandle(
      ref,
      () => ({
        getSectionValue: () =>
          mapAllergyRowsToElemValues(
            section_id,
            allergyRowsRef.current,
            sectionTitle,
          ),
        initSectionValue: () => {
          void loadAllergyRows(patientIdRef.current);
        },
      }),
      [section_id, sectionTitle, loadAllergyRows],
    );

    if (!patientId) return null;

    return (
      <AllergyHistory
        patientId={patientId}
      />
    );
  },
);

export default AllergyHistorySection;
