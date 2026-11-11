import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Checkbox, DatePicker, Form, Input, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { getMatchListAPI } from "@/api/cohort";
import { retrieveDiagItemListAPI } from "@/api/diag";
import type { CohortDiseaseRow } from "@/types/cohort";
import type { DiagApiType, DiagItemRow, DiagRow } from "@/types/diag";
import CohortMatchModal from "./CohortMatchModal";

const DISEASE_TYPE_CLINICAL_PATH = "临床路径";

export interface DiagFormValues {
  item_id?: number;
  diag_name?: string;
  diag_code?: string;
  diag_desc?: string;
  diag_status?: string;
  diag_time?: Dayjs | null;
  /** 诊断标签（并发症/合并症），表单内为数组，提交时拼为 [值][值] 格式 */
  diag_tag?: string[];
  admission_issue?: string;
  treat_issue?: string;
  discharge_issue?: string;
}

type DiagDictOption = {
  value: number;
  label: string;
  item_id: number;
  item_name: string;
  item_code: string;
};

export const ADMISSION_ISSUE_OPTIONS = [
  { label: "有", value: "有" },
  { label: "临床未确定", value: "临床未确定" },
  { label: "情况不明", value: "情况不明" },
  { label: "无", value: "无" },
];

export const TREAT_ISSUE_OPTIONS = [
  { label: "是", value: "是" },
  { label: "否", value: "否" },
];

export const DISCHARGE_ISSUE_OPTIONS = [
  { label: "治愈", value: "治愈" },
  { label: "好转", value: "好转" },
  { label: "未愈", value: "未愈" },
  { label: "死亡", value: "死亡" },
  { label: "其它", value: "其它" },
];

export const DIAG_STATUS_OPTIONS = [
  { label: "确诊", value: "CONFIRM" },
  { label: "疑似", value: "DOUBT" },
  // { label: "取消", value: "CANCEL" },
];

export const DIAG_TAG_OPTIONS = [
  { label: "并发症", value: "并发症" },
  { label: "合并症", value: "合并症" },
];

/** 弹窗可展示的表单项。诊断字典对应 item_id */
export const DIAG_FORM_FIELD_KEYS = [
  "diag_name",
  "diag_desc",
  "diag_time",
  "admission_issue",
  "treat_issue",
  "discharge_issue",
  "diag_status",
  "diag_tag",
] as const;

export type DiagFormFieldKey = (typeof DIAG_FORM_FIELD_KEYS)[number];

export const isDeathDiagType = (type?: string) => type === "DEATH";

/** 解析 diag_tag：兼容 [并发症][合并症] 与逗号分隔两种格式，返回标签数组 */
export const parseDiagTag = (text?: string): string[] => {
  if (!text) return [];
  const bracketed = text.match(/\[([^\]]+)\]/g);
  if (bracketed) return bracketed.map((item) => item.slice(1, -1));
  return text.split(",").filter(Boolean);
};

export interface DiagEditModalProps {
  open: boolean;
  saving?: boolean;
  title: string;
  diagType: DiagApiType;
  record?: DiagRow | null;
  orgId: number;
  visitId: number;
  patientId?: number;
  onCancel: () => void;
  /**
   * 需要展示的表单项，按传入顺序显示。
   * 不传则展示全部。类型专属项仍只在对应诊断类型下出现。
   */
  formFieldList?: DiagFormFieldKey[];
  /** closeAfterSave 为 false 时保存后不关弹窗，便于连续录入 */
  onSubmit: (
    values: DiagFormValues,
    closeAfterSave: boolean,
  ) => boolean | Promise<boolean>;
}

const getEmptyFormValues = (diagType: DiagApiType): DiagFormValues => ({
  item_id: undefined,
  diag_name: undefined,
  diag_code: undefined,
  diag_desc: undefined,
  diag_status: "CONFIRM",
  diag_time: dayjs(),
  diag_tag: [],
  admission_issue: undefined,
  treat_issue: diagType === "ADMISSION" ? "是" : undefined,
  discharge_issue: undefined,
});

const DiagEditModal = ({
  open,
  saving,
  title,
  diagType,
  record,
  orgId,
  visitId,
  patientId,
  onCancel,
  formFieldList,
  onSubmit,
}: DiagEditModalProps) => {
  const [form] = Form.useForm<DiagFormValues>();
  const [diagDictOptions, setDiagDictOptions] = useState<DiagDictOption[]>([]);
  const [diagDictLoading, setDiagDictLoading] = useState(false);
  const [cohortMatchOpen, setCohortMatchOpen] = useState(false);
  const [cohortMatchList, setCohortMatchList] = useState<CohortDiseaseRow[]>(
    [],
  );
  const diagName = Form.useWatch("diag_name", form);
  const diagCode = Form.useWatch("diag_code", form);

  const mergeCurrentOption = useCallback(
    (list: DiagDictOption[]) => {
      if (!record?.item_id) return list;
      if (list.some((item) => item.item_id === record.item_id)) return list;
      return [
        {
          value: record.item_id,
          label: record.diag_name ?? "",
          item_id: record.item_id,
          item_name: record.diag_name ?? "",
          item_code: record.diag_code ?? "",
        },
        ...list,
      ];
    },
    [record],
  );

  const searchDiagDict = useCallback(
    async (keyword: string) => {
      setDiagDictLoading(true);
      try {
        const res = await retrieveDiagItemListAPI({
          org_id: orgId,
          retrieve_input: keyword,
          retrieve_limit: 20,
        });
        if (res.code === 0 && Array.isArray(res.row_list)) {
          setDiagDictOptions(
            mergeCurrentOption(
              res.row_list.map((item: DiagItemRow) => ({
                value: item.item_id,
                label: item.item_name,
                item_id: item.item_id,
                item_name: item.item_name,
                item_code: item.item_code,
              })),
            ),
          );
        }
      } catch (error) {
        console.error("搜索诊断字典失败:", error);
      } finally {
        setDiagDictLoading(false);
      }
    },
    [mergeCurrentOption, orgId],
  );

  const debouncedSearchDiagDict = useMemo(
    () => debounce(searchDiagDict, 300),
    [searchDiagDict],
  );
  const searchDiagDictRef = useRef(searchDiagDict);
  searchDiagDictRef.current = searchDiagDict;
  const debouncedSearchDiagDictRef = useRef(debouncedSearchDiagDict);
  debouncedSearchDiagDictRef.current = debouncedSearchDiagDict;
  /** 保存后清空表单会触发 Select onSearch("")，这段时间内不发字典请求 */
  const ignoreDictSearchRef = useRef(false);

  useEffect(
    () => () => {
      debouncedSearchDiagDict.cancel();
    },
    [debouncedSearchDiagDict],
  );

  const resetToCreate = useCallback(() => {
    ignoreDictSearchRef.current = true;
    debouncedSearchDiagDictRef.current.cancel();
    form.resetFields();
    form.setFieldsValue(getEmptyFormValues(diagType));
    window.setTimeout(() => {
      ignoreDictSearchRef.current = false;
    }, 0);
  }, [diagType, form]);

  useEffect(() => {
    if (!open) return;
    if (record) {
      form.setFieldsValue({
        item_id: record.item_id,
        diag_name: record.diag_name,
        diag_code: record.diag_code,
        diag_desc: record.diag_desc,
        diag_status: record.diag_status,
        diag_time: record.diag_time ? dayjs(record.diag_time) : null,
        diag_tag: parseDiagTag(record.diag_tag),
        admission_issue: record.admission_issue,
        treat_issue:
          record.treat_issue ?? (diagType === "ADMISSION" ? "是" : undefined),
        discharge_issue: record.discharge_issue,
      });
    } else {
      resetToCreate();
    }
  }, [diagType, form, open, record, resetToCreate]);

  useEffect(() => {
    if (!open) return;
    void searchDiagDictRef.current("");
  }, [open, orgId]);

  const checkCohortMatch = useCallback(async () => {
    // 编辑、出院诊断、死因不纳入临床路径
    if (record || !visitId || diagType === "DISCHARGE" || diagType === "DEAD") {
      return;
    }
    try {
      const res = await getMatchListAPI({
        visit_id: visitId,
        baby_id: 0,
        disease_type: DISEASE_TYPE_CLINICAL_PATH,
      });
      if (
        res.code === 0 &&
        Array.isArray(res.row_list) &&
        res.row_list.length > 0
      ) {
        setCohortMatchList(res.row_list);
        setCohortMatchOpen(true);
      }
    } catch (error) {
      console.error("获取临床路径匹配失败:", error);
    }
  }, [diagType, record, visitId]);

  const handleSubmit = async (closeAfterSave: boolean) => {
    try {
      const values = await form.validateFields();
      const ok = await onSubmit(values, closeAfterSave);
      if (!ok) return;
      if (!closeAfterSave) {
        resetToCreate();
      }
      await checkCohortMatch();
    } catch {
      // 校验未通过时不提交
    }
  };

  const fieldOrder = formFieldList ?? DIAG_FORM_FIELD_KEYS;

  const renderFormField = (key: DiagFormFieldKey) => {
    switch (key) {
      case "diag_name":
        return (
          <Form.Item
            label="诊断字典"
            name="item_id"
            rules={[{ required: true, message: "请选择诊断" }]}
          >
            <Select
              className="w-full"
              popupMatchSelectWidth={false}
              styles={{ popup: { root: { minWidth: 480 } } }}
              onChange={(_val, option) => {
                const opt = option as DiagDictOption | undefined;
                form.setFieldsValue({
                  item_id: opt?.item_id,
                  diag_name: opt?.item_name,
                  diag_code: opt?.item_code,
                  diag_desc: opt?.item_name,
                });
              }}
              onInputKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key !== " ") return;
                e.preventDefault();
                e.stopPropagation();
                debouncedSearchDiagDict(" ");
              }}
              showSearch={{
                filterOption: false,
                onSearch: (keyword) => {
                  if (ignoreDictSearchRef.current || !keyword) return;
                  debouncedSearchDiagDict(keyword);
                },
              }}
              allowClear
              placeholder="请选择"
              options={diagDictOptions}
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
                    {diagName || "请选择"}
                  </span>
                  <span className="shrink-0 text-(--app-theme-text-tertiary)">
                    {diagCode}
                  </span>
                </div>
              )}
              notFoundContent={diagDictLoading ? "搜索中..." : "暂无结果"}
              loading={diagDictLoading}
            />
          </Form.Item>
        );
      case "diag_desc":
        return (
          <Form.Item label="临床诊断" name="diag_desc">
            <Input placeholder="请输入临床诊断" />
          </Form.Item>
        );
      case "diag_time":
        if (!isDeathDiagType(diagType)) return null;
        return (
          <Form.Item label="发病时间" name="diag_time">
            <DatePicker
              className="w-full"
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              allowClear
            />
          </Form.Item>
        );
      case "admission_issue":
        if (diagType !== "ADMISSION" && diagType !== "DISCHARGE") return null;
        return (
          <Form.Item label="入院病情" name="admission_issue">
            <Select
              allowClear
              placeholder="请选择"
              options={ADMISSION_ISSUE_OPTIONS}
            />
          </Form.Item>
        );
      case "treat_issue":
        if (diagType !== "ADMISSION") return null;
        return (
          <Form.Item label="是否治疗" name="treat_issue">
            <Select
              allowClear
              placeholder="请选择"
              options={TREAT_ISSUE_OPTIONS}
            />
          </Form.Item>
        );
      case "discharge_issue":
        if (diagType !== "DISCHARGE") return null;
        return (
          <Form.Item label="出院转归" name="discharge_issue">
            <Select
              allowClear
              placeholder="请选择"
              options={DISCHARGE_ISSUE_OPTIONS}
            />
          </Form.Item>
        );
      case "diag_status":
        return (
          <Form.Item
            label="诊断状态"
            name="diag_status"
            rules={[{ required: true, message: "请选择诊断状态" }]}
          >
            <Select placeholder="请选择" options={DIAG_STATUS_OPTIONS} />
          </Form.Item>
        );
      case "diag_tag":
        return (
          <Form.Item label="标签" name="diag_tag">
            <Checkbox.Group options={DIAG_TAG_OPTIONS} />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <>
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
          <Form.Item name="diag_name" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="diag_code" hidden>
            <Input />
          </Form.Item>
          {fieldOrder.map((key) => (
            <Fragment key={key}>{renderFormField(key)}</Fragment>
          ))}
        </Form>
      </Modal>
      <CohortMatchModal
        open={cohortMatchOpen}
        visitId={visitId}
        patientId={patientId}
        rowList={cohortMatchList}
        onClose={() => {
          setCohortMatchOpen(false);
          setCohortMatchList([]);
        }}
      />
    </>
  );
};

export default DiagEditModal;
