import { useCallback, useEffect, useMemo, useRef } from "react";
import { App } from "antd";
import * as patientApi from "../../PatientInfo/api/patient";
import * as visitApi from "../../PatientInfo/api/visit";
import { usePatientStore } from "../../PatientInfo/stores/usePatientStore";
import type {
  GetPatientAgeRes,
  PatientAddressData,
  PatientAddressRow,
  PatientContactData,
  PatientRow,
  PatientStatusRow,
  PatientContactRow,
  SaveAddressListReq,
  SaveContactListReq,
  SavePatientPropertyReq,
  SaveStatusPropertyReq,
  VisitPatientRow,
} from "../../PatientInfo/types/patient";
import { useShallow } from "zustand/react/shallow";

export interface UsePatientInfoOptions {
  /** 默认按患者维度拉取 */
  patientId?: number | null;
  /** 就诊记录 ID；fromVisit=true 时优先使用 */
  visitId?: number | null;
  /** fromVisit 时可用：visit_no + org 维度 */
  visitNo?: string | null;
  /** fromVisit 时可用：就诊类型条件 */
  visitType?: string | null;
  /** true 时走 visit 服务接口 */
  fromVisit?: boolean;
  /** 打开时自动加载，默认 true */
  autoLoad?: boolean;
}

/** patient/GetPatientProperty 可一次带回关联数据 */
const PATIENT_PROPERTY_COLUMNS = {
  column_list: "*",
  column_status: "*",
  column_address: "*",
  column_contact: "*",
  column_gp: "*",
  column_index: "*",
  column_ext: "*",
} as const;

type PatientService = {
  getStatusProperty: typeof patientApi.getStatusPropertyAPI;
  getAddressList: typeof patientApi.getAddressListAPI;
  getPatientAge: typeof patientApi.getPatientAgeAPI;
  getContactList: typeof patientApi.getContactListAPI;
  savePatientProperty: typeof patientApi.savePatientPropertyAPI;
  saveStatusProperty: typeof patientApi.saveStatusPropertyAPI;
  saveAddressList: typeof patientApi.saveAddressListAPI;
  saveContactList: typeof patientApi.saveContactListAPI;
};

const createService = (fromVisit: boolean): PatientService =>
  fromVisit
    ? {
        getStatusProperty: visitApi.getStatusPropertyAPI,
        getAddressList: visitApi.getAddressListAPI,
        getPatientAge: visitApi.getPatientAgeAPI,
        getContactList: visitApi.getContactListAPI,
        savePatientProperty: visitApi.savePatientPropertyAPI,
        saveStatusProperty: visitApi.saveStatusPropertyAPI,
        saveAddressList: visitApi.saveAddressListAPI,
        saveContactList: visitApi.saveContactListAPI,
      }
    : {
        getStatusProperty: patientApi.getStatusPropertyAPI,
        getAddressList: patientApi.getAddressListAPI,
        getPatientAge: patientApi.getPatientAgeAPI,
        getContactList: patientApi.getContactListAPI,
        savePatientProperty: patientApi.savePatientPropertyAPI,
        saveStatusProperty: patientApi.saveStatusPropertyAPI,
        saveAddressList: patientApi.saveAddressListAPI,
        saveContactList: patientApi.saveContactListAPI,
      };

/** visit 服务标识：优先 visit_id，其次 visit_no */
const buildVisitIdParams = (
  visitId?: number | null,
  visitNo?: string | null,
  visitType?: string | null,
) => {
  if (visitId != null) {
    return {
      visit_id: visitId,
      ...(visitType ? { visit_type: visitType } : {}),
    };
  }
  if (visitNo) {
    return {
      visit_no: visitNo,
      ...(visitType ? { visit_type: visitType } : {}),
    };
  }
  return null;
};

const buildIdParams = (
  fromVisit: boolean,
  patientId?: number | null,
  visitId?: number | null,
  visitNo?: string | null,
  visitType?: string | null,
) => {
  if (fromVisit) return buildVisitIdParams(visitId, visitNo, visitType);
  if (patientId != null) return { patient_id: patientId };
  return null;
};

/** VisitPatientRow → 表单/store 使用的 PatientRow */
const visitPatientToPatientRow = (row: VisitPatientRow): PatientRow => ({
  patient_id: row.patient_id,
  patient_name: row.patient_name,
  patient_gender: row.patient_gender,
  patient_idno: row.patient_idno,
  patient_idno_system: row.patient_idno_system,
  patient_telno: row.patient_telno,
  patient_telno_system: row.patient_telno_system,
  patient_email: row.patient_email,
  birth_date: row.birth_date,
  birth_time: row.birth_time,
  race_name: row.race_name,
  race_code: row.race_code,
  race_code_system: row.race_code_system,
  visit_id: row.visit_id,
  kb_code: row.kb_code,
  input_time: row.input_time,
  input_session: row.input_session,
  input_note: row.input_note,
});

const isOk = (code?: number) =>
  // code 为 0 代表成功
  code === 0;

export const formatPatientAge = (age?: GetPatientAgeRes | null): string => {
  if (!age) return "";
  const parts: string[] = [];
  if (age.age_year) parts.push(`${age.age_year}岁`);
  if (age.age_month) parts.push(`${age.age_month}月`);
  if (age.age_day) parts.push(`${age.age_day}天`);
  if (!parts.length && age.age_hour) parts.push(`${age.age_hour}小时`);
  return parts.join("") || "-";
};

/**
 * 患者信息数据钩子：按 patientId / visitId 拉取与保存。
 * fromVisit=true 时使用 visit 服务，否则默认 patient 服务。
 */
export const usePatientInfo = (options: UsePatientInfoOptions = {}) => {
  const {
    patientId = null,
    visitId = null,
    visitNo = null,
    visitType = null,
    fromVisit = false,
    autoLoad = true,
  } = options;

  const { message } = App.useApp();
  const messageRef = useRef(message);
  messageRef.current = message;

  // store 里面的 state 不能直接使用 store.getState() 获取，需要使用 useShallow 包裹，直接使用 store.getState() 不会触发组件重新渲染
  const {
    loading,
    saving,
    storePatientId,
    storeVisitId,
    storeFromVisit,
    patientProperty,
    statusProperty,
    addressList,
    contactList,
    indexList,
    age,
    patientNo,
  } = usePatientStore(
    useShallow((s) => ({
      loading: s.loading,
      saving: s.saving,
      storePatientId: s.patientId,
      storeVisitId: s.visitId,
      storeFromVisit: s.fromVisit,
      patientProperty: s.patientProperty,
      statusProperty: s.statusProperty,
      addressList: s.addressList,
      contactList: s.contactList,
      indexList: s.indexList,
      age: s.age,
      patientNo: s.patientNo,
    })),
  );

  const service = useMemo(() => createService(fromVisit), [fromVisit]);

  const loadAgeAndPatientNo = useCallback(
    async (
      resolvedPatientId: number | null | undefined,
      ageParams: ReturnType<typeof buildIdParams>,
    ) => {
      const { setAge, setPatientNo } = usePatientStore.getState();
      await Promise.all([
        (async () => {
          if (!ageParams) {
            setAge(null);
            return;
          }
          try {
            const ageRes = await service.getPatientAge(ageParams);
            setAge(ageRes);
          } catch {
            setAge(null);
          }
        })(),
        (async () => {
          if (resolvedPatientId == null) {
            setPatientNo(null);
            return;
          }
          try {
            const noRes = await patientApi.getPatientNoAPI({
              patient_id: resolvedPatientId,
              auto_build: false,
              visit_type: "I",
            });
            if (!isOk(noRes.code)) {
              setPatientNo(null);
              return;
            }
            // 住院病案号优先 patient_ipno ，没有的话使用 统一病案号 patient_no
            setPatientNo(noRes.patient_ipno || noRes.patient_no || null);
          } catch {
            setPatientNo(null);
          }
        })(),
      ]);
    },
    [service],
  );

  const load = useCallback(async () => {
    const { reset, setIdentity, setLoading, hydrateFromPropertyRes } =
      usePatientStore.getState();

    const idParams = buildIdParams(
      fromVisit,
      patientId,
      visitId,
      visitNo,
      visitType,
    );

    if (!idParams) {
      reset();
      return null;
    }

    setIdentity({ patientId, visitId, fromVisit });
    setLoading(true);
    try {
      // visit：GetPatientProperty 仅返回 patient_property，其余单独拉取
      if (fromVisit) {
        const propertyRes = await visitApi.getPatientPropertyAPI({
          ...idParams,
          column_list: "*",
        });

        if (!propertyRes.patient_property) {
          messageRef.current.warning(propertyRes.message || "未获取到患者信息");
          reset();
          return null;
        }

        const visitPatient = propertyRes.patient_property;
        const resolvedPatientId = visitPatient.patient_id ?? patientId;
        const resolvedVisitId = visitId ?? visitPatient.visit_id ?? null;
        const relatedParams = buildVisitIdParams(
          resolvedVisitId,
          visitNo,
          visitType,
        );

        const [statusRes, addressRes, contactRes] = await Promise.all([
          relatedParams
            ? service
                .getStatusProperty({ ...relatedParams, column_list: "*" })
                .catch(() => null)
            : Promise.resolve(null),
          relatedParams
            ? service
                .getAddressList({
                  ...relatedParams,
                  address_type: "*",
                  column_list: "*",
                })
                .catch(() => null)
            : Promise.resolve(null),
          relatedParams
            ? service
                .getContactList({ ...relatedParams, column_list: "*" })
                .catch(() => null)
            : Promise.resolve(null),
        ]);

        hydrateFromPropertyRes({
          patientProperty: visitPatientToPatientRow(visitPatient),
          statusProperty: statusRes?.status_property,
          addressList: addressRes?.address_list,
          contactList: contactRes?.contact_list,
        });

        setIdentity({
          patientId: resolvedPatientId ?? null,
          visitId: resolvedVisitId,
          fromVisit,
        });

        await loadAgeAndPatientNo(resolvedPatientId, relatedParams);
        return propertyRes;
      }

      // patient：一次带回 status/address/contact 等
      const res = await patientApi.getPatientPropertyAPI({
        ...idParams,
        ...PATIENT_PROPERTY_COLUMNS,
      });

      if (!res.patient_property) {
        messageRef.current.warning(res.message || "未获取到患者信息");
        reset();
        return null;
      }

      hydrateFromPropertyRes({
        patientProperty: res.patient_property,
        statusProperty: res.status_property,
        addressList: res.address_list,
        contactList: res.contact_list,
        gpList: res.gp_list,
        indexList: res.index_list,
        extList: res.ext_list,
      });

      const resolvedPatientId = res.patient_property.patient_id ?? patientId;
      const resolvedVisitId = visitId ?? res.patient_property.visit_id ?? null;
      setIdentity({
        patientId: resolvedPatientId ?? null,
        visitId: resolvedVisitId,
        fromVisit,
      });

      await loadAgeAndPatientNo(
        resolvedPatientId,
        buildIdParams(false, resolvedPatientId, resolvedVisitId),
      );

      return res;
    } catch {
      messageRef.current.error("加载患者信息失败");
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    fromVisit,
    loadAgeAndPatientNo,
    patientId,
    service,
    visitId,
    visitNo,
    visitType,
  ]);

  const resolveSaveIds = useCallback(() => {
    const state = usePatientStore.getState();
    return buildIdParams(
      state.fromVisit,
      state.patientId ?? patientId,
      state.visitId ?? visitId,
      visitNo,
      visitType,
    );
  }, [patientId, visitId, visitNo, visitType]);

  const savePatientProperty = useCallback(
    async (nextProperty: PatientRow) => {
      const idParams = resolveSaveIds();
      if (!idParams) {
        messageRef.current.warning("缺少患者或就诊标识");
        return false;
      }
      // store 里面的 action（方法）可以直接通过 usePatientStore.getState() 获取
      const {
        setSaving,
        setPatientProperty,
        patientProperty: prev,
      } = usePatientStore.getState();
      setSaving(true);
      try {
        const params: SavePatientPropertyReq = {
          ...idParams,
          patient_property: nextProperty,
        };
        const res = await service.savePatientProperty(params);
        if (!isOk(res.code)) {
          messageRef.current.error(res.message || "保存患者属性失败");
          return false;
        }
        setPatientProperty({ ...prev, ...nextProperty });
        messageRef.current.success("保存成功");
        return true;
      } catch {
        messageRef.current.error("保存患者属性失败");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [resolveSaveIds, service],
  );

  const saveStatusProperty = useCallback(
    async (nextStatus: PatientStatusRow) => {
      const idParams = resolveSaveIds();
      if (!idParams) {
        messageRef.current.warning("缺少患者或就诊标识");
        return false;
      }
      const {
        setSaving,
        setStatusProperty,
        statusProperty: prev,
      } = usePatientStore.getState();
      setSaving(true);
      try {
        const params: SaveStatusPropertyReq = {
          ...idParams,
          status_property: nextStatus,
        };
        const res = await service.saveStatusProperty(params);
        if (!isOk(res.code)) {
          messageRef.current.error(res.message || "保存状态属性失败");
          return false;
        }
        setStatusProperty({ ...prev, ...nextStatus });
        messageRef.current.success("保存成功");
        return true;
      } catch {
        messageRef.current.error("保存状态属性失败");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [resolveSaveIds, service],
  );

  const saveAddressList = useCallback(
    async (nextAddresses: PatientAddressData[], address_type: string = "*") => {
      const idParams = resolveSaveIds();
      if (!idParams) {
        messageRef.current.warning("缺少患者或就诊标识");
        return false;
      }
      const { setSaving, setAddressList } = usePatientStore.getState();
      setSaving(true);
      try {
        const params: SaveAddressListReq = {
          ...idParams,
          address_type,
          address_list: nextAddresses,
        };
        const res = await service.saveAddressList(params);
        if (!isOk(res.code)) {
          messageRef.current.error(res.message || "保存地址失败");
          return false;
        }
        setAddressList(nextAddresses as never);
        messageRef.current.success("保存成功");
        return true;
      } catch {
        messageRef.current.error("保存地址失败");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [resolveSaveIds, service],
  );

  const saveContactList = useCallback(
    async (nextContacts: PatientContactData[]) => {
      const idParams = resolveSaveIds();
      if (!idParams) {
        messageRef.current.warning("缺少患者或就诊标识");
        return false;
      }
      const { setSaving, setContactList } = usePatientStore.getState();
      setSaving(true);
      try {
        const params: SaveContactListReq = {
          ...idParams,
          contact_list: nextContacts,
        };
        const res = await service.saveContactList(params);
        if (!isOk(res.code)) {
          messageRef.current.error(res.message || "保存联系人失败");
          return false;
        }
        setContactList(nextContacts as never);
        messageRef.current.success("保存成功");
        return true;
      } catch {
        messageRef.current.error("保存联系人失败");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [resolveSaveIds, service],
  );

  /** 左侧主信息：基本属性 + 医保状态 + 地址；无 patientId 且非 visit 时先 NewPatient */
  const saveBasicBundle = useCallback(
    async (payload: {
      patient_property: PatientRow;
      status_property?: PatientStatusRow;
      address_list?: PatientAddressData[];
      contact_list?: PatientContactData[];
    }) => {
      let idParams = resolveSaveIds();
      const { setSaving, applyBasicSave, setIdentity } =
        usePatientStore.getState();

      setSaving(true);
      try {
        let nextProperty = { ...payload.patient_property };

        // 新建：尚无患者标识时走 NewPatient，再写状态/地址/联系人
        if (!idParams) {
          if (fromVisit) {
            messageRef.current.warning("缺少患者或就诊标识");
            return false;
          }
          // 与旧建档页一致：提交基本信息表单上的患者字段，不附加 create_type
          const createRes = await patientApi.newPatientAPI({
            patient_id: 0,
            baby_id: nextProperty.baby_id ?? 0,
            patient_name: nextProperty.patient_name,
            patient_gender: nextProperty.patient_gender,
            birth_date: nextProperty.birth_date,
            birth_time: nextProperty.birth_time,
            birth_type: nextProperty.birth_type,
            patient_idno: nextProperty.patient_idno,
            patient_idno_system: nextProperty.patient_idno_system,
            patient_telno: nextProperty.patient_telno,
            patient_telno_system: nextProperty.patient_telno_system,
            race_code: nextProperty.race_code,
            race_name: nextProperty.race_name,
          });
          if (!isOk(createRes.code) || createRes.patient_id == null) {
            messageRef.current.error(createRes.message || "新建患者失败");
            return false;
          }
          const newId = createRes.patient_id;
          nextProperty = { ...nextProperty, patient_id: newId };
          setIdentity({ patientId: newId, fromVisit: false });
          idParams = { patient_id: newId };
        } else {
          const propertyRes = await service.savePatientProperty({
            ...idParams,
            patient_property: nextProperty,
          });
          if (!isOk(propertyRes.code)) {
            messageRef.current.error(propertyRes.message || "保存患者属性失败");
            return false;
          }
        }

        if (payload.status_property) {
          const statusRes = await service.saveStatusProperty({
            ...idParams,
            status_property: payload.status_property,
          });
          if (!isOk(statusRes.code)) {
            messageRef.current.error(statusRes.message || "保存医保信息失败");
            return false;
          }
        }

        if (payload.address_list) {
          const addrList = payload.address_list.map((row) => ({
            ...row,
            patient_id: nextProperty.patient_id ?? row.patient_id,
          }));
          const addrRes = await service.saveAddressList({
            ...idParams,
            address_type: "*",
            address_list: addrList,
          });
          if (!isOk(addrRes.code)) {
            messageRef.current.error(addrRes.message || "保存地址失败");
            return false;
          }
        }
        if (payload.contact_list) {
          const contactListPayload = payload.contact_list.map((row) => ({
            ...row,
            patient_id: nextProperty.patient_id ?? row.patient_id,
          }));
          const contactRes = await service.saveContactList({
            ...idParams,
            contact_list: contactListPayload,
          });
          if (!isOk(contactRes.code)) {
            messageRef.current.error(contactRes.message || "保存联系人失败");
            return false;
          }
        }

        // 全部接口成功后再原子回写，避免 status/address 先更新时用旧 patientProperty 回填表单
        applyBasicSave({
          patientProperty: nextProperty,
          statusProperty: payload.status_property,
          addressList: payload.address_list as PatientAddressRow[] | undefined,
          contactList: payload.contact_list as PatientContactRow[] | undefined,
        });
        messageRef.current.success("保存成功");
        return true;
      } catch {
        messageRef.current.error("保存失败");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fromVisit, resolveSaveIds, service],
  );

  useEffect(() => {
    if (!autoLoad) return;
    void load();
  }, [autoLoad, load]);

  return {
    loading,
    saving,
    patientId: storePatientId,
    visitId: storeVisitId,
    fromVisit: storeFromVisit,
    patientProperty,
    statusProperty,
    addressList,
    contactList,
    indexList,
    age,
    ageText: formatPatientAge(age),
    patientNo,
    load,
    savePatientProperty,
    saveStatusProperty,
    saveAddressList,
    saveContactList,
    saveBasicBundle,
    reset: () => usePatientStore.getState().reset(),
  };
};
