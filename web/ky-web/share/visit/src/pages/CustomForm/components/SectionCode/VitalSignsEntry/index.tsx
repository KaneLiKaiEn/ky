import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Form, Input, InputNumber, Select, Space, Spin, Typography, message } from "antd";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { deleteObserve, getObserveList, newObserve } from "@/api/observe";
import { getVisitPropertyAPI } from "@/api/visit";
import type { ObserveRow } from "@/types/observe";
import type { SectionCodeProps, SectionCodeRef } from "../types";
import {
  DEFAULT_TEMP_METHOD,
  FIXED_VITAL_COLUMNS,
  OBSERVE_TAG,
  RECORD_MINUTE_FORMAT,
  TEMP_TYPE_OPTIONS,
  isNumericVital,
} from "./columns";
const toTrimmed = (raw: unknown): string => {
  if (raw === undefined || raw === null || raw === "") return "";
  return String(raw).trim();
};

const isSameObserveMinute = (observeTime?: string, recordTime?: string) => {
  if (!observeTime || !recordTime) return false;
  const observe = dayjs(observeTime);
  const record = dayjs(recordTime);
  if (!observe.isValid() || !record.isValid()) return false;
  return (
    observe.format(RECORD_MINUTE_FORMAT) === record.format(RECORD_MINUTE_FORMAT)
  );
};

/** 体温单体征录入：时间跟病历头。新建走 NewObserve；已有记录先 DeleteObserve，仍有值再 NewObserve。observe_tag=[体温单] */
const VitalSignsEntry = forwardRef<SectionCodeRef, SectionCodeProps>(
  function VitalSignsEntry(
    { visit_id, baby_id, section, recordTime },
    ref,
  ) {
    const sectionTitle = section.section_title ?? section.section_name;
    const [form] = Form.useForm<Record<string, unknown>>();
    const [loading, setLoading] = useState(false);
    const [orgId, setOrgId] = useState<number>();
    const [patientId, setPatientId] = useState<number>();
    const [observes, setObserves] = useState<Record<string, ObserveRow>>({});
    const [tempMethod, setTempMethod] = useState(DEFAULT_TEMP_METHOD);

    const dirtyRef = useRef(false);
    const loadSeqRef = useRef(0);
    const recordTimeRef = useRef(recordTime);
    const visitIdRef = useRef(visit_id);
    const babyIdRef = useRef(baby_id);
    const orgIdRef = useRef(orgId);
    const patientIdRef = useRef(patientId);
    const observesRef = useRef(observes);
    const tempMethodRef = useRef(tempMethod);

    recordTimeRef.current = recordTime;
    visitIdRef.current = visit_id;
    babyIdRef.current = baby_id;
    orgIdRef.current = orgId;
    patientIdRef.current = patientId;
    observesRef.current = observes;
    tempMethodRef.current = tempMethod;

    const markDirty = useCallback(() => {
      dirtyRef.current = true;
    }, []);

    const loadObserves = useCallback(async () => {
      const currentVisitId = visitIdRef.current;
      const currentRecordTime = recordTimeRef.current;
      if (!currentVisitId || !currentRecordTime) return;

      const start = dayjs(currentRecordTime);
      if (!start.isValid()) return;

      const seq = ++loadSeqRef.current;
      setLoading(true);
      try {
        const res = await getObserveList({
          visit_id: currentVisitId,
          baby_id: babyIdRef.current,
          observe_tag: OBSERVE_TAG,
          observe_time_list: [currentRecordTime],
          observe_start: start.format("YYYY-MM-DD HH:mm:ss"),
          observe_end: start.second(59).format("YYYY-MM-DD HH:mm:ss"),
        });
        if (seq !== loadSeqRef.current) return;
        if (dirtyRef.current) return;
        if (res?.code !== 0) {
          message.error(
            `${res?.message || "获取体征失败"}${res?.hint ? `（${res.hint}）` : ""}`,
          );
          return;
        }

        const map: Record<string, ObserveRow> = {};
        const values: Record<string, string> = {};
        let method = DEFAULT_TEMP_METHOD;

        (res.row_list ?? []).forEach((obs) => {
          if (!obs.elem_name || !isSameObserveMinute(obs.observe_time, currentRecordTime)) {
            return;
          }
          map[obs.elem_name] = obs;
          values[obs.elem_name] = obs.observe_value ?? "";
          if (obs.elem_name === "体温") {
            method = obs.observe_method || DEFAULT_TEMP_METHOD;
          }
        });

        setObserves(map);
        setTempMethod(method);
        form.resetFields();
        form.setFieldsValue(values);
        dirtyRef.current = false;
      } catch {
        if (seq === loadSeqRef.current && !dirtyRef.current) {
          message.error("获取体征失败");
        }
      } finally {
        if (seq === loadSeqRef.current) setLoading(false);
      }
    }, [form]);

    useEffect(() => {
      let cancelled = false;

      const loadContext = async () => {
        if (!visit_id) {
          setPatientId(undefined);
          return;
        }
        const sessionId = getSessionId();
        try {
          const [sessionRes, visitRes] = await Promise.all([
            sessionId
              ? getSessionInfo({ session_id: sessionId })
              : Promise.resolve(null),
            getVisitPropertyAPI({
              visit_id,
              column_visit: "*",
              column_patient: "*",
            }),
          ]);
          if (cancelled) return;

          const nextOrgId =
            sessionRes?.session_info?.org_id ??
            visitRes.visit_property?.org_id ??
            undefined;
          setOrgId(nextOrgId);
          setPatientId(
            visitRes.visit_property?.patient_id ??
              visitRes.patient_property?.patient_id ??
              undefined,
          );
        } catch {
          if (!cancelled) {
            setOrgId(undefined);
            setPatientId(undefined);
          }
        }
      };

      void loadContext();
      return () => {
        cancelled = true;
      };
    }, [visit_id]);

    useEffect(() => {
      if (!visit_id || !recordTime) {
        setObserves({});
        form.resetFields();
        setTempMethod(DEFAULT_TEMP_METHOD);
        dirtyRef.current = false;
        return;
      }
      if (dirtyRef.current) return;
      void loadObserves();
    }, [visit_id, baby_id, recordTime, form, loadObserves]);

    const saveSection = useCallback(async () => {
      const currentVisitId = visitIdRef.current;
      const observeTime = recordTimeRef.current;
      if (!currentVisitId || !observeTime) return;

      const values = form.getFieldsValue();
      const currentObserves = observesRef.current;
      const currentTempMethod = tempMethodRef.current;
      const nextObserves: Record<string, ObserveRow> = { ...currentObserves };
      const errors: string[] = [];

      for (const col of FIXED_VITAL_COLUMNS) {
        const trimmed = toTrimmed(values[col.elem_name]);
        const existing = currentObserves[col.elem_name];
        if (!trimmed && !existing?.observe_id) continue;

        const storedValue = existing?.observe_value || "";
        const storedMethod = existing?.observe_method ?? DEFAULT_TEMP_METHOD;
        if (col.elem_name === "体温") {
          if (trimmed === storedValue && currentTempMethod === storedMethod) {
            continue;
          }
        } else if (trimmed === storedValue) {
          continue;
        }

        let deleted = false;
        try {
          if (existing?.observe_id) {
            const delRes = await deleteObserve({
              observe_id: existing.observe_id,
            });
            if (delRes?.code !== 0) {
              errors.push(
                `${col.elem_name}${delRes?.message || "删除失败"}${
                  delRes?.hint ? `（${delRes.hint}）` : ""
                }`,
              );
              continue;
            }
            deleted = true;
            if (!trimmed) {
              delete nextObserves[col.elem_name];
              continue;
            }
          } else if (!trimmed) {
            continue;
          }

          const res = await newObserve({
            visit_id: currentVisitId,
            baby_id: babyIdRef.current,
            patient_id: patientIdRef.current,
            org_id: orgIdRef.current,
            elem_name: col.elem_name,
            elem_unit: col.item_unit,
            observe_value: trimmed,
            observe_time: observeTime,
            observe_tag: OBSERVE_TAG,
            ...(col.elem_name === "体温"
              ? { observe_method: currentTempMethod }
              : {}),
          });
          if (res?.code !== 0) {
            if (deleted) delete nextObserves[col.elem_name];
            errors.push(
              `${col.elem_name}${res?.message || "保存失败"}${
                res?.hint ? `（${res.hint}）` : ""
              }`,
            );
            continue;
          }
          nextObserves[col.elem_name] = {
            observe_id: res.observe_id,
            visit_id: currentVisitId,
            baby_id: babyIdRef.current,
            patient_id: patientIdRef.current,
            org_id: orgIdRef.current,
            elem_name: col.elem_name,
            elem_unit: col.item_unit,
            observe_value: trimmed,
            observe_time: observeTime,
            observe_tag: OBSERVE_TAG,
            ...(col.elem_name === "体温"
              ? { observe_method: currentTempMethod }
              : {}),
          };
        } catch {
          if (deleted) delete nextObserves[col.elem_name];
          errors.push(`${col.elem_name}保存失败`);
        }
      }

      setObserves(nextObserves);
      observesRef.current = nextObserves;
      if (errors.length) {
        throw new Error(errors.join("；"));
      }
      dirtyRef.current = false;
    }, [form]);

    useImperativeHandle(
      ref,
      () => ({
        getSectionValue: () => [],
        initSectionValue: () => {
          dirtyRef.current = false;
          void loadObserves();
        },
        saveSection,
      }),
      [loadObserves, saveSection],
    );

    const hasTitle = Boolean(sectionTitle?.trim());

    return (
      <Spin spinning={loading}>
        <div>
          {hasTitle ? (
            <div className="mb-2 flex items-center">
              <div className="mr-2 h-[18px] w-1 rounded bg-[#1677ff]" />
              <Typography.Text strong>{sectionTitle}</Typography.Text>
            </div>
          ) : null}
          {recordTime ? (
            <Typography.Text type="secondary" className="mb-2 block text-xs">
              记录时间：{recordTime}
            </Typography.Text>
          ) : null}
          <Form
            form={form}
            size="small"
            layout="vertical"
            requiredMark={false}
            onValuesChange={markDirty}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
                gap: "8px 12px",
                alignContent: "start",
                alignItems: "start",
              }}
            >
              {FIXED_VITAL_COLUMNS.map((col) => {
                const label = col.item_unit
                  ? `${col.elem_name}(${col.item_unit})`
                  : col.elem_name;

                if (col.elem_name === "体温") {
                  return (
                    <Form.Item
                      key={col.elem_name}
                      label={label}
                      className="mb-0! w-full min-w-0"
                    >
                      <Space.Compact className="w-full">
                        <Form.Item name={col.elem_name} noStyle>
                          <InputNumber
                            min={34}
                            max={42}
                            step={0.1}
                            precision={1}
                            controls={false}
                            style={{ width: "calc(100% - 72px)" }}
                          />
                        </Form.Item>
                        <Select
                          value={tempMethod}
                          onChange={(value) => {
                            setTempMethod(value);
                            markDirty();
                          }}
                          options={TEMP_TYPE_OPTIONS}
                          title="体温测量方式"
                          style={{ width: 72 }}
                        />
                      </Space.Compact>
                    </Form.Item>
                  );
                }

                return (
                  <Form.Item
                    key={col.elem_name}
                    label={label}
                    name={col.elem_name}
                    className="mb-0! w-full min-w-0"
                  >
                    {isNumericVital(col.elem_name) ? (
                      <InputNumber
                        min={0}
                        max={300}
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <Input allowClear />
                    )}
                  </Form.Item>
                );
              })}
            </div>
          </Form>
        </div>
      </Spin>
    );
  },
);

export default VitalSignsEntry;
