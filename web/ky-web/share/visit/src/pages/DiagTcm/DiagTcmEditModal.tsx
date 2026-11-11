import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import debounce from "lodash/debounce";
import { retrieveBingListAPI, retrieveZhengListAPI } from "@/api/diag";
import type {
  BingItemRow,
  DiagTcmApiType,
  DiagTcmRow,
  ZhengItemRow,
} from "@/types/diag";

export interface DiagTcmFormValues {
  bing_id?: number;
  bing_name?: string;
  bing_code?: string;
  bing_desc?: string;
  zheng_id?: number;
  zheng_name?: string;
  zheng_code?: string;
  zheng_desc?: string;
  diag_status?: string;
}

type DiagDictOption = {
  value: number;
  label: string;
  item_id: number;
  item_name: string;
  item_code: string;
};

export const DIAG_TCM_STATUS_OPTIONS = [
  { label: "确诊", value: "CONFIRM" },
  { label: "疑似", value: "DOUBT" },
];

export interface DiagTcmEditModalProps {
  open: boolean;
  saving?: boolean;
  title: string;
  diagType: DiagTcmApiType;
  record?: DiagTcmRow | null;
  orgId: number;
  onCancel: () => void;
  /** closeAfterSave 为 false 时保存后不关弹窗，便于连续录入 */
  onSubmit: (
    values: DiagTcmFormValues,
    closeAfterSave: boolean,
  ) => boolean | Promise<boolean>;
}

const getEmptyFormValues = (): DiagTcmFormValues => ({
  bing_id: undefined,
  bing_name: undefined,
  bing_code: undefined,
  bing_desc: undefined,
  zheng_id: undefined,
  zheng_name: undefined,
  zheng_code: undefined,
  zheng_desc: undefined,
  diag_status: "CONFIRM",
});

const toDictOption = (
  id?: number,
  name?: string,
  code?: string,
): DiagDictOption | null => {
  if (id == null || id <= 0) return null;
  return {
    value: id,
    label: name ?? "",
    item_id: id,
    item_name: name ?? "",
    item_code: code ?? "",
  };
};

const mergeCurrentOption = (
  list: DiagDictOption[],
  current?: DiagDictOption | null,
) => {
  if (!current) return list;
  if (list.some((item) => item.item_id === current.item_id)) return list;
  return [current, ...list];
};

const mapBingItem = (item: BingItemRow): DiagDictOption => {
  const item_id = item.item_id ?? item.bing_id ?? 0;
  const item_name = item.item_name ?? item.bing_name ?? "";
  const item_code = item.item_code ?? item.bing_code ?? "";
  return { value: item_id, label: item_name, item_id, item_name, item_code };
};

const mapZhengItem = (item: ZhengItemRow): DiagDictOption => {
  const item_id = item.item_id ?? item.zheng_id ?? 0;
  const item_name = item.item_name ?? item.zheng_name ?? "";
  const item_code = item.item_code ?? item.zheng_code ?? "";
  return { value: item_id, label: item_name, item_id, item_name, item_code };
};

const DiagTcmEditModal = ({
  open,
  saving,
  title,
  record,
  orgId,
  onCancel,
  onSubmit,
}: DiagTcmEditModalProps) => {
  const [form] = Form.useForm<DiagTcmFormValues>();
  const [bingOptions, setBingOptions] = useState<DiagDictOption[]>([]);
  const [zhengOptions, setZhengOptions] = useState<DiagDictOption[]>([]);
  const [bingLoading, setBingLoading] = useState(false);
  const [zhengLoading, setZhengLoading] = useState(false);
  const bingName = Form.useWatch("bing_name", form);
  const bingCode = Form.useWatch("bing_code", form);
  const zhengName = Form.useWatch("zheng_name", form);
  const zhengCode = Form.useWatch("zheng_code", form);

  const mergeCurrentBing = useCallback(
    (list: DiagDictOption[]) =>
      mergeCurrentOption(
        list,
        toDictOption(record?.bing_id, record?.bing_name, record?.bing_code),
      ),
    [record?.bing_id, record?.bing_name, record?.bing_code],
  );

  const mergeCurrentZheng = useCallback(
    (list: DiagDictOption[]) =>
      mergeCurrentOption(
        list,
        toDictOption(record?.zheng_id, record?.zheng_name, record?.zheng_code),
      ),
    [record?.zheng_id, record?.zheng_name, record?.zheng_code],
  );

  const searchBingDict = useCallback(
    async (keyword: string) => {
      setBingLoading(true);
      try {
        const res = await retrieveBingListAPI({
          org_id: orgId,
          retrieve_input: keyword,
          retrieve_limit: 20,
        });
        if (res.code === 0 && Array.isArray(res.row_list)) {
          setBingOptions(mergeCurrentBing(res.row_list.map(mapBingItem)));
        }
      } catch (error) {
        console.error("搜索病失败:", error);
      } finally {
        setBingLoading(false);
      }
    },
    [mergeCurrentBing, orgId],
  );

  const searchZhengDict = useCallback(
    async (keyword: string) => {
      setZhengLoading(true);
      try {
        const res = await retrieveZhengListAPI({
          org_id: orgId,
          retrieve_input: keyword,
          retrieve_limit: 20,
        });
        if (res.code === 0 && Array.isArray(res.row_list)) {
          setZhengOptions(mergeCurrentZheng(res.row_list.map(mapZhengItem)));
        }
      } catch (error) {
        console.error("搜索证失败:", error);
      } finally {
        setZhengLoading(false);
      }
    },
    [mergeCurrentZheng, orgId],
  );

  const debouncedSearchBing = useMemo(
    () => debounce(searchBingDict, 300),
    [searchBingDict],
  );
  const debouncedSearchZheng = useMemo(
    () => debounce(searchZhengDict, 300),
    [searchZhengDict],
  );
  const searchBingDictRef = useRef(searchBingDict);
  const searchZhengDictRef = useRef(searchZhengDict);
  searchBingDictRef.current = searchBingDict;
  searchZhengDictRef.current = searchZhengDict;
  const debouncedSearchBingRef = useRef(debouncedSearchBing);
  const debouncedSearchZhengRef = useRef(debouncedSearchZheng);
  debouncedSearchBingRef.current = debouncedSearchBing;
  debouncedSearchZhengRef.current = debouncedSearchZheng;
  /** 保存后清空表单会触发 Select onSearch("")，这段时间内不发字典请求 */
  const ignoreDictSearchRef = useRef(false);

  useEffect(
    () => () => {
      debouncedSearchBing.cancel();
      debouncedSearchZheng.cancel();
    },
    [debouncedSearchBing, debouncedSearchZheng],
  );

  const resetToCreate = useCallback(() => {
    ignoreDictSearchRef.current = true;
    debouncedSearchBingRef.current.cancel();
    debouncedSearchZhengRef.current.cancel();
    form.resetFields();
    form.setFieldsValue(getEmptyFormValues());
    window.setTimeout(() => {
      ignoreDictSearchRef.current = false;
    }, 0);
  }, [form]);

  useEffect(() => {
    if (!open) return;
    if (record) {
      form.setFieldsValue({
        bing_id: record.bing_id || undefined,
        bing_name: record.bing_name,
        bing_code: record.bing_code,
        bing_desc: record.bing_desc,
        zheng_id: record.zheng_id || undefined,
        zheng_name: record.zheng_name,
        zheng_code: record.zheng_code,
        zheng_desc: record.zheng_desc,
        diag_status: record.diag_status || "CONFIRM",
      });
    } else {
      resetToCreate();
    }
  }, [form, open, record, resetToCreate]);

  useEffect(() => {
    if (!open) return;
    void searchBingDictRef.current("");
    void searchZhengDictRef.current("");
  }, [open, orgId]);

  const handleSubmit = async (closeAfterSave: boolean) => {
    try {
      const values = await form.validateFields();
      const ok = await onSubmit(values, closeAfterSave);
      if (ok && !closeAfterSave) {
        resetToCreate();
      }
    } catch {
      // 校验未通过时不提交
    }
  };

  const renderDictSelect = (
    kind: "bing" | "zheng",
    options: DiagDictOption[],
    loading: boolean,
    name: string | undefined,
    code: string | undefined,
    onSearch: (keyword: string) => void,
    onSelect: (opt?: DiagDictOption) => void,
  ) => (
    <Select
      className="w-full"
      popupMatchSelectWidth={false}
      styles={{ popup: { root: { minWidth: 480 } } }}
      allowClear
      placeholder="请选择"
      options={options}
      loading={loading}
      notFoundContent={loading ? "搜索中..." : "暂无结果"}
      onChange={(_val, option) => {
        onSelect(option as DiagDictOption | undefined);
      }}
      onInputKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        onSearch(" ");
      }}
      showSearch={{
        filterOption: false,
        onSearch: (keyword) => {
          if (ignoreDictSearchRef.current || !keyword) return;
          onSearch(keyword);
        },
      }}
      optionRender={(option) => {
        const data = option.data as DiagDictOption;
        return (
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate">{data.item_name}</span>
            <span className="shrink-0 text-(--app-theme-text-tertiary)">
              {data.item_code}
            </span>
          </div>
        );
      }}
      labelRender={() => (
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate">
            {name || (kind === "bing" ? "请选择病" : "请选择证")}
          </span>
          <span className="shrink-0 text-(--app-theme-text-tertiary)">
            {code}
          </span>
        </div>
      )}
    />
  );

  return (
    <Modal
      title={title}
      open={open}
      destroyOnHidden
      width={560}
      onCancel={onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={saving}>
            取消
          </Button>
          {!record && (
            <Button
              type="primary"
              loading={saving}
              onClick={() => void handleSubmit(false)}
            >
              保存
            </Button>
          )}
          <Button
            type="primary"
            loading={saving}
            onClick={() => void handleSubmit(true)}
          >
            确定
          </Button>
        </>
      }
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item name="bing_name" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="bing_code" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="zheng_name" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="zheng_code" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          label="病"
          name="bing_id"
          rules={[{ required: true, message: "请选择病" }]}
        >
          {renderDictSelect(
            "bing",
            bingOptions,
            bingLoading,
            bingName,
            bingCode,
            debouncedSearchBing,
            (opt) => {
              form.setFieldsValue({
                bing_id: opt?.item_id,
                bing_name: opt?.item_name,
                bing_code: opt?.item_code,
                bing_desc: opt?.item_name,
              });
            },
          )}
        </Form.Item>
        <Form.Item label="证" name="zheng_id">
          {renderDictSelect(
            "zheng",
            zhengOptions,
            zhengLoading,
            zhengName,
            zhengCode,
            debouncedSearchZheng,
            (opt) => {
              form.setFieldsValue({
                zheng_id: opt?.item_id,
                zheng_name: opt?.item_name,
                zheng_code: opt?.item_code,
                zheng_desc: opt?.item_name,
              });
            },
          )}
        </Form.Item>
        <Form.Item
          label="诊断状态"
          name="diag_status"
          rules={[{ required: true, message: "请选择诊断状态" }]}
        >
          <Select placeholder="请选择" options={DIAG_TCM_STATUS_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DiagTcmEditModal;
