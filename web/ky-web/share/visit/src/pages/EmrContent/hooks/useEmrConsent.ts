import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import {
  getEmrConsentList,
  getEmrConsentSignContent,
  signEmrConsent,
} from "@/api/emr";
import { rebuildVisitDoc } from "@/api/doc";
import type { EmrConsentRow, EmrConsentSignRow } from "@/types/emr";

const toSignContent = (value?: string) =>
  typeof value === "string" ? value : "";

export function useEmrConsent(emrId?: number) {
  const [consentList, setConsentList] = useState<EmrConsentRow[]>([]);
  const [consentProperty, setConsentProperty] = useState<EmrConsentRow>({});
  const [signList, setSignList] = useState<EmrConsentSignRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    if (!emrId || emrId <= 0) {
      setConsentList([]);
      setConsentProperty({});
      setSignList([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getEmrConsentList({ emr_id: emrId });
      if (res.code !== 0) {
        setConsentList([]);
        setConsentProperty({});
        setSignList([]);
        return;
      }

      const list = res.row_list ?? [];
      setConsentList(list);
      setConsentProperty(list[0] ?? {});
      if (list.length === 0) {
        setSignList([]);
        return;
      }

      const signs = await Promise.all(
        list.map(async (item) => {
          const consentId = Number(item.consent_id);
          const signRes = await getEmrConsentSignContent({
            consent_id: consentId,
          });
          return {
            consent_id: item.consent_id,
            sign_content: toSignContent(signRes.sign_content),
          };
        }),
      );
      setSignList(signs);
    } catch (error) {
      setConsentList([]);
      setConsentProperty({});
      setSignList([]);
      message.error(
        error instanceof Error ? error.message : "加载患者签名失败",
      );
    } finally {
      setLoading(false);
    }
  }, [emrId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submitSigns = useCallback(
    async (property: EmrConsentRow, nextSignList: EmrConsentSignRow[]) => {
      if (!emrId || emrId <= 0) return false;

      const payloads = nextSignList.filter(
        (
          item,
        ): item is EmrConsentSignRow & {
          consent_id: number;
          sign_content: string;
        } => item.consent_id != null && Boolean(item.sign_content),
      );
      if (payloads.length === 0) {
        message.warning("请先签名");
        return false;
      }

      setSubmitting(true);
      try {
        const results = await Promise.all(
          payloads.map((item) =>
            signEmrConsent({
              consent_id: item.consent_id,
              consent_name: property.consent_name,
              consent_gender: property.consent_gender,
              consent_idno: property.consent_idno,
              consent_idno_system: property.consent_idno_system,
              consent_telno: property.consent_telno,
              consent_address: property.consent_address,
              consent_kinship: property.consent_kinship,
              consent_value: property.consent_value,
              consent_tag: property.consent_tag,
              consent_note: property.consent_note,
              sign_format: "PNG",
              sign_content: item.sign_content,
            }),
          ),
        );
        const errors = results.filter((res) => res.code !== 0);
        if (errors.length > 0) {
          message.error(
            errors.map((res) => res.message).join("；") || "签名失败",
          );
          return false;
        }

        message.success("确认成功，正在重建文档...");
        const rebuildRes = await rebuildVisitDoc({
          owner_type: "EMR",
          owner_id: emrId,
        });
        if (rebuildRes.code !== 0) {
          message.error(rebuildRes.message || "重建文档失败");
          return false;
        }

        await reload();
        return true;
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "签名失败，请稍后重试",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [emrId, reload],
  );

  return {
    consentList,
    consentProperty,
    setConsentProperty,
    signList,
    loading,
    submitting,
    reload,
    submitSigns,
  };
}
