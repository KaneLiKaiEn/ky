import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, Input, Radio, Tag } from "antd";
import { useDict } from "../PatientInfo/stores/useDictStore";
import {
  getAreaPropertyAPI,
  getDealerListAPI,
  getPatientStatusPropertyAPI,
  getSettleServiceInfoAPI,
  getStatusPropertyAPI,
  type SettleServiceInfo,
  type StatusPropertyInfo,
} from "./api";
import type { InsuranceFormValues, InsurancePanelProps } from "./types";

/** 将状态属性中的医保 / 结算字段写入表单（仅覆盖响应里有值的项） */
const pickInsuranceFormValues = (
  status: StatusPropertyInfo,
): Partial<InsuranceFormValues> => {
  const patch: Partial<InsuranceFormValues> = {};
  if (status.insurance_type != null && status.insurance_type !== "") {
    patch.insurance_type = String(status.insurance_type);
  }
  if (status.insurance_name != null && status.insurance_name !== "") {
    patch.insurance_name = status.insurance_name;
  }
  if (status.settle_type != null && status.settle_type !== "") {
    patch.settle_type = String(status.settle_type);
  }
  if (status.settle_name != null && status.settle_name !== "") {
    patch.settle_name = status.settle_name;
  }
  if (status.insurance_no != null && status.insurance_no !== "") {
    patch.insurance_no = status.insurance_no;
  }
  if (status.insurance_code != null && status.insurance_code !== "") {
    patch.insurance_code = status.insurance_code;
  }
  return patch;
};

/** 患者类型字典 */
const INSURANCE_TYPE_DICT = "insurance.type";

type Option = { label: string; value: string };

const SELF_PAID: Option = { label: "自费", value: "0" };

/**
 * 医保 / 结算信息面板。
 * 放在 antd Form 内时读写父表单的 insurance_type / settle_type 等字段；
 * 未包在 Form 内时由组件自己维护这些字段。
 * 患者类型 → 结算方式 → 医保状态 → 登记号。
 */
const InsurancePanelBody: React.FC<InsurancePanelProps> = ({
  disabled,
  patientId,
  visitId,
  visitStatusNonce = 0,
  fromVisit = false,
  filterSelfPaid = false,
  insuranceDistrict,
  onSettleServiceInfo,
}) => {
  const form = Form.useFormInstance<InsuranceFormValues>();
  const { rows: insuranceRows } = useDict(INSURANCE_TYPE_DICT);

  const insuranceType = Form.useWatch("insurance_type", form);
  const settleType = Form.useWatch("settle_type", form);
  const onSettleServiceInfoRef = useRef(onSettleServiceInfo);
  onSettleServiceInfoRef.current = onSettleServiceInfo;

  const [settleOptions, setSettleOptions] = useState<Option[]>([]);
  const [serviceInfo, setServiceInfo] = useState<SettleServiceInfo | null>(
    null,
  );
  const [visitStatus, setVisitStatus] = useState<StatusPropertyInfo | null>(
    null,
  );
  /** 无就诊时从 patient/GetStatusProperty 带回的参保地 */
  const [statusDistrict, setStatusDistrict] = useState<string | null>(null);
  const [insuranceArea, setInsuranceArea] = useState("");
  const [serviceLoading, setServiceLoading] = useState(false);

  const applyStatusToForm = useCallback(
    (status: StatusPropertyInfo | null | undefined) => {
      if (!status) return;
      const patch = pickInsuranceFormValues(status);
      if (Object.keys(patch).length) {
        form.setFieldsValue(patch);
      }
    },
    [form],
  );

  /** 患者类型：patient 维度过滤带 [VISIT] 的项（如工伤） */
  const insuranceOptions = useMemo(() => {
    const list = fromVisit
      ? insuranceRows
      : insuranceRows.filter((item) => !item.item_tag?.includes("[VISIT]"));
    return list
      .filter((item) => item.item_code)
      .map((item) => ({
        label: item.item_name || item.item_code || "",
        value: item.item_code as string,
      }));
  }, [insuranceRows, fromVisit]);

  const insuranceTypeLabel = useMemo(
    () =>
      insuranceOptions.find((item) => item.value === String(insuranceType))
        ?.label ?? "",
    [insuranceOptions, insuranceType],
  );

  const statusLabel = insuranceTypeLabel === "部队" ? "状态：" : "医保状态：";

  const isSelfPaidType = String(insuranceType ?? "") === "0";
  /** 空和 0 都视为没有就诊，继续走原有患者侧接口 */
  const hasVisitId = visitId != null && visitId !== 0;

  /** 拉取结算方式列表 */
  const loadSettleOptions = useCallback(
    async (type: string | undefined | null) => {
      const insuranceCode = type == null ? "" : String(type);
      try {
        const res = await getDealerListAPI({ only_active: true });
        let rows = res.row_list ?? [];
        if (insuranceCode !== "0" && filterSelfPaid) {
          rows = rows.filter((item) => String(item.dealer_code) !== "0");
        }
        let options: Option[] = rows
          .filter((item) => item.dealer_code != null && item.dealer_code !== "")
          .map((item) => ({
            label: item.dealer_name || String(item.dealer_code),
            value: String(item.dealer_code),
          }));

        if (insuranceCode === "0") {
          options = [SELF_PAID];
        } else if (fromVisit && !options.some((o) => o.value === "0")) {
          options = [...options, SELF_PAID];
        }

        setSettleOptions(options);
        return options;
      } catch {
        const fallback = insuranceCode === "0" ? [SELF_PAID] : [];
        setSettleOptions(fallback);
        return fallback;
      }
    },
    [filterSelfPaid, fromVisit],
  );

  /** 按结算方式查医保状态，结果经 onSettleServiceInfo 回传外部（含当前 settle_type） */
  const loadServiceInfo = useCallback(
    async (settleCode?: string | null) => {
      const settle_type =
        settleCode == null || settleCode === "" ? null : String(settleCode);
      const emit = (info: SettleServiceInfo | null) => {
        onSettleServiceInfoRef.current?.({ settle_type, info });
      };

      if (!settleCode || patientId == null || patientId <= 0) {
        setServiceInfo(null);
        emit(null);
        return;
      }
      setServiceLoading(true);
      try {
        const res = await getSettleServiceInfoAPI({
          settle_type: String(settleCode),
          patient_id: Number(patientId),
        });
        if (res.code !== 0) {
          setServiceInfo(null);
          emit(null);
          return;
        }
        setServiceInfo(res);
        emit(res);
        form.setFieldsValue({
          insurance_code:
            res.insurance_code ?? form.getFieldValue("insurance_code"),
          insurance_no: res.insurance_no ?? form.getFieldValue("insurance_no"),
        });
      } catch {
        setServiceInfo(null);
        emit(null);
      } finally {
        setServiceLoading(false);
      }
    },
    [form, patientId],
  );

  const resolveAreaName = useCallback(async (district?: string | null) => {
    if (!district) {
      setInsuranceArea("");
      return;
    }
    const areaId = Number(district);
    if (!Number.isFinite(areaId) || areaId <= 0) {
      setInsuranceArea(String(district));
      return;
    }
    try {
      const res = await getAreaPropertyAPI({ area_id: areaId });
      setInsuranceArea(res.area_property?.area_name || String(district));
    } catch {
      setInsuranceArea(String(district));
    }
  }, []);

  /** 患者类型变化时刷新结算方式选项 */
  useEffect(() => {
    void loadSettleOptions(insuranceType);
  }, [insuranceType, loadSettleOptions]);

  /** 无就诊时按结算方式查医保状态；有就诊时改走 GetStatusProperty */
  useEffect(() => {
    if (hasVisitId || isSelfPaidType) {
      setServiceInfo(null);
      onSettleServiceInfoRef.current?.({
        settle_type:
          settleType == null || settleType === "" ? null : String(settleType),
        info: null,
      });
      return;
    }
    void loadServiceInfo(settleType);
  }, [hasVisitId, settleType, isSelfPaidType, loadServiceInfo]);

  /**
   * 初始化结算方式 / 患者类型：
   * - 有 visit_id → visit/GetStatusProperty
   * - 仅有 patient_id → patient/GetStatusProperty
   * 单独挂载时由此回填；嵌在 PatientInfo 内时与外层写入同一批字段（值一致）。
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (hasVisitId && visitId != null) {
        setStatusDistrict(null);
        setServiceLoading(true);
        try {
          const res = await getStatusPropertyAPI({
            visit_id: visitId,
            column_list: "*",
          });
          if (cancelled) return;
          const status =
            res.code === 0 ? (res.status_property ?? null) : null;
          setVisitStatus(status);
          applyStatusToForm(status);
        } catch {
          if (!cancelled) setVisitStatus(null);
        } finally {
          if (!cancelled) setServiceLoading(false);
        }
        return;
      }

      setVisitStatus(null);
      if (patientId == null || patientId <= 0) {
        setStatusDistrict(null);
        return;
      }

      try {
        const res = await getPatientStatusPropertyAPI({
          patient_id: Number(patientId),
          column_list: "*",
        });
        if (cancelled) return;
        const status =
          res.code === 0 ? (res.status_property ?? null) : null;
        setStatusDistrict(status?.insurance_district ?? null);
        applyStatusToForm(status);
      } catch {
        if (!cancelled) setStatusDistrict(null);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [hasVisitId, visitId, visitStatusNonce, patientId, applyStatusToForm]);

  /** 同步 insurance_name / settle_name 到隐藏字段 */
  useEffect(() => {
    if (!insuranceType) return;
    const name = insuranceOptions.find(
      (o) => o.value === String(insuranceType),
    )?.label;
    if (name && form.getFieldValue("insurance_name") !== name) {
      form.setFieldValue("insurance_name", name);
    }
  }, [insuranceType, insuranceOptions, form]);

  useEffect(() => {
    if (!settleType) return;
    const name = settleOptions.find((o) => o.value === String(settleType))
      ?.label;
    if (name && form.getFieldValue("settle_name") !== name) {
      form.setFieldValue("settle_name", name);
    }
  }, [settleType, settleOptions, form]);

  /** 参保地：有就诊取状态里的地区，否则优先入参 / 患者状态，再取结算服务带回的地区 */
  useEffect(() => {
    const district = hasVisitId
      ? visitStatus?.insurance_district
      : insuranceDistrict ||
        statusDistrict ||
        serviceInfo?.insurance_district ||
        null;
    void resolveAreaName(district);
  }, [
    hasVisitId,
    visitStatus?.insurance_district,
    insuranceDistrict,
    statusDistrict,
    serviceInfo?.insurance_district,
    resolveAreaName,
  ]);

  const handleSettleTypeChange = (value: string) => {
    const option = settleOptions.find((o) => o.value === value);
    form.setFieldsValue({
      settle_type: value,
      settle_name: option?.label,
    });
  };

  const shownStatus = hasVisitId ? visitStatus : serviceInfo;
  /** 登记号只在就诊维度、就诊有效且非自费时展示 status.handle_no */
  const showHandleNo = fromVisit && hasVisitId && !isSelfPaidType;

  const visibleSettleOptions = isSelfPaidType
    ? settleOptions.filter((o) => o.label === "自费" || o.value === "0")
    : settleOptions;

  return (
    <div className="border-t border-(--app-theme-border) pt-2">
      <div className="mb-2 text-center">
        <Tag color="processing">
          温馨提示：若需要自费转医保，请前往收费处操作
        </Tag>
      </div>
      <Form.Item name="insurance_name" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="settle_name" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="insurance_code" hidden>
        <Input />
      </Form.Item>
      {/* visit 维度把 insurance_no 留在表单里，保证保存带上 */}
      {fromVisit ? (
        <Form.Item name="insurance_no" hidden>
          <Input />
        </Form.Item>
      ) : null}

      <Form.Item
        label="患者类型"
        name="insurance_type"
        className="mb-1!"
        labelCol={{ flex: "72px" }}
        wrapperCol={{ flex: 1 }}
      >
        {insuranceOptions.length ? (
          <Radio.Group disabled options={insuranceOptions} />
        ) : (
          <Input disabled placeholder="患者类型" allowClear />
        )}
      </Form.Item>

      <Form.Item
        label="结算方式"
        name="settle_type"
        className="mb-2!"
        labelCol={{ flex: "72px" }}
        wrapperCol={{ flex: 1 }}
      >
        {visibleSettleOptions.length ? (
          <Radio.Group
            disabled={disabled}
            options={visibleSettleOptions}
            onChange={(e) => handleSettleTypeChange(String(e.target.value))}
          />
        ) : (
          <Input disabled={disabled} placeholder="结算方式" allowClear />
        )}
      </Form.Item>

      {!isSelfPaidType ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-block w-[72px] shrink-0 text-right text-(--app-theme-text-secondary, #666)">
            {statusLabel}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {serviceLoading ? (
              <Tag>加载中…</Tag>
            ) : (
              <>
                {shownStatus?.service_status ? (
                  <Tag color="warning">{shownStatus.service_status}</Tag>
                ) : null}
                {shownStatus?.service_name ? (
                  <Tag color="processing">{shownStatus.service_name}</Tag>
                ) : null}
                {shownStatus?.service_note ? (
                  <Tag>{shownStatus.service_note}</Tag>
                ) : null}
                {!shownStatus?.service_status &&
                !shownStatus?.service_name &&
                !shownStatus?.service_note ? (
                  <Tag>暂无</Tag>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {insuranceArea ? (
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block w-[72px] shrink-0 text-right text-(--app-theme-text-secondary, #666)">
            参保地：
          </span>
          <span>{insuranceArea}</span>
        </div>
      ) : null}

      {showHandleNo ? (
        <Form.Item
          label="登记号"
          className="mb-0!"
          labelCol={{ flex: "72px" }}
          wrapperCol={{ flex: 1 }}
        >
          <Input disabled value={visitStatus?.handle_no ?? ""} />
        </Form.Item>
      ) : null}
    </div>
  );
};

/** 有父表单时直接挂上；否则自建 Form，调用方不必再包一层。 */
const InsurancePanel: React.FC<InsurancePanelProps> = (props) => {
  const parentForm = Form.useFormInstance<InsuranceFormValues>();
  if (parentForm) {
    return <InsurancePanelBody {...props} />;
  }
  return (
    <Form>
      <InsurancePanelBody {...props} />
    </Form>
  );
};

export default InsurancePanel;
