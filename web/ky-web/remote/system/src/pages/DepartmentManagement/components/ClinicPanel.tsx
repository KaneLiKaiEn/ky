import { useSaveShortcut } from "@/hooks/useSaveShortcut";
import { assertResultWithHint, errorText } from "@/utils/result";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  deleteClinicDept,
  deleteEmergencyDept,
  getClinicDeptProperty,
  getEmergencyDeptProperty,
  saveClinicDeptProperty,
  saveEmergencyDeptProperty,
} from "@/api/schedule";
import type { ScheduledDeptRow } from "@/types/schedule";

interface ClinicPanelProps {
  orgId: number;
  deptId: number;
  deptName: string;
  disabled?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

type ClinicType = "ROUTINE" | "CLINIC" | "EMERGENCY";
type ScheduledType = Exclude<ClinicType, "ROUTINE">;
interface Scope {
  orgId: number;
  deptId: number;
}
interface ClinicValues {
  clinicType: ClinicType;
  dept_desc: string;
  dept_tag: string[];
  disease_tag: string[];
}
type Registration = Record<ScheduledType, ScheduledDeptRow | null>;

const SERVICES = {
  CLINIC: {
    name: "门诊",
    get: getClinicDeptProperty,
    save: saveClinicDeptProperty,
    remove: deleteClinicDept,
  },
  EMERGENCY: {
    name: "急诊",
    get: getEmergencyDeptProperty,
    save: saveEmergencyDeptProperty,
    remove: deleteEmergencyDept,
  },
} as const;
const EMPTY: ClinicValues = {
  clinicType: "ROUTINE",
  dept_desc: "",
  dept_tag: [],
  disease_tag: [],
};
const COMMON_TEXT_FIELDS = [
  "dept_no",
  "dept_code",
  "dept_name",
  "dept_tag",
  "dept_desc",
  "disease_tag",
  "sort_no",
  "kb_code",
  "input_time",
  "input_session",
  "input_note",
] as const;
const CLINIC_TEXT_FIELDS = ["gender_name", "marital_name", "age_unit"] as const;

function assertResult(
  response: unknown,
): asserts response is Record<string, unknown> {
  if (
    !response ||
    typeof response !== "object" ||
    Array.isArray(response) ||
    !("code" in response) ||
    typeof response.code !== "number"
  )
    throw new Error("接口返回结果无效，请重试");
  const result = response as Record<string, unknown>;
  assertResultWithHint({
    code: response.code,
    message: typeof result.message === "string" ? result.message : "操作失败",
    hint: typeof result.hint === "string" ? result.hint : undefined,
  });
}

function integerValue(value: unknown, name: string): number | null {
  if (value == null) return null;
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !/^-?\d+$/.test(value)) ||
    !Number.isSafeInteger(Number(value))
  )
    throw new Error(`${name}格式无效`);
  return Number(value);
}

/** Protobuf can omit an unregistered row or return an empty/null/zero-ID row. */
export function normalizeSchedulingProperty(
  response: unknown,
  scope: Scope,
): ScheduledDeptRow | null {
  assertResult(response);
  const value = response.dept_property;
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error("科室属性格式无效，请重试");
  const row = value as Record<string, unknown>;
  const deptId = integerValue(row.dept_id, "科室 ID");
  const orgId = integerValue(row.org_id, "机构 ID");
  if (orgId !== null && orgId !== scope.orgId)
    throw new Error("接口返回的机构与当前机构不一致，请重试");
  if (deptId !== null && deptId !== 0 && deptId !== scope.deptId)
    throw new Error("接口返回的科室与当前科室不一致，请重试");
  const normalized: ScheduledDeptRow = {};
  for (const field of [...COMMON_TEXT_FIELDS, ...CLINIC_TEXT_FIELDS]) {
    if (row[field] != null && typeof row[field] !== "string")
      throw new Error(`科室属性 ${field} 格式无效`);
    if (row[field] !== undefined)
      normalized[field] = row[field] as string | null;
  }
  for (const field of ["age_min", "age_max"] as const) {
    if (row[field] !== undefined)
      normalized[field] = integerValue(row[field], field);
  }
  if (deptId === null || deptId === 0) return null;
  normalized.dept_id = deptId;
  if (orgId !== null) normalized.org_id = orgId;
  return normalized;
}

function normalizeTags(values: string[] = []): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function parseTags(value?: string | null): string[] {
  return normalizeTags(
    [...(value || "").matchAll(/\[([^\]]*)\]/g)].map((match) => match[1]),
  );
}

function serializeTags(values: string[]): string {
  return normalizeTags(values)
    .map((value) => `[${value}]`)
    .join("");
}

export function normalizeClinicValues(values: ClinicValues): ClinicValues {
  return {
    clinicType: values.clinicType,
    dept_desc: values.dept_desc || "",
    dept_tag: normalizeTags(values.dept_tag),
    disease_tag: normalizeTags(values.disease_tag),
  };
}

function fingerprint(values: ClinicValues): string {
  return JSON.stringify(
    values.clinicType === "ROUTINE"
      ? { clinicType: "ROUTINE" }
      : normalizeClinicValues(values),
  );
}

/** Explicit protocol fields keep editor state and unknown response keys off the wire. */
export function buildSchedulingProperty(
  target: ScheduledDeptRow | null,
  values: ClinicValues,
  scope: Scope,
  deptName: string,
): ScheduledDeptRow {
  const result: ScheduledDeptRow = {};
  for (const field of COMMON_TEXT_FIELDS)
    if (target?.[field] !== undefined) result[field] = target[field];
  if (values.clinicType === "CLINIC") {
    for (const field of CLINIC_TEXT_FIELDS)
      if (target?.[field] !== undefined) result[field] = target[field];
    for (const field of ["age_min", "age_max"] as const)
      if (target?.[field] !== undefined) result[field] = target[field];
  }
  return {
    ...result,
    dept_id: scope.deptId,
    org_id: scope.orgId,
    dept_name: deptName,
    dept_desc: values.dept_desc,
    dept_tag: serializeTags(values.dept_tag),
    disease_tag: serializeTags(values.disease_tag),
  };
}

export function clinicInitialValues(registration: Registration): ClinicValues {
  const clinicType: ClinicType = registration.EMERGENCY
    ? "EMERGENCY"
    : registration.CLINIC
      ? "CLINIC"
      : "ROUTINE";
  const property = registration.EMERGENCY || registration.CLINIC;
  return {
    clinicType,
    dept_desc: property?.dept_desc || "",
    dept_tag: parseTags(property?.dept_tag),
    disease_tag: parseTags(property?.disease_tag),
  };
}

async function readRegistration(scope: Scope): Promise<Registration> {
  const [clinic, emergency] = await Promise.all([
    SERVICES.CLINIC.get({ dept_id: scope.deptId }),
    SERVICES.EMERGENCY.get({ dept_id: scope.deptId }),
  ]);
  return {
    CLINIC: normalizeSchedulingProperty(clinic, scope),
    EMERGENCY: normalizeSchedulingProperty(emergency, scope),
  };
}

export class ClinicSaveError extends Error {
  constructor(
    message: string,
    readonly partial: boolean,
  ) {
    super(message);
    this.name = "ClinicSaveError";
  }
}

class ExpiredClinicScope extends Error {}

/** Query, save, then clean up: each awaited step rechecks the captured editor scope. */
export async function saveClinicConfiguration(
  scope: Scope,
  draft: ClinicValues,
  deptName: string,
  isCurrent: () => boolean,
): Promise<void> {
  const ensureCurrent = () => {
    if (!isCurrent()) throw new ExpiredClinicScope();
  };
  let stage = "读取当前门急诊注册状态失败";
  let changed = false;
  try {
    ensureCurrent();
    const registration = await readRegistration(scope);
    ensureCurrent();
    if (draft.clinicType === "ROUTINE") {
      const failures: string[] = [];
      const removed: string[] = [];
      for (const kind of ["CLINIC", "EMERGENCY"] as const) {
        if (!registration[kind]) continue;
        ensureCurrent();
        try {
          assertResult(await SERVICES[kind].remove({ dept_id: scope.deptId }));
          ensureCurrent();
          changed = true;
          removed.push(SERVICES[kind].name);
        } catch (error) {
          ensureCurrent();
          failures.push(
            `${SERVICES[kind].name}分类清理未成功：${errorText(error)}`,
          );
        }
      }
      if (failures.length) {
        stage = removed.length
          ? `${removed.join("、")}分类已移除，常规类型尚未完整生效`
          : "常规类型尚未生效";
        throw new Error(failures.join("；"));
      }
    } else {
      const kind = draft.clinicType;
      const other: ScheduledType = kind === "CLINIC" ? "EMERGENCY" : "CLINIC";
      const property = buildSchedulingProperty(
        registration[kind],
        draft,
        scope,
        deptName,
      );
      stage = `${SERVICES[kind].name}属性保存失败`;
      ensureCurrent();
      assertResult(
        await SERVICES[kind].save({
          dept_id: scope.deptId,
          dept_property: property,
        }),
      );
      ensureCurrent();
      changed = true;
      if (registration[other]) {
        stage = `${SERVICES[kind].name}属性已保存，但${SERVICES[other].name}分类清理未成功，类型切换尚未完成`;
        ensureCurrent();
        assertResult(await SERVICES[other].remove({ dept_id: scope.deptId }));
        ensureCurrent();
      }
    }
  } catch (error) {
    if (error instanceof ExpiredClinicScope) throw error;
    throw new ClinicSaveError(`${stage}。${errorText(error)}`, changed);
  }
}

const tagRules = [
  {
    validator: (_: unknown, values?: string[]) => {
      const tags = normalizeTags(values);
      if (tags.length > 10)
        return Promise.reject(new Error("最多添加 10 个标签"));
      if (tags.some((value) => /[\[\]]/.test(value)))
        return Promise.reject(new Error("标签中不能包含方括号"));
      return Promise.resolve();
    },
  },
];

export default function ClinicPanel({
  orgId,
  deptId,
  deptName,
  disabled = false,
  onDirtyChange,
  onBusyChange,
}: ClinicPanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ClinicValues>();
  const [loading, setLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflicting, setConflicting] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [baseline, setBaseline] = useState(fingerprint(EMPTY));
  const [revision, setRevision] = useState(0);
  const epochRef = useRef(0);
  const savingRef = useRef(false);
  const callbacks = useRef({ onDirtyChange, onBusyChange });
  callbacks.current = { onDirtyChange, onBusyChange };
  const currentKey = `${orgId}:${deptId}`;
  const identityRef = useRef(currentKey);
  identityRef.current = currentKey;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const loaded = loadedKey === currentKey;
  const values = Form.useWatch((store) => store, { form, preserve: true }) as
    | ClinicValues
    | undefined;
  const selectedType = Form.useWatch("clinicType", form) ?? "ROUTINE";
  const validScope =
    Number.isSafeInteger(deptId) &&
    deptId > 0 &&
    Number.isSafeInteger(orgId) &&
    orgId > 0;

  useEffect(() => {
    const epoch = ++epochRef.current;
    const key = `${orgId}:${deptId}`;
    const isCurrent = () =>
      epoch === epochRef.current && key === identityRef.current;
    setLoadedKey(null);
    setLoadError(null);
    setSaveError(null);
    setConflicting(false);
    setIncomplete(false);
    setSaving(false);
    savingRef.current = false;
    callbacks.current.onDirtyChange(false);
    callbacks.current.onBusyChange(false);
    form.resetFields();
    if (!validScope) {
      setLoading(false);
      setLoadError("请先保存科室基本信息，再设置门急诊属性");
    } else {
      setLoading(true);
      void readRegistration({ orgId, deptId })
        .then((registration) => {
          if (!isCurrent()) return;
          const initial = clinicInitialValues(registration);
          form.setFieldsValue(initial);
          setBaseline(fingerprint(initial));
          setConflicting(
            Boolean(registration.CLINIC && registration.EMERGENCY),
          );
          setLoadedKey(key);
        })
        .catch((error: unknown) => {
          if (isCurrent()) setLoadError(errorText(error));
        })
        .finally(() => {
          if (isCurrent()) setLoading(false);
        });
    }
    return () => {
      ++epochRef.current;
      callbacks.current.onDirtyChange(false);
      callbacks.current.onBusyChange(false);
    };
  }, [orgId, deptId, revision, validScope, form]);

  useEffect(() => {
    if (loaded && values)
      callbacks.current.onDirtyChange(
        incomplete || fingerprint(values) !== baseline,
      );
  }, [values, baseline, loaded, incomplete]);

  const save = async (submitted: ClinicValues) => {
    if (
      disabledRef.current ||
      !loaded ||
      loading ||
      savingRef.current ||
      !validScope
    )
      return;
    const epoch = epochRef.current;
    const key = currentKey;
    const isCurrent = () =>
      epoch === epochRef.current && key === identityRef.current;
    const scope = { orgId, deptId };
    const draft = normalizeClinicValues(submitted);
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    callbacks.current.onBusyChange(true);
    try {
      // Every retry queries actual state, including cleanup that may have timed out.
      await saveClinicConfiguration(scope, draft, deptName, isCurrent);
      if (!isCurrent()) return;
      setBaseline(fingerprint(draft));
      setConflicting(false);
      setIncomplete(false);
      form.setFieldsValue(draft);
      callbacks.current.onDirtyChange(false);
      message.success("门急诊属性已保存");
    } catch (error) {
      if (!isCurrent()) return;
      if (error instanceof ClinicSaveError && error.partial)
        setIncomplete(true);
      callbacks.current.onDirtyChange(true);
      setSaveError(
        `${errorText(error)}。当前草稿已保留，请点击保存重试；重试会重新核对实际状态。`,
      );
    } finally {
      if (isCurrent()) {
        savingRef.current = false;
        setSaving(false);
        callbacks.current.onBusyChange(false);
      }
    }
  };

  useSaveShortcut(() => form.submit(), !disabled && loaded && !loading && !saving);

  return (
    <Spin spinning={loading}>
      {loadError && (
        <Alert
          showIcon
          type="error"
          title="门急诊属性加载失败"
          description={loadError}
          className="department-form__notice"
          action={
            <Button
              disabled={disabled || saving || !validScope}
              onClick={() => setRevision((value) => value + 1)}
            >
              重试
            </Button>
          }
        />
      )}
      <Form
        form={form}
        initialValues={EMPTY}
        className="department-form"
        layout="horizontal"
        colon={false}
        labelAlign="right"
        labelCol={{ flex: "112px" }}
        wrapperCol={{ flex: "auto" }}
        disabled={disabled || !loaded || saving}
        onFinish={save}
        scrollToFirstError
        onValuesChange={(changed) => {
          for (const field of ["dept_tag", "disease_tag"] as const)
            if (changed[field])
              form.setFieldValue(field, normalizeTags(changed[field]));
        }}
      >
        <Divider titlePlacement="start" className="department-form__section">
          门急诊设置
        </Divider>
        {saveError && (
          <Alert
            showIcon
            type="error"
            title="保存未完成"
            description={saveError}
            className="department-form__notice"
          />
        )}
        {conflicting && !saveError && (
          <Alert
            showIcon
            type="warning"
            title="当前科室同时存在门诊与急诊配置"
            description="已优先显示急诊属性。请选择需要保留的类型并保存，系统会移除另一类型的配置。"
            className="department-form__notice"
          />
        )}
        <Form.Item name="clinicType" label="就诊类型">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: "ROUTINE", label: "常规" },
              { value: "CLINIC", label: "门诊" },
              { value: "EMERGENCY", label: "急诊" },
            ]}
          />
        </Form.Item>
        {selectedType === "ROUTINE" ? (
          <Alert
            type="info"
            showIcon
            title="常规科室不启用门急诊属性"
            description="保存为常规类型后，将移除该科室已有的门诊和急诊配置。"
            className="department-form__notice"
          />
        ) : (
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item name="dept_desc" label="科室简介">
                <Input.TextArea
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  placeholder="请输入科室简介"
                />
              </Form.Item>
            </Col>
            <Col xs={24} xl={12}>
              <Form.Item
                name="dept_tag"
                label="科室标识"
                rules={tagRules}
                extra="输入后按空格或回车添加，最多 10 个"
              >
                <Select
                  mode="tags"
                  maxCount={10}
                  allowClear
                  open={false}
                  tokenSeparators={[" ", ",", "，", "\n", "\t"]}
                  placeholder="添加科室标识"
                />
              </Form.Item>
            </Col>
            <Col xs={24} xl={12}>
              <Form.Item
                name="disease_tag"
                label="擅长疾病标签"
                rules={tagRules}
                extra="输入后按空格或回车添加，最多 10 个"
              >
                <Select
                  mode="tags"
                  maxCount={10}
                  allowClear
                  open={false}
                  tokenSeparators={[" ", ",", "，", "\n", "\t"]}
                  placeholder="添加擅长疾病标签"
                />
              </Form.Item>
            </Col>
          </Row>
        )}
        <div className="department-form__actions">
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存门急诊属性
            </Button>
            <Button
              onClick={() => setRevision((value) => value + 1)}
              title="重新读取实际配置并丢弃当前草稿，已保存的配置不会回退"
            >
              重置修改
            </Button>
            <Typography.Text type="secondary">
              Alt + Enter 快速保存
            </Typography.Text>
          </Space>
        </div>
      </Form>
    </Spin>
  );
}
