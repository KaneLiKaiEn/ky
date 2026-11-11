import { useEffect, useRef, useState } from "react";
import { App, Form } from "antd";
import { getOrgProperty, newOrg, saveOrgProperty } from "@/api/org";
import type { OrgRow } from "@/types/org";
import { InvalidOrganizationResponse } from "@/api/organizationResult";
import { buildOrgPayload, toNewOrgRequest } from "../dto";
import { useSaveShortcut } from "@/hooks/useSaveShortcut";

export interface OrganizationFormOptions {
  orgId: number;
  disabled?: boolean;
  onSaved: (org: OrgRow) => void;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

/** Keeps organization loading, mutation, and request isolation separate from layout. */
export function useOrganizationForm({
  orgId,
  disabled = false,
  onSaved,
  onDirtyChange,
  onBusyChange,
}: OrganizationFormOptions) {
  const { message } = App.useApp();
  const [form] = Form.useForm<OrgRow>();
  const [original, setOriginal] = useState<OrgRow>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const requestEpoch = useRef(0);
  const savingRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const values = Form.useWatch((store) => store, {
    form,
    preserve: true,
  }) as OrgRow | undefined;

  useEffect(() => {
    const epoch = ++requestEpoch.current;
    setLoaded(false);
    setLoadError(false);
    setSaving(false);
    savingRef.current = false;
    onDirtyChange(false);
    onBusyChange(false);
    form.resetFields();

    const apply = (data: OrgRow) => {
      const initial: OrgRow = {
        ...data,
        org_id: orgId,
        org_level: Number(data.org_level ?? 0),
        org_grade: Number(data.org_grade ?? 0),
        org_address_nation: data.org_address_nation || "中国",
      };
      setOriginal(initial);
      form.setFieldsValue(initial);
      setLoaded(true);
    };

    if (orgId === 0) {
      apply({ org_id: 0, org_level: 0, org_grade: 0 });
      setLoading(false);
    } else {
      setLoading(true);
      getOrgProperty({ org_id: orgId })
        .then((response) => {
          if (epoch !== requestEpoch.current) return;
          if (!response.org_property) {
            setLoadError(true);
            return;
          }
          apply(response.org_property);
        })
        .catch(() => {
          if (epoch === requestEpoch.current) setLoadError(true);
        })
        .finally(() => {
          if (epoch === requestEpoch.current) setLoading(false);
        });
    }

    return () => {
      ++requestEpoch.current;
      savingRef.current = false;
      onDirtyChange(false);
      onBusyChange(false);
    };
  }, [orgId, reload, form, onDirtyChange, onBusyChange]);

  useEffect(() => {
    if (!loaded || !values) return;
    const current = buildOrgPayload(values, original, orgId);
    const baseline = buildOrgPayload(original, original, orgId);
    onDirtyChange(JSON.stringify(current) !== JSON.stringify(baseline));
  }, [values, original, loaded, orgId, onDirtyChange]);

  const handleSave = async (formValues: OrgRow) => {
    if (disabledRef.current || !loaded || loading || savingRef.current) return;
    const epoch = requestEpoch.current;
    const payload = buildOrgPayload(formValues, original, orgId);
    savingRef.current = true;
    setSaving(true);
    onBusyChange(true);

    try {
      let saved: OrgRow;
      if (orgId === 0) {
        const response = await newOrg(toNewOrgRequest(payload));
        if (epoch !== requestEpoch.current) return;
        const savedId = Number(response.org_id);
        if (!Number.isSafeInteger(savedId) || savedId <= 0) {
          message.error("机构创建结果缺少有效 ID，请刷新机构列表后确认");
          return;
        }
        saved = { ...payload, org_id: savedId };
      } else {
        await saveOrgProperty({ org_id: orgId, org_property: payload });
        if (epoch !== requestEpoch.current) return;
        saved = payload;
      }
      setOriginal(saved);
      form.setFieldsValue(saved);
      onDirtyChange(false);
      message.success(orgId === 0 ? "机构创建成功" : "机构保存成功");
      onSaved(saved);
    } catch (error) {
      if (error instanceof InvalidOrganizationResponse)
        message.error(error.message);
      // 请求拦截器提示接口错误，保留当前表单供重试。
    } finally {
      if (epoch === requestEpoch.current) {
        savingRef.current = false;
        setSaving(false);
        onBusyChange(false);
      }
    }
  };

  useSaveShortcut(
    () => form.submit(),
    !disabled && loaded && !loading && !saving,
  );

  return {
    form,
    loading,
    loaded,
    loadError,
    saving,
    handleSave,
    retry: () => {
      if (!disabledRef.current && !savingRef.current)
        setReload((value) => value + 1);
    },
  };
}
