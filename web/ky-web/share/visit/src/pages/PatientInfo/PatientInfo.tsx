import { useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  QRCode,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  TimePicker,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { DeleteOutlined } from "@ant-design/icons";
import { usePatientInfo } from "../PatientInfo/hooks/usePatientInfo";
import type { VisitRow } from "../PatientInfo/types/visit";
import ReadCardHeader from "../ReadCardHeader";
import { deletePatientAPI, preparePatientAPI, updateInsurancePropertyAPI } from "./api/patient";
import {
  getVisitListAPI,
  updateInsurancePropertyAPI as updateVisitInsurancePropertyAPI,
} from "./api/visit";
import AddressFields from "./components/AddressFields";
import DictSelect from "./components/DictSelect";
import PartnerSelect from "./components/PartnerSelect";
import InsurancePanel from "../InsurancePanel";
import { usePatientStore } from "./stores/usePatientStore";
import type { CardReadInfo } from "./types/card";
import type { EmpiMatchRow } from "./types/patient";
import {
  ADDRESS_TYPE_ALIASES,
  ADDRESS_TYPE_NAME,
  BIRTH_TYPE_OPTIONS,
  BLOOD_ABO_OPTIONS,
  BLOOD_RH_OPTIONS,
  DICT,
  FORM_LABEL_WIDTH,
  GENDER_OPTIONS,
} from "./constants";
import MatchPatientModal from "./MatchPatientModal";
import AddressInfoTab from "./sections/AddressInfoTab";
import CardTab from "./sections/CardTab";
import ContactTab, { type ContactTabHandle } from "./sections/ContactTab";
import type {
  BasicFormValues,
  ExtendedFormValues,
  PatientInfoProps,
} from "./types";
import {
  addressToForm,
  buildAddressFull,
  fillBirthAddressFromNative,
  findAddress,
  findMedicalRecordNo,
  mergeAddressList,
  toAddressData,
  toContactData,
} from "./utils";
import { parseChineseIdCard } from "./utils/idcard";
import VisitSelectModal from "./VisitSelectModal";

const labelCol = { flex: `${FORM_LABEL_WIDTH}px` };
const wrapperCol = { flex: 1 };

/**
 * 患者信息主面板（可独立复用，不依赖 admission 业务）
 * - 默认 patientId + patient 服务
 * - fromVisit=true 时走 visit 服务（可传 visitId）
 */
const PatientInfo: React.FC<PatientInfoProps> = ({
  patientId,
  visitId,
  visitNo,
  visitType,
  fromVisit = false,
  className,
  onSaved,
  onDeleted,
  onVisitSelect,
  hideHeader,
  showVisitSelectBtn,
  showCardTab = false,
  showDeleteBtn = false,
}) => {
  const { message } = App.useApp();
  const [basicForm] = Form.useForm<BasicFormValues>();
  const [extendedForm] = Form.useForm<ExtendedFormValues>();
  const [activeTab, setActiveTab] = useState("extended");
  /** 访问过的 tab 保持挂载，避免切回时重复请求并丢失未保存编辑，如果不这样的话，一开始进来，所有的 tab 都会立马挂载并发起对应请求 */
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    extended: true,
  });
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitSelecting, setVisitSelecting] = useState(false);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchList, setMatchList] = useState<EmpiMatchRow[]>([]);
  const [deleting, setDeleting] = useState(false);
  /** 用户在查重弹窗点「继续注册」后，下一次保存跳过 PreparePatient */
  const continueCreateRef = useRef(false);
  /** 就诊维度刷卡成功后，让医保面板重新拉 visit/GetStatusProperty */
  const [visitStatusNonce, setVisitStatusNonce] = useState(0);
  /** 选择就诊记录后覆盖 props，切换到 visit 服务 */
  const [activeVisitId, setActiveVisitId] = useState<number | null | undefined>(
    visitId,
  );
  /** true=使用 visit 数据（Switch 选中）；false=使用 patient 数据 */
  const [activeFromVisit, setActiveFromVisit] = useState(fromVisit);
  const syncCurrentAddress = Form.useWatch("sync_current_address", basicForm);
  const raceName = Form.useWatch("race_name", basicForm);
  const partnerName = Form.useWatch("partner_name", extendedForm);
  const countryName = Form.useWatch("country_name", extendedForm);
  const eduName = Form.useWatch("edu_name", extendedForm);
  const workName = Form.useWatch("work_name", extendedForm);
  const maritalName = Form.useWatch("marital_name", extendedForm);
  const langName = Form.useWatch("lang_name", extendedForm);
  /** 地址信息 Tab 中勾选、保存时接收现住址内容的地址类型 */
  const [syncAddressTypes, setSyncAddressTypes] = useState<string[]>([]);
  const contactTabRef = useRef<ContactTabHandle>(null);

  useEffect(() => {
    setActiveVisitId(visitId);
    setActiveFromVisit(fromVisit);
    setSyncAddressTypes([]);
  }, [patientId, visitId, fromVisit]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setVisitedTabs((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  useEffect(() => {
    if (!showCardTab && activeTab === "card") setActiveTab("extended");
  }, [activeTab, showCardTab]);

  const {
    loading,
    saving,
    patientProperty,
    statusProperty,
    addressList,
    contactList,
    indexList,
    ageText,
    patientNo,
    visitId: resolvedVisitId,
    saveBasicBundle,
    saveStatusProperty,
    saveAddressList,
    saveContactList,
  } = usePatientInfo({
    patientId,
    visitId: activeVisitId,
    visitNo,
    visitType,
    fromVisit: activeFromVisit,
  });

  const handleOpenVisitSelect = () => {
    const currentPatientId = patientProperty?.patient_id ?? patientId;
    if (currentPatientId == null) {
      message.warning("请先定位患者");
      return;
    }
    setVisitModalOpen(true);
  };

  const handleOpenUpdateInsurance = () => {
    const currentPatientId = patientProperty?.patient_id ?? patientId;
    if (currentPatientId == null) {
      message.warning("请先定位患者");
      return;
    }
    setInsuranceModalOpen(true);
  };

  const handleInsuranceReadInfo = async (
    readInfo: CardReadInfo,
    patientIdFromCard: number,
  ) => {
    if (patientIdFromCard == null) {
      message.warning("未匹配到患者");
      return;
    }

    const hide = message.loading("正在更新医保身份...", 0);
    try {
      // visit_id 为空或 0 时仍按患者更新；否则按当前就诊更新
      const res =
        activeVisitId != null && activeVisitId !== 0
          ? await updateVisitInsurancePropertyAPI({
              visit_id: activeVisitId,
              read_info: readInfo,
              column_list: "*",
            })
          : await updateInsurancePropertyAPI({
              patient_id: patientIdFromCard,
              read_info: readInfo,
              column_list: "*",
            });
      if (res.code !== 0) {
        
        return;
      }
      if (res.status_property) {
        const prev = usePatientStore.getState().statusProperty;
        usePatientStore
          .getState()
          .setStatusProperty({ ...prev, ...res.status_property });
      }
      if (activeVisitId != null && activeVisitId !== 0) {
        setVisitStatusNonce((nonce) => nonce + 1);
      }
      message.success("医保身份已更新");
      setInsuranceModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      hide();
    }
  };

  /** Switch 打开：先弹窗选就诊；关闭：切回 patient 服务数据 */
  const handleHeaderSwitchChange = (checked: boolean) => {
    if (checked) {
      handleOpenVisitSelect();
      return;
    }
    setActiveFromVisit(false);
    setActiveVisitId(null);
  };

  const handleSelectVisit = async (row: VisitRow) => {
    if (row.visit_id == null) {
      message.warning("该记录缺少就诊ID");
      return;
    }

    setVisitSelecting(true);
    try {
      // 切换标识后 usePatientInfo 会自动走 visit/GetPatientProperty，Switch 随之选中
      setActiveVisitId(row.visit_id);
      setActiveFromVisit(true);
      setVisitModalOpen(false);
      onVisitSelect?.(row.visit_id);
    } finally {
      setVisitSelecting(false);
    }
  };

  const medicalNo = useMemo(
    () => patientNo || findMedicalRecordNo(indexList),
    [patientNo, indexList],
  );

  const isCreateMode = patientId == null && !fromVisit && !activeFromVisit;

  /** 新建：无患者数据时清空并给默认值；编辑：按接口回填 */
  useEffect(() => {
    if (!patientProperty) {
      if (!isCreateMode) return;
      basicForm.resetFields();
      extendedForm.resetFields();
      basicForm.setFieldsValue({
        patient_gender: "未知",
        sync_current_address: false,
      });
      return;
    }

    const native =
      findAddress(addressList, ADDRESS_TYPE_NAME.NATIVE) ||
      findAddress(addressList, "籍贯");
    const current =
      findAddress(addressList, ADDRESS_TYPE_NAME.CURRENT) ||
      findAddress(addressList, ADDRESS_TYPE_NAME.CONTACT) ||
      findAddress(addressList, "现住址") ||
      findAddress(addressList, "联系地址");

    basicForm.setFieldsValue({
      patient_no: medicalNo,
      patient_name: patientProperty.patient_name,
      patient_gender: patientProperty.patient_gender,
      patient_idno_system: patientProperty.patient_idno_system,
      patient_idno: patientProperty.patient_idno,
      birth_date: patientProperty.birth_date,
      birth_time: patientProperty.birth_time,
      birth_type: patientProperty.birth_type,
      patient_telno: patientProperty.patient_telno,
      race_code: patientProperty.race_code,
      race_name: patientProperty.race_name,
      native_address: addressToForm(native),
      current_address: addressToForm(current),
      sync_current_address: false,
      insurance_type: statusProperty?.insurance_type,
      insurance_name: statusProperty?.insurance_name,
      settle_type: statusProperty?.settle_type,
      settle_name: statusProperty?.settle_name,
      insurance_no: statusProperty?.insurance_no,
      insurance_code: statusProperty?.insurance_code,
    });

    const hukou =
      findAddress(addressList, ADDRESS_TYPE_NAME.HUKOU_RESIDENCE) ||
      findAddress(addressList, ADDRESS_TYPE_NAME.HUKOU);
    const birth = findAddress(addressList, ADDRESS_TYPE_NAME.BIRTH);

    extendedForm.setFieldsValue({
      country_code: statusProperty?.country_code,
      country_name: statusProperty?.country_name,
      edu_code: statusProperty?.edu_code,
      edu_name: statusProperty?.edu_name,
      work_code: statusProperty?.work_code,
      work_name: statusProperty?.work_name,
      work_org: statusProperty?.work_org,
      work_title: statusProperty?.work_title,
      work_telno: statusProperty?.work_telno,
      marital_code: statusProperty?.marital_code,
      marital_name: statusProperty?.marital_name,
      lang_code: statusProperty?.lang_code,
      lang_name: statusProperty?.lang_name,
      faith_name: statusProperty?.faith_name,
      blood_abo: statusProperty?.blood_abo,
      blood_rh: statusProperty?.blood_rh,
      partner_id: statusProperty?.partner_id || undefined,
      partner_name: statusProperty?.partner_name,
      body_height: statusProperty?.body_height,
      body_weight: statusProperty?.body_weight,
      hukou_address: addressToForm(hukou),
      birth_address: addressToForm(birth),
    });
  }, [
    isCreateMode,
    patientProperty,
    statusProperty,
    addressList,
    medicalNo,
    basicForm,
    extendedForm,
  ]);

  const handleSyncCurrentAddress = (checked: boolean) => {
    basicForm.setFieldValue("sync_current_address", checked);
  };

  const handleSaveBasic = async () => {
    const skipDuplicateCheck = continueCreateRef.current;
    continueCreateRef.current = false;
    let values: BasicFormValues;
    try {
      values = await basicForm.validateFields();
    } catch {
      continueCreateRef.current = skipDuplicateCheck;
      return;
    }
    // 勾选框在 AddressFields 内，未挂 Form.Item；validateFields 不会带回该字段
    const shouldSync = !!basicForm.getFieldValue("sync_current_address");
    const patient_property = {
      ...patientProperty,
      patient_name: values.patient_name,
      patient_gender: values.patient_gender,
      patient_idno_system: values.patient_idno_system,
      patient_idno: values.patient_idno,
      birth_date: values.birth_date,
      birth_time: values.birth_time,
      birth_type: values.birth_type,
      patient_telno: values.patient_telno,
      race_code: values.race_code,
      race_name: values.race_name,
    };

    // 新建时右侧扩展表单未挂载。已建档时读当前表单，避免把 store 里的旧快照再写回去
    const extendedValues = isCreateMode
      ? undefined
      : extendedForm.getFieldsValue();

    const status_property = {
      ...statusProperty,
      ...(extendedValues
        ? {
            country_code: extendedValues.country_code,
            country_name: extendedValues.country_name,
            edu_code: extendedValues.edu_code,
            edu_name: extendedValues.edu_name,
            work_code: extendedValues.work_code,
            work_name: extendedValues.work_name,
            work_org: extendedValues.work_org,
            work_title: extendedValues.work_title,
            work_telno: extendedValues.work_telno,
            marital_code: extendedValues.marital_code,
            marital_name: extendedValues.marital_name,
            lang_code: extendedValues.lang_code,
            lang_name: extendedValues.lang_name,
            faith_name: extendedValues.faith_name,
            blood_abo: extendedValues.blood_abo,
            blood_rh: extendedValues.blood_rh,
            partner_id: extendedValues.partner_id
              ? Number(extendedValues.partner_id)
              : 0,
            partner_name: extendedValues.partner_name || "",
            body_height: extendedValues.body_height ?? undefined,
            body_weight: extendedValues.body_weight,
          }
        : {}),
      insurance_type: values.insurance_type,
      insurance_name: values.insurance_name,
      settle_type: values.settle_type,
      settle_name: values.settle_name,
      insurance_no: values.insurance_no,
      insurance_code: values.insurance_code,
    };

    // 籍贯不采集详细地址；同时丢掉旧 address_full，避免仍按含门牌的完整地址提交
    const nativeAddress = values.native_address
      ? {
          ...values.native_address,
          address_detail: "",
          address_full: undefined,
        }
      : values.native_address;
    const nativeData = toAddressData(
      nativeAddress,
      nativeAddress?.address_type || ADDRESS_TYPE_NAME.NATIVE,
      patientProperty?.patient_id,
    );
    const currentData = toAddressData(
      values.current_address,
      values.current_address?.address_type || ADDRESS_TYPE_NAME.CURRENT,
      patientProperty?.patient_id,
    );

    // 勾选「同步地址」后，仅把现住址写入地址信息里勾选的类型。
    // 别名查找可能命中现住址本身，那种情况不能复用它的 address_id。
    const currentAliases = new Set<string>(
      ADDRESS_TYPE_ALIASES[ADDRESS_TYPE_NAME.CURRENT] ?? [
        ADDRESS_TYPE_NAME.CURRENT,
      ],
    );
    const syncedAddresses =
      shouldSync && syncAddressTypes.length
        ? syncAddressTypes.map((typeName) => {
            const found = findAddress(addressList, typeName);
            const source =
              found && !currentAliases.has(found.address_type || "")
                ? found
                : addressList.find((item) => item.address_type === typeName);
            const addressType = source?.address_type || typeName;
            return toAddressData(
              {
                ...(values.current_address ?? {}),
                address_id: source?.address_id,
                address_type: addressType,
                address_full: undefined,
              },
              addressType,
              patientProperty?.patient_id,
            );
          })
        : [];

    // 联系人改动只在 ContactTab 表单里，store 仍是加载时的旧数据
    const contactData = contactTabRef.current
      ? await contactTabRef.current.collectContacts()
      : contactList.map((item) =>
          toContactData(item, patientProperty?.patient_id),
        );

    const creating =
      (patientProperty?.patient_id ?? patientId) == null &&
      !fromVisit &&
      !activeFromVisit;
    if (creating && !skipDuplicateCheck) {
      try {
        const prepared = await preparePatientAPI(
          {
            patient_name: values.patient_name,
            patient_gender: values.patient_gender,
            patient_dob: values.birth_date,
            patient_address: buildAddressFull(values.current_address),
            patient_idno: values.patient_idno,
            patient_idno_system: values.patient_idno_system,
            patient_telno: values.patient_telno,
            patient_telno_system: patientProperty?.patient_telno_system,
          },
          { rawResponse: true },
        );
        const matches =
          prepared?.code === 0 ? (prepared.match_list ?? []) : [];
        if (matches.length > 0) {
          message.warning("病人已经被注册");
          setMatchList(matches);
          setMatchOpen(true);
          return;
        }
      } catch {
        return;
      }
    }

    const resolvedPatientId = patientProperty?.patient_id ?? patientId;
    const hukouSource =
      findAddress(addressList, ADDRESS_TYPE_NAME.HUKOU_RESIDENCE) ||
      findAddress(addressList, ADDRESS_TYPE_NAME.HUKOU);
    const birthSource = findAddress(addressList, ADDRESS_TYPE_NAME.BIRTH);
    const birthAddress = fillBirthAddressFromNative(
      nativeAddress,
      extendedValues?.birth_address,
    );
    const hukouAddress = fillBirthAddressFromNative(
      nativeAddress,
      extendedValues?.hukou_address,
    );
    const extendedAddresses = extendedValues
      ? [
          toAddressData(
            hukouAddress,
            hukouSource?.address_type ||
              hukouAddress?.address_type ||
              ADDRESS_TYPE_NAME.HUKOU_RESIDENCE,
            resolvedPatientId,
          ),
          toAddressData(
            birthAddress,
            birthSource?.address_type ||
              birthAddress?.address_type ||
              ADDRESS_TYPE_NAME.BIRTH,
            resolvedPatientId,
          ),
        ]
      : [
          ...(hukouAddress
            ? [
                toAddressData(
                  hukouAddress,
                  ADDRESS_TYPE_NAME.HUKOU_RESIDENCE,
                  resolvedPatientId,
                ),
              ]
            : []),
          ...(birthAddress
            ? [
                toAddressData(
                  birthAddress,
                  ADDRESS_TYPE_NAME.BIRTH,
                  resolvedPatientId,
                ),
              ]
            : []),
        ];

    const ok = await saveBasicBundle({
      patient_property,
      status_property,
      address_list: mergeAddressList(addressList, [
        nativeData,
        currentData,
        ...extendedAddresses,
        ...syncedAddresses,
      ]),
      contact_list: contactData,
    });
    if (ok) {
      onSaved?.(usePatientStore.getState().patientId ?? patientProperty?.patient_id);
    }
  };

  const handleSaveExtended = async () => {
    const values = await extendedForm.validateFields();
    const contactData = contactTabRef.current
      ? await contactTabRef.current.collectContacts()
      : contactList.map((item) =>
          toContactData(item, patientProperty?.patient_id),
        );
    const statusOk = await saveStatusProperty({
      ...statusProperty,
      country_code: values.country_code,
      country_name: values.country_name,
      edu_code: values.edu_code,
      edu_name: values.edu_name,
      work_code: values.work_code,
      work_name: values.work_name,
      work_org: values.work_org,
      work_title: values.work_title,
      work_telno: values.work_telno,
      marital_code: values.marital_code,
      marital_name: values.marital_name,
      lang_code: values.lang_code,
      lang_name: values.lang_name,
      faith_name: values.faith_name,
      blood_abo: values.blood_abo,
      blood_rh: values.blood_rh,
      partner_id: values.partner_id ? Number(values.partner_id) : 0,
      partner_name: values.partner_name || "",
      body_height: values.body_height ?? undefined,
      body_weight: values.body_weight,
    });
    if (!statusOk) return;

    const resolvedPatientId = patientProperty?.patient_id ?? patientId;
    const hukouSource =
      findAddress(addressList, ADDRESS_TYPE_NAME.HUKOU_RESIDENCE) ||
      findAddress(addressList, ADDRESS_TYPE_NAME.HUKOU);
    const birthSource = findAddress(addressList, ADDRESS_TYPE_NAME.BIRTH);
    const nativeForm = basicForm.getFieldValue("native_address");
    const nativeForFill = nativeForm
      ? { ...nativeForm, address_detail: "", address_full: undefined }
      : undefined;
    const birthAddress = fillBirthAddressFromNative(
      nativeForFill,
      values.birth_address,
    );
    const hukouAddress = fillBirthAddressFromNative(
      nativeForFill,
      values.hukou_address,
    );
    const hukouData = toAddressData(
      hukouAddress,
      hukouSource?.address_type ||
        hukouAddress?.address_type ||
        ADDRESS_TYPE_NAME.HUKOU_RESIDENCE,
      resolvedPatientId,
    );
    const birthData = toAddressData(
      birthAddress,
      birthSource?.address_type ||
        birthAddress?.address_type ||
        ADDRESS_TYPE_NAME.BIRTH,
      resolvedPatientId,
    );
    const addressOk = await saveAddressList(
      mergeAddressList(addressList, [hukouData, birthData]),
    );
    if (!addressOk) return;

    const contactOk = await saveContactList(contactData);
    if (contactOk) onSaved?.();
  };

  const visitLabel =
    resolvedVisitId ?? activeVisitId ?? patientProperty?.visit_id;
  const patientLabel = patientProperty?.patient_id ?? patientId;
  const canDelete =
    showDeleteBtn &&
    !fromVisit &&
    !activeFromVisit &&
    !isCreateMode &&
    (patientProperty?.patient_id ?? patientId) != null;

  const handleDelete = async () => {
    const id = patientProperty?.patient_id ?? patientId;
    if (id == null) return;
    setDeleting(true);
    try {
      const visits = await getVisitListAPI({
        patient_id: id,
        visit_type: "*",
        page_size: 0,
        row_limit: 1,
      });
      if ((visits.visit_list?.length ?? 0) > 0) {
        message.error("该患者有就诊记录，不能删除");
        return;
      }
      await deletePatientAPI({ patient_id: id });
      message.success("删除成功!");
      usePatientStore.getState().reset();
      onDeleted?.();
    } catch {
      // 请求层已提示失败原因
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      size="small"
      variant="borderless"
      className={[
        "flex h-full min-h-0 flex-col",
        "[&_.ant-card-head]:shrink-0 [&_.ant-card-head]:min-h-0 [&_.ant-card-head]:px-2 [&_.ant-card-head]:py-2",
        "[&_.ant-card-body]:flex [&_.ant-card-body]:min-h-0 [&_.ant-card-body]:flex-1 [&_.ant-card-body]:flex-col [&_.ant-card-body]:overflow-hidden [&_.ant-card-body]:p-0!",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={
        !hideHeader ? (
          <div className="min-w-0 truncate text-(length:--app-theme-font-sm, 13px) font-normal rounded">
            {isCreateMode
              ? "新建患者"
              : activeFromVisit
                ? "当前患者就诊记录"
                : "当前患者信息"}
            {!isCreateMode ? (
              <>
                :{" "}
                <span className="font-medium text-(--ant-color-text, rgba(0,0,0,0.88))">
                  {(activeFromVisit ? visitLabel : patientLabel) ?? "-"}
                </span>
              </>
            ) : null}
          </div>
        ) : null
      }
      extra={
        !hideHeader && !isCreateMode ? (
          <Space size={8} wrap>
            {showVisitSelectBtn && <div>
              <Switch
              size="small"
              checked={activeFromVisit}
              onChange={handleHeaderSwitchChange}
              />
              <Button size="small" type="primary" onClick={handleOpenVisitSelect}>
                选择就诊记录
              </Button>
            </div>}
            <Button size="small" onClick={handleOpenUpdateInsurance}>
              刷卡更新医保身份
            </Button>
            {canDelete ? (
              <Popconfirm
                title="确定删除?"
                okText="确定"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => void handleDelete()}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleting}
                >
                  删除
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        ) : null
      }
    >
      <Spin
        spinning={loading}
        // 注意: padding 设置到外层 Spin 上，然后 超出滚动 设置到 子元素上
        className="min-h-0 flex-1 [&>.ant-spin-container]:h-full [&>.ant-spin-container]:p-2"
      >
        {/* 超出滚动设置到 子元素上 */}
        <div className="flex h-full min-h-0 min-w-0 gap-2 bg-(--ant-color-fill-quaternary, #f5f5f5)">
          {/* 左栏：基本信息，下面这个 空类名 的 div 不能去掉，不然 Form 的 边框高度 就不能占满
              如果想做的语义化一点，就把 border-r 写到这个 div 上，或者直接加超出滚动，不然就用 div + 类名写在 Form 上的做法         
          */}
          <div className="pe-2 overflow-auto rounded border border-(--app-theme-border) p-2 flex-shrink-0">
            <Form
              form={basicForm}
              layout="horizontal"
              labelCol={labelCol}
              wrapperCol={wrapperCol}
              colon
              disabled={saving}
              className="min-w-0 h-full"
              labelAlign="right"
            >
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <Form.Item label="病案号" name="patient_no" className="mb-2!">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item
                    label="姓名"
                    name="patient_name"
                    className="mb-2!"
                    rules={[{ required: true, message: "请输入姓名" }]}
                  >
                    <Input allowClear />
                  </Form.Item>
                </div>
                <div className="flex w-[88px] shrink-0 flex-col items-center justify-start pt-1">
                  <QRCode
                    value={String(
                      medicalNo ||
                        patientProperty?.patient_id ||
                        visitLabel ||
                        "patient",
                    )}
                    size={72}
                    bordered={false}
                  />
                </div>
              </div>

              <Form.Item label="性别" name="patient_gender" className="mb-2!">
                <Radio.Group options={[...GENDER_OPTIONS]} />
              </Form.Item>

              <Form.Item label="年龄" className="mb-2!">
                <Input value={ageText || "-"} disabled />
              </Form.Item>

              <Form.Item label="证件" className="mb-2!" required>
                <Space.Compact className="w-full">
                  <Form.Item name="patient_idno_system" noStyle>
                    <DictSelect
                      dictName={DICT.IDNO_SYSTEM}
                      placeholder="证件类型"
                      className="w-[120px]!"
                    />
                  </Form.Item>
                  <Form.Item name="patient_idno" noStyle>
                    <Input
                      allowClear
                      placeholder="证件号码"
                      onChange={(event) => {
                        const parsed = parseChineseIdCard(event.target.value);
                        if (!parsed) return;
                        basicForm.setFieldsValue({
                          patient_gender: parsed.gender,
                          birth_date: parsed.birthDate,
                          birth_time: parsed.birthTime,
                        });
                      }}
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>

              <Form.Item label="出生信息" className="mb-2!" required>
                <div className="flex flex-wrap items-center gap-2">
                  <Form.Item
                    name="birth_date"
                    className="mb-0!"
                    rules={[{ required: true, message: "出生日期不能为空" }]}
                    getValueProps={(v) => ({ value: v ? dayjs(v) : null })}
                    normalize={(v) => (v ? v.format("YYYY-MM-DD") : undefined)}
                  >
                    <DatePicker
                      className="w-[140px]"
                      placeholder="出生日期"
                      disabledDate={(current) =>
                        !!current && current.isAfter(dayjs(), "day")
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    name="birth_time"
                    noStyle
                    getValueProps={(v) => ({
                      value: v ? dayjs(v, "HH:mm") : null,
                    })}
                    normalize={(v) => (v ? v.format("HH:mm") : undefined)}
                  >
                    <TimePicker
                      className="w-[110px]"
                      format="HH:mm"
                      placeholder="出生时间"
                    />
                  </Form.Item>
                  <Form.Item name="birth_type" noStyle>
                    <Select
                      allowClear
                      placeholder="生产方式"
                      className="w-[120px]!"
                      options={[...BIRTH_TYPE_OPTIONS]}
                    />
                  </Form.Item>
                </div>
              </Form.Item>

              <Form.Item label="手机号" name="patient_telno" className="mb-2!">
                <Input allowClear />
              </Form.Item>

              <Form.Item label="民族" name="race_code" className="mb-3!">
                    <DictSelect
                      dictName={DICT.RACE}
                      placeholder="请选择民族"
                      className="w-full"
                      valueLabel={raceName}
                      onNameChange={(name) =>
                        basicForm.setFieldValue("race_name", name)
                      }
                    />
              </Form.Item>
              <Form.Item name="race_name" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="sync_current_address"
                valuePropName="checked"
                hidden
              >
                <Checkbox />
              </Form.Item>
              <Form.Item
                name="native_address"
                className="mb-2!"
                label={null}
                colon={false}
                labelCol={{ flex: "0px" }}
                wrapperCol={{ flex: 1 }}
              >
                <AddressFields label="籍贯" showDetail={false} />
              </Form.Item>

              <Form.Item
                name="current_address"
                className="mb-3!"
                label={null}
                colon={false}
                labelCol={{ flex: "0px" }}
                wrapperCol={{ flex: 1 }}
              >
                <AddressFields
                  label="现住址"
                  showSameCheckbox
                  sameChecked={syncCurrentAddress}
                  onSameChange={handleSyncCurrentAddress}
                />
              </Form.Item>

              <InsurancePanel
                disabled={saving}
                patientId={patientProperty?.patient_id ?? patientId}
                visitId={activeVisitId}
                visitStatusNonce={visitStatusNonce}
                fromVisit={activeFromVisit}
                insuranceDistrict={statusProperty?.insurance_district}
              />

              <div className="mt-3">
                {isCreateMode ? (
                  <Tooltip title="保存后进入下一步">
                    <Button
                      type="primary"
                      loading={saving}
                      onClick={() => void handleSaveBasic()}
                    >
                      保存
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => void handleSaveBasic()}
                  >
                    保存
                  </Button>
                )}
              </div>
            </Form>
          </div>

          {/* 未保存时不展示扩展信息等右侧资料，与旧建档页一致 */}
          {isCreateMode ? (
            <div className="flex min-w-0 flex-1 items-center justify-center px-6 text-center">
              <div>
                <div className="mb-3 text-base">温馨提示</div>
                <p className="mb-0">保存成功后可继续设置详细资料!</p>
              </div>
            </div>
          ) : (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Tabs
              type="card"
              activeKey={activeTab}
              onChange={handleTabChange}
              className="shrink-0 px-2 pt-2 [&_.ant-tabs-nav]:mb-0!"
              items={[
                { key: "extended", label: "扩展信息" },
                { key: "address", label: "地址信息" },
                ...(showCardTab ? [{ key: "card", label: "就诊卡" }] : []),
              ]}
            />
            <div className="mt-2 min-h-0 min-w-0 flex-1 overflow-auto">
              {/* 访问过的 tab 用 hidden 保活，避免卸载后重复请求 / 表单断开 */}
              <div className={activeTab === "extended" ? undefined : "hidden"}>
                <Form
                  form={extendedForm}
                  layout="horizontal"
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  disabled={saving}
                  labelAlign="right"
                >
                  <Form.Item label="国籍" name="country_code" className="mb-2!">
                    <DictSelect
                      dictName={DICT.COUNTRY}
                      className="w-full"
                      valueLabel={countryName}
                      onNameChange={(name) =>
                        extendedForm.setFieldValue("country_name", name)
                      }
                    />
                  </Form.Item>
                  <Form.Item name="country_name" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="文化程度" name="edu_code" className="mb-2!">
                    <DictSelect
                      dictName={DICT.EDU}
                      className="w-full"
                      valueLabel={eduName}
                      onNameChange={(name) =>
                        extendedForm.setFieldValue("edu_name", name)
                      }
                    />
                  </Form.Item>
                  <Form.Item name="edu_name" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="职业" name="work_code" className="mb-2!">
                    <DictSelect
                      dictName={DICT.WORK}
                      className="w-full"
                      valueLabel={workName}
                      onNameChange={(name) =>
                        extendedForm.setFieldValue("work_name", name)
                      }
                    />
                  </Form.Item>
                  <Form.Item name="work_name" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="工作单位" className="mb-2!">
                    <Space.Compact className="w-full">
                      <Form.Item name="work_org" noStyle>
                        <Input allowClear placeholder="工作单位" />
                      </Form.Item>
                      <Form.Item name="work_title" noStyle>
                        <Input allowClear placeholder="职务" />
                      </Form.Item>
                      <Form.Item name="work_telno" noStyle>
                        <Input allowClear placeholder="工作电话" />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                  <Form.Item
                    label="婚姻状态"
                    name="marital_code"
                    className="mb-2!"
                  >
                    <DictSelect
                      dictName={DICT.MARITAL}
                      className="w-full"
                      valueLabel={maritalName}
                      onNameChange={(name) =>
                        extendedForm.setFieldValue("marital_name", name)
                      }
                    />
                  </Form.Item>
                  <Form.Item name="marital_name" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="语种" name="lang_code" className="mb-2!">
                    <DictSelect
                      dictName={DICT.LANG}
                      className="w-full"
                      valueLabel={langName}
                      onNameChange={(name) =>
                        extendedForm.setFieldValue("lang_name", name)
                      }
                    />
                  </Form.Item>
                  <Form.Item name="lang_name" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="信仰" name="faith_name" className="mb-2!">
                    <Input allowClear />
                  </Form.Item>
                  <Form.Item label="ABO血型" name="blood_abo" className="mb-2!">
                    <Radio.Group options={[...BLOOD_ABO_OPTIONS]} />
                  </Form.Item>
                  <Form.Item label="RH血型" name="blood_rh" className="mb-2!">
                    <Radio.Group options={[...BLOOD_RH_OPTIONS]} />
                  </Form.Item>
                  <Form.Item label="合作单位" name="partner_id" className="mb-2!">
                    <PartnerSelect
                      className="w-full"
                      partnerName={partnerName}
                      onNameChange={(name) =>
                        extendedForm.setFieldValue("partner_name", name)
                      }
                    />
                  </Form.Item>
                  <Form.Item name="partner_name" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="身高" className="mb-2!">
                    <Space>
                      <Form.Item name="body_height" noStyle>
                        <InputNumber
                          placeholder="cm"
                          className="w-28!"
                          min={0}
                        />
                      </Form.Item>
                      <span>体重</span>
                      <Form.Item name="body_weight" noStyle>
                        <Input placeholder="kg" className="w-28!" />
                      </Form.Item>
                    </Space>
                  </Form.Item>
                  <Form.Item
                    label="户籍住址"
                    name="hukou_address"
                    className="mb-2!"
                  >
                    <AddressFields label="户籍住址" singleRow />
                  </Form.Item>
                  <Form.Item
                    label="出生地址"
                    name="birth_address"
                    className="mb-3!"
                  >
                    <AddressFields label="出生地址" singleRow />
                  </Form.Item>
                  <div className="mb-2 border-t border-(--app-theme-border) pt-3 text-(length:--app-theme-font-sm, 13px) font-medium">
                    联系人
                  </div>
                </Form>
                <ContactTab
                  ref={contactTabRef}
                  contacts={contactList}
                  patientId={patientProperty?.patient_id ?? patientId}
                  saving={saving}
                  showSave={false}
                  onSave={async (list) => {
                    const ok = await saveContactList(list);
                    if (ok) onSaved?.();
                    return ok;
                  }}
                />
                <div className="mt-3">
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => void handleSaveExtended()}
                  >
                    保存
                  </Button>
                </div>
              </div>

              {visitedTabs.address ? (
                <div className={activeTab === "address" ? undefined : "hidden"}>
                  <AddressInfoTab
                    addresses={addressList}
                    patientId={patientProperty?.patient_id ?? patientId}
                    saving={saving}
                    syncTypes={syncAddressTypes}
                    onSyncTypesChange={setSyncAddressTypes}
                    onSave={async (list) => {
                      const ok = await saveAddressList(list);
                      if (ok) onSaved?.();
                      return ok;
                    }}
                  />
                </div>
              ) : null}

              {showCardTab && visitedTabs.card ? (
                <div className={activeTab === "card" ? undefined : "hidden"}>
                  <CardTab
                    patientId={patientProperty?.patient_id ?? patientId}
                  />
                </div>
              ) : null}
            </div>
          </div>
          )}
        </div>
      </Spin>

      <MatchPatientModal
        open={matchOpen}
        list={matchList}
        onCancel={() => setMatchOpen(false)}
        onContinue={() => {
          continueCreateRef.current = true;
          setMatchOpen(false);
          void handleSaveBasic();
        }}
        onMerged={() => {
          setMatchOpen(false);
          void handleSaveBasic();
        }}
      />

      <VisitSelectModal
        open={visitModalOpen}
        initialPatientId={patientProperty?.patient_id ?? patientId}
        selecting={visitSelecting}
        onClose={() => {
          if (visitSelecting) return;
          setVisitModalOpen(false);
        }}
        onSelect={(row) => void handleSelectVisit(row)}
      />

      <Modal
        title="刷卡更新医保身份"
        open={insuranceModalOpen}
        onCancel={() => setInsuranceModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={"80%"}
      >
        <div className="mb-3 text-[13px] text-(--app-theme-text-secondary)">
          刷卡成功后将更新当前患者的医保身份。
        </div>
        <ReadCardHeader
          showPatientActions={false}
          onReadInfo={handleInsuranceReadInfo}
        />
      </Modal>
    </Card>
  );
};

export default PatientInfo;
