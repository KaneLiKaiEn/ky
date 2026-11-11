import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { DatePicker, Form, Input, Modal, Select, Spin, message } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import debounce from "lodash/debounce";
import CustomForm from "@/pages/CustomForm";
import CarePlanProblem from "@/pages/CarePlanProblem";
import EmrDiscuss from "@/pages/EmrDiscuss";
import DoctorProblemModal from "./DoctorProblemModal";
import ProblemAssessModal from "./ProblemAssessModal";
import type { ProblemAssessSource } from "./ProblemAssessModal";
import type { EmrDiscussRef } from "@/pages/EmrDiscuss";
import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import type {
  AssessResult,
  FormProperty,
  FormRef,
} from "@/pages/CustomForm/components/Form/types";
import {
  attachEmrStakeholder,
  commitEmr,
  createEmr,
  detachEmrStakeholder,
  getEmrElemList,
  getEmrInit,
  getEmrProperty,
  getEmrStakeholderList,
  saveEmr,
} from "@/api/emr";
import { getSessionInfo } from "@/api/auth";
import { getProblemList } from "@/api/clinic";
import { getCareProblemList } from "@/api/careProblem";
import { getFormProperty } from "@/api/form";
import { getUserList2, retrieveUserList } from "@/api/user";
import type { EmrRow, EmrStakeholderRow, VisitValueRow } from "@/types/emr";
import type { SheetRow } from "@/types/form";
import type { UserRow } from "@/types/user";
import { getSessionId, setActiveId } from "comm/session";

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";
const RECORD_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
const SUPERIOR_DOCTOR_TYPE = "上级医师";

const normalizeProblemType = (value?: string) =>
  (value ?? "").replace(/\[|\]/g, "").toUpperCase();

interface DoctorProblemParams {
  visit_id: number;
  item_id: number;
  item_name?: string;
}

interface ProblemAssessParams {
  source: ProblemAssessSource;
  problem_id: number;
  assess_score: number;
  assess_total?: number;
  assess_result?: string;
  assess_color?: string;
}

const findOpenProblem = <
  T extends { item_id?: number; end_time?: string; problem_id?: number },
>(
  rows: T[] | undefined,
  itemId: number,
) =>
  rows?.find(
    (row) => Number(row.item_id) === itemId && !(row.end_time ?? "").trim(),
  );

interface EmrHeaderValues {
  emr_time?: Dayjs | null;
  emr_title?: string;
}

type SuperiorDoctor = Pick<
  UserRow,
  "user_id" | "user_name" | "dept_id" | "dept_name"
> & {
  user_id: number;
};

export interface EmrEditProps {
  emr_id?: number;

  visit_id?: number;
  baby_id?: number;
  encounter_id?: number;
  form_id?: number;
  form_version?: number;
  form_values?: ElemValue[];

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  emr_time?: string;
  emr_title?: string;
}

export interface EmrEditRef {
  /** @returns 保存成功时返回 emr_id，失败时返回 undefined */
  save: () => Promise<number | undefined>;
  /** @returns 是否提交成功 */
  commit: () => Promise<boolean>;
  /** 先保存再提交；@returns 保存成功时返回 emr_id，失败时返回 undefined */
  saveAndCommit: () => Promise<number | undefined>;
}

const parseDateTime = (value?: string): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const toElemValues = (rows: VisitValueRow[]): ElemValue[] =>
  rows
    .filter(
      (row): row is VisitValueRow & Pick<ElemValue, "section_id"> =>
        row.section_id != null &&
        (row.elem_id != null || !!(row.elem_name && row.elem_name.trim())),
    )
    .map((row) => ({
      ...row,
      section_id: row.section_id!,
      elem_id: row.elem_id,
      elem_name: row.elem_name,
      value_text: row.value_text ?? "",
    }));

const toAssessProperty = (assess?: AssessResult): Partial<EmrRow> => {
  if (!assess?.assess_total) return {};
  const { assess_next, ...property } = assess;
  return {
    ...property,
    ...(assess_next != null
      ? {
          assess_next: dayjs()
            .add(assess_next, "hour")
            .format(DATETIME_FORMAT),
        }
      : {}),
  };
};

const toSuperiorDoctor = (
  user: UserRow | EmrStakeholderRow,
): SuperiorDoctor | undefined => {
  if (user.user_id == null) return undefined;
  return {
    user_id: user.user_id,
    user_name: user.user_name,
    dept_id: user.dept_id,
    dept_name: user.dept_name,
  };
};

const EmrEdit = forwardRef<EmrEditRef, EmrEditProps>(function EmrEdit(
  {
    emr_id,

    visit_id,
    baby_id,
    encounter_id,
    form_id,
    form_version,
    form_values,

    link_name,
    link_value,
    link_data,
    link_tag,
    link_ext,

    emr_time,
    emr_title,
  },
  ref,
) {
  const formRef = useRef<FormRef>(null);
  const discussRef = useRef<EmrDiscussRef>(null);
  const [headerForm] = Form.useForm<EmrHeaderValues>();
  const watchedEmrTime = Form.useWatch("emr_time", headerForm);
  const recordTime = watchedEmrTime?.isValid()
    ? watchedEmrTime.second(0).millisecond(0).format(RECORD_TIME_FORMAT)
    : undefined;
  const [initializing, setInitializing] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sheetProperty, setSheetProperty] = useState<SheetRow | undefined>(
    undefined,
  );
  const [emrProperty, setEmrProperty] = useState<EmrRow | undefined>(undefined);
  const [formValues, setFormValues] = useState<ElemValue[]>([]);
  const [currentEmrId, setCurrentEmrId] = useState(emr_id);
  const [initialSuperiorStakeholder, setInitialSuperiorStakeholder] =
    useState<EmrStakeholderRow>();
  const [superiorDoctor, setSuperiorDoctor] = useState<SuperiorDoctor>();
  const [doctorOptions, setDoctorOptions] = useState<SuperiorDoctor[]>([]);
  const [doctorSearching, setDoctorSearching] = useState(false);
  const doctorSearchSeqRef = useRef(0);
  const [nurseProblemOpen, setNurseProblemOpen] = useState(false);
  const [nurseProblemItemId, setNurseProblemItemId] = useState<number>();
  const nurseProblemResolveRef = useRef<(() => void) | null>(null);
  const [doctorProblemOpen, setDoctorProblemOpen] = useState(false);
  const [doctorProblemParams, setDoctorProblemParams] =
    useState<DoctorProblemParams>();
  const doctorProblemResolveRef = useRef<(() => void) | null>(null);
  const [problemAssessOpen, setProblemAssessOpen] = useState(false);
  const [problemAssessParams, setProblemAssessParams] =
    useState<ProblemAssessParams>();
  const problemAssessResolveRef = useRef<(() => void) | null>(null);
  const sessionDeptIdRef = useRef<number | undefined>(undefined);
  const isEditMode = Boolean(currentEmrId);
  const shouldInitOnReady =
    !isEditMode && (form_values?.length ?? 0) === 0;

  const formProp = useMemo<FormProperty | null>(() => {
    if (isEditMode) {
      if (!emrProperty?.form_id || !emrProperty?.visit_id) return null;
      return {
        form_id: emrProperty.form_id,
        form_version: emrProperty.form_version,
        visit_id: emrProperty.visit_id,
        baby_id: emrProperty.baby_id,
        emr_id: currentEmrId,
      };
    }
    if (!form_id || !visit_id) return null;
    return { form_id, form_version, visit_id, baby_id, emr_id: currentEmrId };
  }, [baby_id, currentEmrId, emrProperty, form_id, form_version, isEditMode, visit_id]);

  const docName = emrProperty?.doc_name ?? sheetProperty?.doc_name;
  const isDiscussRecord = docName?.includes("讨论记录");
  const canSave =
    !initializing &&
    !loadFailed &&
    formProp !== null &&
    (!isEditMode || emrProperty !== undefined);

  const applyDoctorList = (userList: UserRow[] | undefined) => {
    const doctorMap = new Map<number, SuperiorDoctor>();
    if (superiorDoctor) {
      doctorMap.set(superiorDoctor.user_id, superiorDoctor);
    }
    (userList ?? []).forEach((user) => {
      const doctor = toSuperiorDoctor(user);
      if (doctor) doctorMap.set(doctor.user_id, doctor);
    });
    setDoctorOptions(Array.from(doctorMap.values()));
  };

  const resolveSessionDeptId = async () => {
    if (sessionDeptIdRef.current != null && sessionDeptIdRef.current > 0) {
      return sessionDeptIdRef.current;
    }
    const sessionRes = await getSessionInfo({
      session_id: getSessionId() ?? "",
    });
    if (sessionRes.code !== 0) {
      throw new Error(sessionRes.message || "获取会话信息失败");
    }
    const deptId = sessionRes.session_info?.dept_id;
    if (deptId == null || deptId <= 0) {
      throw new Error("当前会话缺少科室信息");
    }
    sessionDeptIdRef.current = deptId;
    return deptId;
  };

  const loadDefaultDoctors = async () => {
    const seq = ++doctorSearchSeqRef.current;
    setDoctorSearching(true);
    try {
      const deptId = await resolveSessionDeptId();
      if (seq !== doctorSearchSeqRef.current) return;
      const res = await getUserList2({
        work_type: "DOCTOR",
        dept_id_list: [deptId],
      });
      if (seq !== doctorSearchSeqRef.current) return;
      if (res.code !== 0) {
        throw new Error(res.message || "上级医师查询失败");
      }
      applyDoctorList(res.user_list);
    } catch (error) {
      if (seq !== doctorSearchSeqRef.current) return;
      message.error(
        error instanceof Error ? error.message : "上级医师查询失败",
      );
    } finally {
      if (seq === doctorSearchSeqRef.current) setDoctorSearching(false);
    }
  };

  const searchSuperiorDoctors = async (input: string) => {
    const seq = ++doctorSearchSeqRef.current;
    setDoctorSearching(true);
    try {
      const res = await retrieveUserList({
        retrieve_input: input.trim(),
        retrieve_limit: 20,
        work_type: "DOCTOR",
      });
      if (seq !== doctorSearchSeqRef.current) return;
      if (res.code !== 0) {
        throw new Error(res.message || "上级医师查询失败");
      }
      applyDoctorList(res.user_list);
    } catch (error) {
      if (seq !== doctorSearchSeqRef.current) return;
      message.error(
        error instanceof Error ? error.message : "上级医师查询失败",
      );
    } finally {
      if (seq === doctorSearchSeqRef.current) setDoctorSearching(false);
    }
  };

  const loadDefaultDoctorsRef = useRef(loadDefaultDoctors);
  loadDefaultDoctorsRef.current = loadDefaultDoctors;
  const searchSuperiorDoctorsRef = useRef(searchSuperiorDoctors);
  searchSuperiorDoctorsRef.current = searchSuperiorDoctors;

  const handleDoctorSearch = useMemo(
    () =>
      debounce((input: string) => {
        if (!input.trim()) {
          void loadDefaultDoctorsRef.current();
          return;
        }
        void searchSuperiorDoctorsRef.current(input);
      }, 300),
    [],
  );

  const syncSuperiorDoctor = async (editingEmrId: number) => {
    const initialUserId = initialSuperiorStakeholder?.user_id;
    const selectedUserId = superiorDoctor?.user_id;
    if (initialUserId === selectedUserId) return;

    if (initialSuperiorStakeholder) {
      if (!initialSuperiorStakeholder.stakeholder_id) {
        throw new Error("缺少上级医师相关人 ID，无法移除");
      }
      const detachRes = await detachEmrStakeholder({
        stakeholder_id: initialSuperiorStakeholder.stakeholder_id,
      });
      if (detachRes.code !== 0) {
        throw new Error(detachRes.message || "移除上级医师失败");
      }
      setInitialSuperiorStakeholder(undefined);
    }

    if (!superiorDoctor) return;

    const attachRes = await attachEmrStakeholder({
      emr_id: editingEmrId,
      stakeholder_type: SUPERIOR_DOCTOR_TYPE,
      user_id: superiorDoctor.user_id,
      user_name: superiorDoctor.user_name,
    });
    if (attachRes.code !== 0) {
      throw new Error(attachRes.message || "添加上级医师失败");
    }

    setInitialSuperiorStakeholder({
      ...superiorDoctor,
      emr_id: editingEmrId,
      stakeholder_id: attachRes.stakeholder_id,
      stakeholder_type: SUPERIOR_DOCTOR_TYPE,
    });
  };

  const handleSave = async (options?: {
    silent?: boolean;
  }): Promise<number | undefined> => {
    if (!canSave) {
      message.error("病历尚未加载完成，无法保存");
      return undefined;
    }
    const values = await headerForm.validateFields();
    if (!formProp) {
      message.error("病历表单信息尚未加载完成");
      return undefined;
    }

    const assessProperty = toAssessProperty(
      isDiscussRecord ? undefined : formRef.current?.getFormAssess(),
    );
    const discussData = isDiscussRecord
      ? discussRef.current?.getDiscussData()
      : undefined;
    const emr_property: EmrRow = {
      ...(isEditMode ? emrProperty : {}),
      ...formProp,
      emr_time: values.emr_time
        ? values.emr_time.format(DATETIME_FORMAT)
        : dayjs().format(DATETIME_FORMAT),
      emr_title: values.emr_title,
      ...assessProperty,
      ...discussData?.emr_property,
    };
    const contentData = discussData
      ? {
          discuss_list: discussData.discuss_list,
          discuss_user_list: discussData.discuss_user_list,
        }
      : { elem_list: formRef.current?.getFormValues() ?? [] };
    const stakeholderList: EmrStakeholderRow[] = superiorDoctor
      ? [
          {
            stakeholder_type: SUPERIOR_DOCTOR_TYPE,
            ...superiorDoctor,
          },
        ]
      : [];

    try {
      if (!isDiscussRecord) {
        await formRef.current?.saveFormExtras();
      }
      let editingEmrId = currentEmrId;
      const res = editingEmrId
        ? await saveEmr({
            emr_id: editingEmrId,
            emr_property,
            ...contentData,
          })
        : await createEmr({
            ...formProp,
            encounter_id,
            link_name,
            link_value,
            link_data,
            link_tag,
            link_ext,
            emr_property,
            ...contentData,
            stakeholder_list: stakeholderList,
          });
      if (res.code !== 0) {
        message.error(res.message || "保存失败");
        return undefined;
      }

      if (editingEmrId) {
        await syncSuperiorDoctor(editingEmrId);
      } else {
        const createdEmrId = "emr_id" in res ? res.emr_id : undefined;
        if (!createdEmrId) {
          message.error("创建成功，但未返回病历 ID");
          return undefined;
        }
        setCurrentEmrId(createdEmrId);
        setActiveId({
          key: "active_emr_id",
          value: String(createdEmrId),
        });
        editingEmrId = createdEmrId;
      }
      if (!options?.silent) message.success("保存成功");
      return editingEmrId;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "保存失败，请稍后重试",
      );
      return undefined;
    }
  };

  const closeNurseProblemModal = () => {
    setNurseProblemOpen(false);
    nurseProblemResolveRef.current?.();
    nurseProblemResolveRef.current = null;
  };

  const closeDoctorProblemModal = () => {
    setDoctorProblemOpen(false);
    doctorProblemResolveRef.current?.();
    doctorProblemResolveRef.current = null;
  };

  const closeProblemAssessModal = () => {
    setProblemAssessOpen(false);
    problemAssessResolveRef.current?.();
    problemAssessResolveRef.current = null;
  };

  const promptNurseProblem = (itemId: number) =>
    new Promise<void>((resolve) => {
      nurseProblemResolveRef.current = resolve;
      setNurseProblemItemId(itemId);
      setNurseProblemOpen(true);
    });

  const promptDoctorProblem = (params: DoctorProblemParams) =>
    new Promise<void>((resolve) => {
      doctorProblemResolveRef.current = resolve;
      setDoctorProblemParams(params);
      setDoctorProblemOpen(true);
    });

  const promptProblemAssess = (params: ProblemAssessParams) =>
    new Promise<void>((resolve) => {
      problemAssessResolveRef.current = resolve;
      setProblemAssessParams(params);
      setProblemAssessOpen(true);
    });

  const toAssessParams = (
    source: ProblemAssessSource,
    problemId: number,
    assess: AssessResult,
  ): ProblemAssessParams => ({
    source,
    problem_id: problemId,
    assess_score: assess.assess_score,
    assess_total: assess.assess_total,
    assess_result: assess.assess_result,
    assess_color: assess.assess_color,
  });

  const registerAssessProblem = async () => {
    const assess = formRef.current?.getFormAssess();
    const itemId = Number(assess?.problem_id) || 0;
    if (!assess || itemId <= 0) return;

    const visitId = formProp?.visit_id ?? visit_id ?? emrProperty?.visit_id ?? 0;
    if (!visitId) return;

    const problemType = normalizeProblemType(assess.problem_type);
    const babyId = formProp?.baby_id ?? baby_id;

    if (problemType === "DOCTOR") {
      try {
        const res = await getProblemList({ visit_id: visitId });
        if (res.code !== 0) {
          message.error(res.message || "获取患者问题失败");
          return;
        }
        const matched = findOpenProblem(res.row_list, itemId);
        const matchedProblemId = Number(matched?.problem_id) || 0;
        if (matchedProblemId > 0) {
          await promptProblemAssess(
            toAssessParams("DOCTOR", matchedProblemId, assess),
          );
          return;
        }
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "获取患者问题失败",
        );
        return;
      }
      await promptDoctorProblem({
        visit_id: visitId,
        item_id: itemId,
        item_name: assess.problem_name,
      });
      return;
    }

    if (problemType === "NURSE") {
      try {
        const res = await getCareProblemList({
          visit_id: visitId,
          ...(babyId ? { baby_id: babyId } : {}),
        });
        if (res.code !== 0) {
          message.error(res.message || "获取护理问题失败");
          return;
        }
        const matched = findOpenProblem(res.row_list, itemId);
        const matchedProblemId = Number(matched?.problem_id) || 0;
        if (matchedProblemId > 0) {
          await promptProblemAssess(
            toAssessParams("NURSE", matchedProblemId, assess),
          );
          return;
        }
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "获取护理问题失败",
        );
        return;
      }
      await promptNurseProblem(itemId);
    }
  };

  const handleCommit = async (
    emrId?: number,
    options?: { silent?: boolean },
  ): Promise<boolean> => {
    const targetEmrId = emrId ?? currentEmrId;
    if (!targetEmrId) {
      message.error("缺少病历 ID，无法提交");
      return false;
    }

    try {
      const res = await commitEmr({ emr_id: targetEmrId, wait_doc: true });
      if (res.code !== 0) {
        message.error(res.message || "提交失败");
        return false;
      }
      await registerAssessProblem();
      if (!options?.silent) message.success("提交成功");
      return true;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "提交失败，请稍后重试",
      );
      return false;
    }
  };

  const handleSaveAndCommit = async (): Promise<number | undefined> => {
    const emrId = await handleSave({ silent: true });
    if (!emrId) return undefined;
    const ok = await handleCommit(emrId, { silent: true });
    if (ok) message.success("保存并提交成功");
    return ok ? emrId : undefined;
  };

  useImperativeHandle(ref, () => ({
    save: () => handleSave(),
    commit: () => handleCommit(),
    saveAndCommit: handleSaveAndCommit,
  }));

  useEffect(() => {
    setCurrentEmrId(emr_id);
  }, [emr_id]);

  useEffect(() => {
    return () => {
      handleDoctorSearch.cancel();
      doctorSearchSeqRef.current += 1;
    };
  }, [handleDoctorSearch]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setInitializing(true);
      setLoadFailed(false);
      setSheetProperty(undefined);
      setEmrProperty(undefined);
      setFormValues([]);
      setInitialSuperiorStakeholder(undefined);
      setSuperiorDoctor(undefined);
      setDoctorOptions([]);
      headerForm.resetFields();

      try {
        if (isEditMode && currentEmrId) {
          const [propertyRes, elemRes, stakeholderRes] = await Promise.all([
            getEmrProperty({ emr_id: currentEmrId }),
            getEmrElemList({ emr_id: currentEmrId }),
            getEmrStakeholderList({ emr_id: currentEmrId }),
          ]);
          if (cancelled) return;

          if (propertyRes.code !== 0 || !propertyRes.emr_property) {
            throw new Error(propertyRes.message || "病历信息加载失败");
          }
          if (elemRes.code !== 0) {
            throw new Error(elemRes.message || "病历表单数据加载失败");
          }
          if (stakeholderRes.code !== 0) {
            throw new Error(stakeholderRes.message || "病历相关人加载失败");
          }

          const property = propertyRes.emr_property;
          const superiorStakeholder = (stakeholderRes.row_list ?? []).find(
            (row) => row.stakeholder_type === SUPERIOR_DOCTOR_TYPE,
          );
          const loadedSuperiorDoctor = superiorStakeholder
            ? toSuperiorDoctor(superiorStakeholder)
            : undefined;
          setEmrProperty(property);
          setFormValues(toElemValues(elemRes.value_list ?? []));
          setInitialSuperiorStakeholder(superiorStakeholder);
          setSuperiorDoctor(loadedSuperiorDoctor);
          setDoctorOptions(loadedSuperiorDoctor ? [loadedSuperiorDoctor] : []);
          headerForm.setFieldsValue({
            emr_time: parseDateTime(property.emr_time),
            emr_title: property.emr_title,
          });

          if (property.form_id) {
            const sheetRes = await getFormProperty({
              form_id: property.form_id,
              form_version: property.form_version,
            });
            if (cancelled) return;
            if (sheetRes.code === 0 && sheetRes.sheet_property) {
              setSheetProperty(sheetRes.sheet_property);
            } else if (!property.doc_type) {
              throw new Error(sheetRes.message || "病历表单配置加载失败");
            }
          }
          return;
        }

        if (form_values?.length) {
          setFormValues(form_values);
        }
        if (!form_id || !visit_id) {
          headerForm.setFieldsValue({
            emr_time: parseDateTime(emr_time) ?? dayjs(),
            emr_title,
          });
          return;
        }

        const [sheetRes, initRes] = await Promise.all([
          getFormProperty({ form_id, form_version }),
          getEmrInit({
            visit_id,
            baby_id,
            form_id,
            form_version,
            link_name,
            link_value,
            link_data,
            link_tag,
            link_ext,
          }).catch(() => undefined),
        ]);
        if (cancelled) return;
        if (sheetRes.code !== 0 || !sheetRes.sheet_property) {
          throw new Error(sheetRes.message || "病历表单配置加载失败");
        }
        setSheetProperty(sheetRes.sheet_property);

        const initTime =
          initRes?.code === 0 ? parseDateTime(initRes.emr_time) : null;
        const initTitle =
          initRes?.code === 0 ? initRes.emr_title?.trim() : undefined;
        headerForm.setFieldsValue({
          emr_time: initTime ?? dayjs(),
          emr_title: initTitle || sheetRes.sheet_property.doc_name,
        });
      } catch (error) {
        if (cancelled) return;
        setLoadFailed(true);
        message.error(
          error instanceof Error ? error.message : "病历加载失败，请稍后重试",
        );
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [
    baby_id,
    currentEmrId,
    emr_time,
    emr_title,
    form_id,
    form_version,
    form_values,
    headerForm,
    isEditMode,
    link_data,
    link_ext,
    link_name,
    link_tag,
    link_value,
    visit_id,
  ]);

  const nurseProblemVisitId =
    formProp?.visit_id ?? visit_id ?? emrProperty?.visit_id ?? 0;

  return (
    <>
      <Spin spinning={initializing} description="加载病历...">
        <div>
        <Form
          form={headerForm}
          initialValues={{
            emr_time: dayjs(),
          }}
          layout="inline"
          style={{
            padding: "8px 16px",
            gap: 4,
          }}
        >
          <Form.Item name="emr_time" label="时间" style={{ marginBottom: 0 }}>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format={DATETIME_FORMAT}
              placeholder="请选择时间"
            />
          </Form.Item>
          <Form.Item name="emr_title" label="标题" style={{ marginBottom: 0 }}>
            <Input placeholder="请输入病历标题" style={{ width: 240 }} />
          </Form.Item>
          {/* <Form.Item label="上级医师" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              showSearch
              value={superiorDoctor?.user_id}
              options={doctorOptions}
              fieldNames={{ value: "user_id", label: "user_name" }}
              filterOption={false}
              loading={doctorSearching}
              placeholder="请选择上级医师"
              style={{ width: 120 }}
              onFocus={() => {
                if (doctorOptions.length === 0) {
                  void loadDefaultDoctors();
                }
              }}
              onSearch={handleDoctorSearch}
              onChange={(userId?: number) => {
                setSuperiorDoctor(
                  doctorOptions.find((doctor) => doctor.user_id === userId),
                );
              }}
              notFoundContent={
                doctorSearching ? <Spin size="small" /> : "暂无医生"
              }
            />
          </Form.Item> */}
        </Form>

        {isDiscussRecord ? (
          <EmrDiscuss
            ref={discussRef}
            emr_id={currentEmrId}
            doc_name={"术前讨论记录"}
            // doc_name={docName}
            emr_property={emrProperty}
          />
        ) : (
          formProp && (
            <CustomForm
              ref={formRef}
              formProp={formProp}
              formValues={formValues}
              recordTime={recordTime}
              onReady={
                shouldInitOnReady
                  ? () => {
                      formRef.current?.initFormValue({
                        link_name,
                        link_value,
                        link_data,
                        link_tag,
                        link_ext,
                      });
                    }
                  : undefined
              }
            />
          )
        )}
      </div>
    </Spin>
      <DoctorProblemModal
        open={doctorProblemOpen}
        visit_id={doctorProblemParams?.visit_id ?? 0}
        item_id={doctorProblemParams?.item_id ?? 0}
        item_name={doctorProblemParams?.item_name}
        onSaved={closeDoctorProblemModal}
        onCancel={closeDoctorProblemModal}
      />
      <ProblemAssessModal
        open={problemAssessOpen}
        source={problemAssessParams?.source ?? "DOCTOR"}
        problem_id={problemAssessParams?.problem_id ?? 0}
        assess_score={problemAssessParams?.assess_score ?? 0}
        assess_total={problemAssessParams?.assess_total}
        assess_result={problemAssessParams?.assess_result}
        assess_color={problemAssessParams?.assess_color}
        onSaved={closeProblemAssessModal}
        onCancel={closeProblemAssessModal}
      />
      <Modal
        title="登记护理问题"
        open={nurseProblemOpen}
        footer={null}
        width={1100}
        destroyOnHidden
        onCancel={closeNurseProblemModal}
        styles={{ body: { height: "70vh", padding: 12, overflow: "hidden" } }}
      >
        <CarePlanProblem
          visit_id={nurseProblemVisitId}
          item_id={nurseProblemItemId}
          onSaved={closeNurseProblemModal}
        />
      </Modal>
    </>
  );
});

export default EmrEdit;
