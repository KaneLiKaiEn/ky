import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Modal, Space, Spin, Tag, Tooltip, message } from "antd";
import {
  attachEmrStakeholder,
  detachEmrStakeholder,
  getEmrStakeholderList,
} from "@/api/emr";
import { getUserWriteImage } from "@/api/user";
import UserMultipleList from "@/pages/UserMultipleList";
import type { SelectedUser } from "@/pages/UserMultipleList";
import type { EmrStakeholderRow } from "@/types/emr";

export interface StampModalProps {
  open: boolean;
  emrId?: number;
  userId?: number;
  userName?: string;
  workType?: string;
  onCancel: () => void;
  onChanged?: () => void;
}

const AUTHOR_TYPE = "AUTHOR";
const AUTHOR_NAME = "作者";

const isAuthor = (item: EmrStakeholderRow) =>
  item.stakeholder_type === AUTHOR_TYPE || item.stakeholder_name === AUTHOR_NAME;

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

const StampModal: React.FC<StampModalProps> = ({
  open,
  emrId,
  userId,
  userName,
  workType,
  onCancel,
  onChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [stakeholderList, setStakeholderList] = useState<EmrStakeholderRow[]>(
    [],
  );
  const [signImages, setSignImages] = useState<Record<number, string>>({});
  const [actingId, setActingId] = useState<number>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentStakeholder, setCurrentStakeholder] =
    useState<EmrStakeholderRow>();

  const loadImages = async (list: EmrStakeholderRow[]) => {
    const entries = await Promise.all(
      list.map(async (item) => {
        if (!item.stakeholder_id || !item.user_id) {
          return [item.stakeholder_id, ""] as const;
        }
        const res = await getUserWriteImage({ user_id: item.user_id });
        if (res.code !== 0 || !res.image_content) {
          return [item.stakeholder_id, ""] as const;
        }
        return [
          item.stakeholder_id,
          `data:${res.image_format};base64,${res.image_content}`,
        ] as const;
      }),
    );
    const next: Record<number, string> = {};
    entries.forEach(([id, src]) => {
      if (id != null && src) next[id] = src;
    });
    setSignImages(next);
  };

  const reload = useCallback(async () => {
    if (!emrId || emrId <= 0) {
      setStakeholderList([]);
      setSignImages({});
      return;
    }

    setLoading(true);
    try {
      const res = await getEmrStakeholderList({ emr_id: emrId });
      if (res.code !== 0) {
        message.error(res.message || "加载签章列表失败");
        setStakeholderList([]);
        setSignImages({});
        return;
      }
      const list = (res.row_list ?? []).filter((item) => !isAuthor(item));
      setStakeholderList(list);
      await loadImages(list);
    } catch (error) {
      setStakeholderList([]);
      setSignImages({});
      message.error(
        error instanceof Error ? error.message : "加载签章列表失败",
      );
    } finally {
      setLoading(false);
    }
  }, [emrId]);

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, reload]);

  const handleAttach = async (
    item: EmrStakeholderRow,
    attachUserId: number,
    attachUserName?: string,
  ) => {
    if (!emrId || !item.stakeholder_id) {
      message.error("缺少相关人信息，无法签章");
      return;
    }
    setActingId(item.stakeholder_id);
    try {
      const res = await attachEmrStakeholder({
        emr_id: emrId,
        stakeholder_id: item.stakeholder_id,
        user_id: attachUserId,
        user_name: attachUserName,
      });
      if (res.code !== 0) {
        message.error(res.message || "签章失败");
        return;
      }
      message.success("完成签名");
      await reload();
      onChanged?.();
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
        message.error(res.message || "删除签章失败");
        return;
      }
      message.success("删除签章成功");
      await reload();
      onChanged?.();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除签章失败");
    } finally {
      setActingId(undefined);
    }
  };

  const handlePickUser = (users: SelectedUser[]) => {
    const selected = users[0];
    setPickerOpen(false);
    if (!currentStakeholder) return;
    if (!selected?.user_id) {
      message.warning("请选择相关人员");
      return;
    }
    void handleAttach(
      currentStakeholder,
      selected.user_id,
      selected.user_name,
    );
  };

  const openPicker = (item: EmrStakeholderRow) => {
    setCurrentStakeholder(item);
    setPickerOpen(true);
  };

  return (
    <>
      <Modal
        title="签章"
        open={open}
        onCancel={onCancel}
        footer={null}
        centered
        width={640}
        destroyOnHidden
      >
        <Spin spinning={loading}>
          {stakeholderList.length === 0 ? (
            <Empty description="暂无相关人签章" />
          ) : (
            <div className="flex flex-col gap-3">
              {stakeholderList.map((item) => {
                const disabled = !canOperate(item.stakeholder_tag, workType);
                const imageSrc =
                  item.stakeholder_id != null
                    ? signImages[item.stakeholder_id]
                    : undefined;
                const acting = actingId === item.stakeholder_id;
                const signed = Boolean(item.user_id);
                const card = (
                  <div
                    className={`flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-3 ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.stakeholder_name}
                        </span>
                        <Tag color={signed ? "success" : "default"}>
                          {signed ? "已签" : "未签"}
                        </Tag>
                      </div>
                      <div className="mt-1 truncate text-gray-500">
                        {item.user_name || "未指定人员"}
                      </div>
                    </div>
                    <div className="flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-white">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">未签名</span>
                      )}
                    </div>
                    <Space orientation="vertical" size={4}>
                      <Button
                        type="primary"
                        size="small"
                        disabled={disabled || !userId}
                        loading={acting}
                        onClick={() => {
                          if (!userId) return;
                          void handleAttach(item, userId, userName);
                        }}
                      >
                        签章
                      </Button>
                      <Button
                        size="small"
                        disabled={disabled}
                        onClick={() => openPicker(item)}
                      >
                        换人
                      </Button>
                      {signed ? (
                        <Button
                          type="text"
                          size="small"
                          danger
                          disabled={disabled}
                          loading={acting}
                          onClick={() => void handleDetach(item)}
                        >
                          删除
                        </Button>
                      ) : null}
                    </Space>
                  </div>
                );

                return (
                  <div key={item.stakeholder_id}>
                    {disabled ? (
                      <Tooltip title="当前账号不可操作">{card}</Tooltip>
                    ) : (
                      card
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Spin>
      </Modal>
      <UserMultipleList
        open={pickerOpen}
        title="请选择签名人员"
        value={
          currentStakeholder?.user_id
            ? [
                {
                  user_id: currentStakeholder.user_id,
                  user_name: currentStakeholder.user_name,
                  dept_id: currentStakeholder.dept_id,
                  dept_name: currentStakeholder.dept_name,
                  work_level: currentStakeholder.work_level,
                },
              ]
            : []
        }
        onCancel={() => setPickerOpen(false)}
        onOk={handlePickUser}
      />
    </>
  );
};

export default StampModal;
