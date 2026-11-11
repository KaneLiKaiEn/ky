import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tooltip,
  message,
} from "antd";
import {
  attachEmrStakeholder,
  detachEmrStakeholder,
  getEmrProperty,
  getEmrStakeholderList,
  signEmrStakeholder,
} from "@/api/emr";
import { getParamValue } from "@/api/sys";
import { getConsentImage, getSignImage } from "@/api/ca";
import { getDocVisit2Emr } from "@/api/doc";
import { getSessionInfo } from "@/api/auth";
import { getUserList2, getUserWriteImage, retrieveUserList } from "@/api/user";
import type { SessionRow } from "@/types/auth";
import type {
  EmrConsentRow,
  EmrConsentSignRow,
  EmrStakeholderRow,
} from "@/types/emr";
import type { UserRow } from "@/types/user";
import debounce from "lodash/debounce";
import { getSessionId } from "comm/session";
import SignPadModal from "./SignPadModal";
import SignQrModal from "./SignQrModal";
import { useEmrConsent } from "../hooks/useEmrConsent";

export interface EmrStakeholderSignProps {
  emrId?: number;
  visitId?: number;
  emrStatus?: string;
  onChanged?: () => void | Promise<void>;
  className?: string;
}

const AUTHOR_TYPE = "AUTHOR";
const AUTHOR_NAME = "作者";
const SIGN_QR_POLL_MS = 2000;

const isAuthor = (item: EmrStakeholderRow) =>
  item.stakeholder_type === AUTHOR_TYPE ||
  item.stakeholder_name === AUTHOR_NAME;

const canOperate = (tag: string | undefined, workType: string | undefined) => {
  const text = tag ?? "";
  const hasDoctorTag = text.includes("医生可操作");
  const hasNurseTag = text.includes("护士可操作");
  if (!hasDoctorTag && !hasNurseTag) return true;
  if (hasDoctorTag && hasNurseTag) {
    return workType === "DOCTOR" || workType === "NURSE";
  }
  if (hasDoctorTag) return workType === "DOCTOR";
  return workType === "NURSE";
};

type StampUser = Pick<UserRow, "user_id" | "user_name"> & {
  user_id: number;
};

const toStampUser = (
  user: UserRow | EmrStakeholderRow,
): StampUser | undefined => {
  if (user.user_id == null) return undefined;
  return {
    user_id: user.user_id,
    user_name: user.user_name,
  };
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("读取 PDF 失败"));
    reader.readAsDataURL(blob);
  });

const promptStakeholderPwd = () =>
  new Promise<string | undefined>((resolve) => {
    let pwd = "";
    Modal.confirm({
      title: "请输入签章人密码",
      icon: null,
      content: (
        <Input.Password
          autoFocus
          placeholder="请输入密码"
          onChange={(e) => {
            pwd = e.target.value;
          }}
        />
      ),
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        if (!pwd.trim()) {
          message.warning("请输入密码");
          return Promise.reject();
        }
        resolve(pwd);
      },
      onCancel: () => resolve(undefined),
    });
  });

const EmrStakeholderSign: React.FC<EmrStakeholderSignProps> = ({
  emrId,
  visitId,
  emrStatus,
  onChanged,
  className,
}) => {
  const {
    consentList,
    consentProperty,
    setConsentProperty,
    signList,
    submitting: signSubmitting,
    submitSigns,
  } = useEmrConsent(emrId);
  const [currentUser, setCurrentUser] = useState<SessionRow | null>(null);
  const [signPadOpen, setSignPadOpen] = useState(false);
  const [signQrOpen, setSignQrOpen] = useState(false);
  const [signQrImage, setSignQrImage] = useState<string>();
  const [qrSource, setQrSource] = useState<"stakeholder" | "consent">(
    "stakeholder",
  );
  const [consentCount, setConsentCount] = useState(0);
  const [consentSign, setConsentSign] = useState(0);
  const [patientSigning, setPatientSigning] = useState(false);
  const [stakeholderList, setStakeholderList] = useState<EmrStakeholderRow[]>(
    [],
  );
  const [signImages, setSignImages] = useState<Record<number, string>>({});
  const [actingId, setActingId] = useState<number>();
  const [userOptions, setUserOptions] = useState<StampUser[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const userSearchSeqRef = useRef(0);
  const defaultUsersLoadedRef = useRef(false);
  const stakeholderListRef = useRef(stakeholderList);
  stakeholderListRef.current = stakeholderList;
  const signPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signPollStakeholderIdRef = useRef<number | undefined>(undefined);
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const notifyChanged = useCallback(async () => {
    await onChangedRef.current?.();
  }, []);

  const refreshConsentStatus = useCallback(async () => {
    if (!emrId || emrId <= 0) {
      setConsentCount(0);
      setConsentSign(0);
      return;
    }
    try {
      const res = await getEmrProperty({ emr_id: emrId });
      const property = res.emr_property;
      setConsentCount(property?.consent_count ?? 0);
      setConsentSign(property?.consent_sign ?? 0);
    } catch {
      setConsentCount(0);
      setConsentSign(0);
    }
  }, [emrId]);

  const loadEmrPdfBase64 = async () => {
    if (!emrId) {
      throw new Error("缺少病历信息，无法签名");
    }
    const blob = await getDocVisit2Emr({
      session_id: getSessionId() ?? "",
      emr_id: emrId,
    });
    const pdfBlob =
      blob instanceof Blob
        ? blob
        : new Blob([blob], { type: "application/pdf" });
    if (pdfBlob.size === 0 || pdfBlob.type.includes("json")) {
      throw new Error("无法获取当前 PDF");
    }
    const dataContent = await blobToBase64(pdfBlob);
    if (!dataContent) {
      throw new Error("无法获取当前 PDF");
    }
    return dataContent;
  };

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    void getSessionInfo({ session_id: sessionId }).then((res) => {
      if (res.code === 0) {
        setCurrentUser(res.session_info ?? null);
      }
    });
  }, []);

  const loadStakeholderList = useCallback(async () => {
    if (!emrId || emrId <= 0) {
      setStakeholderList([]);
      setSignImages({});
      setUserOptions([]);
      defaultUsersLoadedRef.current = false;
      return;
    }
    try {
      const res = await getEmrStakeholderList({ emr_id: emrId });
      const rows = res.row_list ?? [];
      const list = (
        emrStatus === "COMMIT" ? rows : rows.filter((item) => !isAuthor(item))
      )
        .slice()
        .reverse();
      setStakeholderList(list);
      setUserOptions((prev) => {
        const userMap = new Map<number, StampUser>();
        prev.forEach((user) => userMap.set(user.user_id, user));
        list.forEach((item) => {
          const user = toStampUser(item);
          if (user) userMap.set(user.user_id, user);
        });
        return Array.from(userMap.values());
      });
      const entries = await Promise.all(
        list.map(async (item) => {
          if (!item.stakeholder_id || !item.user_id || !item.sign_time) {
            return [item.stakeholder_id, ""] as const;
          }
          const imageRes = await getUserWriteImage({ user_id: item.user_id });
          if (imageRes.code !== 0 || !imageRes.image_content) {
            return [item.stakeholder_id, ""] as const;
          }
          return [
            item.stakeholder_id,
            `data:${imageRes.image_format};base64,${imageRes.image_content}`,
          ] as const;
        }),
      );
      const next: Record<number, string> = {};
      entries.forEach(([id, src]) => {
        if (id != null && src) next[id] = src;
      });
      setSignImages(next);
    } catch {
      setStakeholderList([]);
      setSignImages({});
    }
  }, [emrId, emrStatus]);

  useEffect(() => {
    void loadStakeholderList();
  }, [loadStakeholderList]);

  useEffect(() => {
    void refreshConsentStatus();
  }, [refreshConsentStatus]);

  useEffect(() => {
    return () => {
      if (signPollTimerRef.current) {
        clearInterval(signPollTimerRef.current);
        signPollTimerRef.current = null;
      }
      userSearchSeqRef.current += 1;
    };
  }, []);

  const applyUserList = (userList: UserRow[] | undefined) => {
    const userMap = new Map<number, StampUser>();
    stakeholderListRef.current.forEach((item) => {
      const user = toStampUser(item);
      if (user) userMap.set(user.user_id, user);
    });
    (userList ?? []).forEach((item) => {
      const user = toStampUser(item);
      if (user) userMap.set(user.user_id, user);
    });
    setUserOptions(Array.from(userMap.values()));
  };

  const loadDefaultUsers = async () => {
    const seq = ++userSearchSeqRef.current;
    setUserSearching(true);
    try {
      const deptId = currentUser?.dept_id;
      if (deptId == null || deptId <= 0) {
        throw new Error("当前会话缺少科室信息");
      }
      const res = await getUserList2({
        dept_id_list: [deptId],
      });
      if (seq !== userSearchSeqRef.current) return;
      if (res.code !== 0) {
        throw new Error(res.message || "人员查询失败");
      }
      applyUserList(res.user_list);
      defaultUsersLoadedRef.current = true;
    } catch (error) {
      if (seq !== userSearchSeqRef.current) return;
      message.error(error instanceof Error ? error.message : "人员查询失败");
    } finally {
      if (seq === userSearchSeqRef.current) setUserSearching(false);
    }
  };

  const searchUsers = async (input: string) => {
    const seq = ++userSearchSeqRef.current;
    setUserSearching(true);
    try {
      const res = await retrieveUserList({
        retrieve_input: input.trim(),
        retrieve_limit: 20,
      });
      if (seq !== userSearchSeqRef.current) return;
      if (res.code !== 0) {
        throw new Error(res.message || "人员查询失败");
      }
      applyUserList(res.user_list);
    } catch (error) {
      if (seq !== userSearchSeqRef.current) return;
      message.error(error instanceof Error ? error.message : "人员查询失败");
    } finally {
      if (seq === userSearchSeqRef.current) setUserSearching(false);
    }
  };

  const loadDefaultUsersRef = useRef(loadDefaultUsers);
  loadDefaultUsersRef.current = loadDefaultUsers;
  const searchUsersRef = useRef(searchUsers);
  searchUsersRef.current = searchUsers;

  const handleUserSearch = useMemo(
    () =>
      debounce((input: string) => {
        if (!input.trim()) {
          void loadDefaultUsersRef.current();
          return;
        }
        void searchUsersRef.current(input);
      }, 300),
    [],
  );

  useEffect(
    () => () => {
      handleUserSearch.cancel();
    },
    [handleUserSearch],
  );

  const handleStampSelect = async (
    item: EmrStakeholderRow,
    userId?: number,
  ) => {
    if (!userId || item.user_id === userId) return;
    const selected = userOptions.find((user) => user.user_id === userId);
    if (!emrId || !item.stakeholder_id || !selected) {
      message.error("缺少相关人信息，无法签章");
      return;
    }
    setActingId(item.stakeholder_id);
    try {
      const res = await attachEmrStakeholder({
        emr_id: emrId,
        stakeholder_id: item.stakeholder_id,
        user_id: selected.user_id,
        user_name: selected.user_name,
      });
      if (res.code !== 0) {
        message.error(res.message || "签章失败");
        return;
      }
      message.success("完成签名");
      await loadStakeholderList();
      await notifyChanged();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "签章失败");
    } finally {
      setActingId(undefined);
    }
  };

  const handleDetach = async (item: EmrStakeholderRow) => {
    if (!item.stakeholder_id) return;
    setActingId(item.stakeholder_id);
    try {
      const res = await detachEmrStakeholder({
        stakeholder_id: item.stakeholder_id,
      });
      if (res.code !== 0) {
        message.error(res.message || "删除失败");
        return;
      }
      message.success("删除成功");
      await loadStakeholderList();
      await notifyChanged();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setActingId(undefined);
    }
  };

  const handleClearStakeholder = (item: EmrStakeholderRow) => {
    if (!item.stakeholder_id) return;
    Modal.confirm({
      title: "确认删除该相关人？",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => handleDetach(item),
    });
  };

  const stopSignPoll = useCallback(() => {
    if (signPollTimerRef.current) {
      clearInterval(signPollTimerRef.current);
      signPollTimerRef.current = null;
    }
    signPollStakeholderIdRef.current = undefined;
  }, []);

  const refreshAfterStakeholderSign = useCallback(async () => {
    await loadStakeholderList();
    await notifyChanged();
  }, [loadStakeholderList, notifyChanged]);

  const applyStakeholderSign = useCallback(
    async (
      stakeholderId: number,
      userId: number,
      signId?: number,
      signTime?: string,
    ) => {
      const isSelf = userId === currentUser?.user_id;
      let stakeholderPwd: string | undefined;
      if (!isSelf) {
        stakeholderPwd = await promptStakeholderPwd();
        if (stakeholderPwd == null) return;
      }

      const res = await signEmrStakeholder({
        stakeholder_id: stakeholderId,
        ...(signId != null && signId > 0 ? { sign_id: signId } : {}),
        ...(signTime ? { sign_time: signTime } : {}),
        ...(!isSelf ? { stakeholder_pwd: stakeholderPwd } : {}),
      });
      if (res.code !== 0) {
        throw new Error(res.message || "签名失败");
      }
      message.success("签名成功");
      await refreshAfterStakeholderSign();
    },
    [currentUser?.user_id, refreshAfterStakeholderSign],
  );

  const startSignPoll = useCallback(
    (stakeholderId: number) => {
      stopSignPoll();
      signPollStakeholderIdRef.current = stakeholderId;
      signPollTimerRef.current = setInterval(() => {
        if (!emrId) return;
        void (async () => {
          try {
            const res = await getEmrStakeholderList({ emr_id: emrId });
            const row = (res.row_list ?? []).find(
              (item) =>
                item.stakeholder_id === signPollStakeholderIdRef.current,
            );
            if (!row?.sign_time) return;
            stopSignPoll();
            setSignQrOpen(false);
            setSignQrImage(undefined);
            setQrSource("stakeholder");
            message.success("签名成功");
            await refreshAfterStakeholderSign();
          } catch {
            // 轮询失败时继续下一次
          }
        })();
      }, SIGN_QR_POLL_MS);
    },
    [emrId, refreshAfterStakeholderSign, stopSignPoll],
  );

  const handleSignQrClose = useCallback(async () => {
    const source = qrSource;
    const stakeholderId = signPollStakeholderIdRef.current;
    stopSignPoll();
    setSignQrOpen(false);
    setSignQrImage(undefined);
    setQrSource("stakeholder");
    if (source === "consent") {
      await refreshConsentStatus();
      await notifyChanged();
      return;
    }
    if (!emrId) return;
    try {
      const res = await getEmrStakeholderList({ emr_id: emrId });
      const row = (res.row_list ?? []).find(
        (item) => item.stakeholder_id === stakeholderId,
      );
      if (row?.sign_time) {
        message.success("签名成功");
        await refreshAfterStakeholderSign();
        return;
      }
      await loadStakeholderList();
    } catch {
      await loadStakeholderList();
    }
  }, [
    emrId,
    loadStakeholderList,
    notifyChanged,
    qrSource,
    refreshAfterStakeholderSign,
    refreshConsentStatus,
    stopSignPoll,
  ]);

  const handleStakeholderSign = async (item: EmrStakeholderRow) => {
    if (!item.stakeholder_id) {
      message.error("缺少相关人信息，无法签名");
      return;
    }
    if (!item.user_id) {
      message.warning("请先选择签章人员");
      return;
    }
    stopSignPoll();
    setSignQrOpen(false);
    setSignQrImage(undefined);
    setQrSource("stakeholder");
    setActingId(item.stakeholder_id);
    try {
      const paramRes = await getParamValue({ item_code: "emr_sign_ca" });
      if (paramRes.code !== 0) {
        throw new Error(paramRes.message || "获取签名参数失败");
      }
      if (paramRes.item_value === "1") {
        const dataContent = await loadEmrPdfBase64();
        const imageRes = await getSignImage({
          user_id: item.user_id,
          visit_id: visitId,
          data_format: "PDF",
          data_encode: "base64",
          data_content: dataContent,
          link_name: "emr",
          link_value: emrId,
        });
        if (imageRes.code !== 0) {
          throw new Error(imageRes.message || "获取ca签名信息失败");
        }
        if ((imageRes.sign_id ?? 0) > 0) {
          await applyStakeholderSign(
            item.stakeholder_id,
            item.user_id,
            imageRes.sign_id,
            imageRes.sign_time,
          );
        } else {
          const src = imageRes.image_content
            ? `data:${imageRes.image_format || "image/png"};base64,${imageRes.image_content}`
            : undefined;
          if (!src) {
            throw new Error("未返回签名二维码");
          }
          setSignQrImage(src);
          setQrSource("stakeholder");
          setSignQrOpen(true);
          startSignPoll(item.stakeholder_id);
        }
      } else {
        await applyStakeholderSign(item.stakeholder_id, item.user_id);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "签名失败");
    } finally {
      setActingId(undefined);
    }
  };

  const handleSignConfirm = async (
    property: EmrConsentRow,
    nextSignList: EmrConsentSignRow[],
  ) => {
    return submitSigns(property, nextSignList);
  };

  const handleSignPadClose = async () => {
    setSignPadOpen(false);
    await refreshConsentStatus();
    await notifyChanged();
  };

  const handlePatientSign = async () => {
    setPatientSigning(true);
    try {
      const paramRes = await getParamValue({ item_code: "emr_consent_ca" });
      if (paramRes.code !== 0) {
        throw new Error(paramRes.message || "获取签名参数失败");
      }
      if (paramRes.item_value === "1") {
        const dataContent = await loadEmrPdfBase64();
        const imageRes = await getConsentImage({
          visit_id: visitId,
          data_format: "PDF",
          data_encode: "base64",
          data_content: dataContent,
          link_name: "emr",
          link_value: emrId,
          row_list: consentList.map((item) => ({
            consent_id: item.consent_id,
            consent_code: item.consent_code,
            consent_title: item.consent_title,
            consent_desc: item.consent_desc,
            consent_option: item.consent_option,
          })),
        });
        if (imageRes.code !== 0) {
          throw new Error(imageRes.message || "获取患者签名二维码失败");
        }
        const src = imageRes.image_content
          ? `data:${imageRes.image_format || "image/png"};base64,${imageRes.image_content}`
          : undefined;
        if (src) {
          setSignQrImage(src);
          setQrSource("consent");
          setSignQrOpen(true);
          return;
        }
        if ((imageRes.sign_id ?? 0) > 0) {
          await refreshConsentStatus();
          await notifyChanged();
          return;
        }
        throw new Error("未返回签名二维码");
      }
      setSignPadOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "患者签名失败");
    } finally {
      setPatientSigning(false);
    }
  };

  const isCommitted = emrStatus === "COMMIT";
  const showPatientSign = isCommitted && consentCount > 0;
  const patientSigned =
    showPatientSign && consentCount === consentSign;

  if (stakeholderList.length === 0 && !showPatientSign) {
    return null;
  }

  return (
    <>
      <div
        className={[
          "flex items-center justify-between gap-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Space wrap size="small">
          {stakeholderList.map((item) => {
            const cannotOperate =
              !currentUser?.user_id ||
              !canOperate(item.stakeholder_tag, currentUser?.work_type);
            const selectDisabled = isCommitted || cannotOperate;
            const imageSrc =
              item.stakeholder_id != null && item.sign_time
                ? signImages[item.stakeholder_id]
                : undefined;
            const stampSelect = (
              <Select
                showSearch
                allowClear
                value={item.user_id}
                options={userOptions}
                fieldNames={{ value: "user_id", label: "user_name" }}
                filterOption={false}
                loading={userSearching || actingId === item.stakeholder_id}
                placeholder="请选择签章人员"
                style={{ width: 120 }}
                disabled={selectDisabled}
                onFocus={() => {
                  if (!defaultUsersLoadedRef.current) {
                    void loadDefaultUsers();
                  }
                }}
                onSearch={handleUserSearch}
                onChange={(userId?: number) => {
                  if (userId == null) {
                    void handleClearStakeholder(item);
                    return;
                  }
                  void handleStampSelect(item, userId);
                }}
                notFoundContent={
                  userSearching ? <Spin size="small" /> : "暂无人员"
                }
              />
            );
            return (
              <Space key={item.stakeholder_id} size={4} align="center">
                <span>{`${item.stakeholder_name ?? ""}：`.trim()}</span>
                {!isCommitted && cannotOperate && currentUser?.user_id ? (
                  <Tooltip title="当前账号不可操作">
                    <span>{stampSelect}</span>
                  </Tooltip>
                ) : (
                  stampSelect
                )}
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    className="block h-8 max-w-20 object-contain rounded bg-white px-0.5"
                  />
                ) : null}
                {isCommitted && !item.sign_time ? (
                  <Tooltip
                    title={
                      !item.user_id
                        ? "请先选择签章人员"
                        : cannotOperate && currentUser?.user_id
                          ? "当前账号不可操作"
                          : undefined
                    }
                  >
                    <span>
                      <Button
                        size="small"
                        disabled={cannotOperate || !item.user_id}
                        loading={actingId === item.stakeholder_id}
                        onClick={() => void handleStakeholderSign(item)}
                      >
                        签名
                      </Button>
                    </span>
                  </Tooltip>
                ) : null}
              </Space>
            );
          })}
        </Space>
        <Space>
          {showPatientSign && (
            <Button
              size="small"
              loading={patientSigning}
              className={
                patientSigned
                  ? "!border-(--app-theme-success) !bg-(--app-theme-success-bg) !text-(--app-theme-success)"
                  : undefined
              }
              onClick={() => void handlePatientSign()}
            >
              {patientSigned ? "患者签名（已签）" : "患者签名"}
            </Button>
          )}
        </Space>
      </div>
      <SignQrModal
        open={signQrOpen}
        title={qrSource === "consent" ? "患者签名" : "CA 签名"}
        imageSrc={signQrImage}
        onCancel={() => void handleSignQrClose()}
      />
      <SignPadModal
        open={signPadOpen}
        visitId={visitId}
        consentList={consentList}
        consentProperty={consentProperty}
        signList={signList}
        submitting={signSubmitting}
        onCancel={() => void handleSignPadClose()}
        onConfirm={handleSignConfirm}
        onPropertyChange={setConsentProperty}
      />
    </>
  );
};

export default EmrStakeholderSign;
