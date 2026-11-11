import { useEffect, useState } from "react";
import { AutoComplete, DatePicker, Form, Modal, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { getCareLevelAPI, newCareAPI } from "../../api";

const DEFAULT_CARE_LEVEL_OPTIONS = [
  {
    value: "特级护理",
    care_level: "9",
    care_content: "以下转特级护理",
  },
  {
    value: "一级护理",
    care_level: "1",
    care_content: "以下转一级护理",
  },
  {
    value: "二级护理",
    care_level: "2",
    care_content: "以下转二级护理",
  },
  {
    value: "三级护理",
    care_level: "3",
    care_content: "以下转三级护理",
  },
] as const;

interface TransferCareLevelProps {
  open: boolean;
  visitId: number;
  userId: string | number;
  userName: string;
  /** 列表已有护理记录时间，用于避开冲突分钟 */
  occupiedCareTimes?: string[];
  onCancel: () => void;
  onSuccess: () => void;
}

/** 当前时间，秒固定为 00 */
function defaultCareTime(): Dayjs {
  return dayjs().second(0).millisecond(0);
}

function formatCareTime(value: Dayjs): string {
  return value.second(0).millisecond(0).format("YYYY-MM-DD HH:mm:ss");
}

function normalizeCareMinute(time?: string | Dayjs | null) {
  if (!time) return "";
  if (dayjs.isDayjs(time)) {
    return time.format("YYYY-MM-DD HH:mm");
  }
  return String(time).trim().slice(0, 16);
}

function buildOccupiedMinuteSet(times: string[] = []) {
  return new Set(
    times.map((item) => normalizeCareMinute(item)).filter(Boolean),
  );
}

/** 从候选时间起，跳过已占用分钟，得到下一可用时间 */
function resolveNonConflictCareTime(
  preferred: Dayjs,
  occupiedCareTimes: string[] = [],
) {
  const taken = buildOccupiedMinuteSet(occupiedCareTimes);
  let candidate = preferred.second(0).millisecond(0);
  for (let i = 0; i < 1440; i++) {
    if (!taken.has(candidate.format("YYYY-MM-DD HH:mm"))) {
      return candidate;
    }
    candidate = candidate.add(1, "minute");
  }
  return candidate;
}

function findDefaultByName(orderName: string) {
  return DEFAULT_CARE_LEVEL_OPTIONS.find((item) => item.value === orderName);
}

export default function TransferCareLevel(props: TransferCareLevelProps) {
  const {
    open,
    visitId,
    userId,
    userName,
    occupiedCareTimes = [],
    onCancel,
    onSuccess,
  } = props;
  const [form] = Form.useForm<{ care_time: Dayjs; care_level_name: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);

  useEffect(() => {
    if (!open) return;

    const current = form.getFieldValue("care_time") as Dayjs | undefined;
    const preferred =
      current && dayjs.isDayjs(current) && current.isValid()
        ? current
        : defaultCareTime();
    const taken = buildOccupiedMinuteSet(occupiedCareTimes);
    const currentMinute = normalizeCareMinute(preferred);
    // 首次打开或当前分钟已被列表占用时，自动顺延到下一可用分钟
    if (!current || !currentMinute || taken.has(currentMinute)) {
      form.setFieldsValue({
        care_time: resolveNonConflictCareTime(preferred, occupiedCareTimes),
      });
    }
  }, [open, occupiedCareTimes, form]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadCareLevels = async () => {
      if (!visitId) return;
      setLoadingLevels(true);
      try {
        const res = await getCareLevelAPI({
          visit_id: visitId,
          item_type: "护理等级",
        });
        if (cancelled) return;
        if (res.code !== 0) {
          message.error(`${res.message ?? ""}${res.hint ?? ""}`);
          return;
        }
        const row = (res.row_list ?? []).find(
          (item: { order_name?: string }) => !!item.order_name?.trim(),
        );
        if (!row) return;

        const orderName = row.order_name.trim();
        const matched = findDefaultByName(orderName);
        // 仅当 order_name 与下拉一致时默认选中；不一致则不回显
        if (matched) {
          form.setFieldsValue({ care_level_name: matched.value });
        }
      } catch {
        if (!cancelled) message.error("加载护理等级失败");
      } finally {
        if (!cancelled) setLoadingLevels(false);
      }
    };
    void loadCareLevels();

    return () => {
      cancelled = true;
    };
  }, [open, visitId, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const name = values.care_level_name?.trim();
      if (!name) {
        message.warning("请选择或输入护理等级");
        return;
      }

      const careTimeText = formatCareTime(values.care_time);
      if (
        buildOccupiedMinuteSet(occupiedCareTimes).has(
          normalizeCareMinute(careTimeText),
        )
      ) {
        message.warning("存在相同时间，请选择其他时间");
        form.setFieldsValue({
          care_time: resolveNonConflictCareTime(
            values.care_time,
            occupiedCareTimes,
          ),
        });
        return;
      }

      const selected = findDefaultByName(name);
      const careLevelRaw = selected?.care_level ?? name;
      const careContent = selected?.care_content ?? `以下转${name}`;
      const careLevelNum = Number(careLevelRaw);

      setSubmitting(true);
      const res = await newCareAPI({
        visit_id: visitId,
        user_id: Number(userId),
        user_name: userName,
        care_time: careTimeText,
        care_level: Number.isFinite(careLevelNum) ? careLevelNum : careLevelRaw,
        care_content: careContent,
        care_tag: "[TRANSFER]",
      });

      if (res.code == 0) {
        message.success("转护理等级成功");
        onSuccess();
      } else {
        message.error(res.message || "转护理等级失败");
      }
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      message.error("转护理等级失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="转护理等级"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okText="确定"
      cancelText="取消"
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item
          label="时间"
          name="care_time"
          rules={[{ required: true, message: "请选择时间" }]}
        >
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
            allowClear={false}
          />
        </Form.Item>
        <Form.Item
          label="护理等级"
          name="care_level_name"
          rules={[{ required: true, message: "请选择或输入护理等级" }]}
        >
          <AutoComplete
            options={DEFAULT_CARE_LEVEL_OPTIONS.map((item) => ({
              value: item.value,
            }))}
            placeholder="请选择或输入护理等级"
            allowClear
            filterOption={(input, option) =>
              String(option?.value ?? "")
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            disabled={loadingLevels}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
