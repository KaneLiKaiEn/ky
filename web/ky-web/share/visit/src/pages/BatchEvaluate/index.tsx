import {
  Button,
  Checkbox,
  message,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { deleteEmr, getEmrList } from "@/api/emr";
import { getDocNameListAPI } from "@/api/doc";
import { getFormList } from "@/api/form";
import { retrieveDict2ItemList, retrieveDict2List } from "@/api/sys";
import type { EmrRow } from "@/types/emr";
import type { Dict2ItemRow, Dict2Row } from "@/types/sys";
import BatchFormModal, { type EvalFormTab } from "./BatchFormModal";
import FormView from "./FormView";

export type BatchEvaluateWorkType = "NURSE" | "DOCTOR";

const BATCH_DICT_NAME: Record<BatchEvaluateWorkType, string> = {
  NURSE: "护士批量评估",
  DOCTOR: "医生批量评估",
};

export interface BatchEvaluateProps {
  visitId?: string | number;
  work_type: BatchEvaluateWorkType;
}

type DictNode = Dict2Row & { dict_item?: Dict2ItemRow[] };

export { default as FormView } from "./FormView";

export default function BatchEvaluate({
  visitId,
  work_type,
}: BatchEvaluateProps) {
  const dictName = BATCH_DICT_NAME[work_type];
  const [dictList, setDictList] = useState<DictNode[]>([]);
  const [selectedDictIds, setSelectedDictIds] = useState<
    Array<string | number>
  >([]);
  const [opening, setOpening] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [formTabs, setFormTabs] = useState<EvalFormTab[]>([]);

  const getDictList = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    try {
      const sessionRes = await getSessionInfo({ session_id: sessionId });
      const orgId = sessionRes.session_info?.org_id;
      if (!orgId) return;
      const res = await retrieveDict2List({ org_id: orgId });
      if (res.code !== 0) return;

      const batchEvalItem = (res.row_list || []).find(
        (item) => item.dict_name === dictName,
      );

      if (!batchEvalItem?.dict_id) {
        message.warning(`未找到'${dictName}'分类项`);
        setDictList([]);
        setSelectedDictIds([]);
        return;
      }

      const targetDictId = batchEvalItem.dict_id;
      const levelOneList = (res.row_list || []).filter(
        (item) => item.catalog_id === targetDictId && item.valid_status === "1",
      );

      const mergedList = await Promise.all(
        levelOneList.map(async (item) => {
          try {
            const subRes = await retrieveDict2ItemList({
              dict_id: item.dict_id,
            });
            if (subRes.code !== 0) {
              return { ...item, dict_item: [] };
            }
            return { ...item, dict_item: subRes.row_list || [] };
          } catch {
            return { ...item, dict_item: [] };
          }
        }),
      );

      setDictList(mergedList);
      setSelectedDictIds(
        mergedList
          .map((item) => item.dict_id)
          .filter((id): id is number => id != null),
      );
    } catch {
      setDictList([]);
      setSelectedDictIds([]);
    }
  };

  useEffect(() => {
    void getDictList();
  }, [work_type]);

  const handleOpenBatch = async () => {
    if (!visitId) {
      message.warning("请先选择患者");
      return;
    }
    const checkedList = dictList.filter(
      (item) => item.dict_id != null && selectedDictIds.includes(item.dict_id),
    );
    if (checkedList.length === 0) {
      message.warning("请至少勾选一项评估");
      return;
    }

    setOpening(true);
    try {
      const nameRes = await getDocNameListAPI({ doc_type: "患者评估" });
      if (nameRes.code !== 0) return;
      const nameList = nameRes.row_list || [];

      const tabs: EvalFormTab[] = [];
      const seenFormIds = new Set<number>();
      const usedLabels = new Map<string, number>();

      for (const dict of checkedList) {
        const nameRow = nameList.find((row) => row.doc_name === dict.dict_name);
        if (!nameRow) {
          message.warning(`未找到文档名称：${dict.dict_name}`);
          continue;
        }

        const itemList = dict.dict_item || [];
        if (itemList.length === 0) continue;

        for (const sub of itemList) {
          const itemName = sub?.item_name ?? "";
          if (!itemName) continue;
          try {
            const formRes = await getFormList({
              name_id: nameRow.name_id,
              doc_type: "患者评估",
              doc_name: dict.dict_name,
              doc_tag: itemName,
            });
            if (formRes.code !== 0) continue;

            for (const form of formRes.row_list || []) {
              if (form.form_id == null) continue;
              const formId = Number(form.form_id);
              if (seenFormIds.has(formId)) continue;
              seenFormIds.add(formId);

              const rawLabel =
                form.form_name || itemName || dict.dict_name || "评估表";
              const label =
                dict.dict_name && rawLabel !== dict.dict_name
                  ? `${dict.dict_name}-${rawLabel}`
                  : rawLabel;
              const count = usedLabels.get(label) ?? 0;
              usedLabels.set(label, count + 1);

              tabs.push({
                key: String(formId),
                label: count === 0 ? label : `${label}(${count + 1})`,
                form_id: formId,
                form_version:
                  form.form_version != null ? Number(form.form_version) : 1,
              });
            }
          } catch {
            continue;
          }
        }
      }

      if (tabs.length === 0) {
        message.warning("未获取到可填写的表单");
        return;
      }

      setFormTabs(tabs);
      setBatchOpen(true);
    } catch {
      message.error("一键评估异常");
    } finally {
      setOpening(false);
    }
  };

  const columns = [
    {
      title: "病历名称",
      dataIndex: "doc_name",
      key: "doc_name",
    },
    {
      title: "评估分数",
      dataIndex: "assess_score",
      key: "assess_score",
      width: 100,
    },
    {
      title: "评估结果",
      dataIndex: "assess_result",
      key: "assess_result",
      width: 160,
    },
    {
      title: "状态",
      dataIndex: "emr_status",
      key: "emr_status",
      render: (text: string) =>
        text === "COMMIT" ? (
          <Tag color="green">已提交</Tag>
        ) : (
          <Tag color="orange">未提交</Tag>
        ),
      width: 100,
    },
    {
      title: "评估时间",
      dataIndex: "emr_time",
      key: "emr_time",
      render: (text: string) =>
        text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "",
      width: 160,
    },
    {
      title: "操作",
      key: "operation",
      width: 120,
      render: (_: unknown, record: EmrRow) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const [emrList, setEmrList] = useState<EmrRow[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadEmrList = async () => {
    const visitIdNum = Number(visitId);
    if (!visitIdNum) {
      setEmrList([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      return;
    }
    try {
      const res = await getEmrList({
        visit_id: visitIdNum,
        doc_type: "患者评估",
        work_type: `[${work_type}]`,
      });
      if (res.code !== 0) return;
      const sortedList = [...(res.row_list || [])].sort(
        (a, b) => dayjs(b.emr_time).unix() - dayjs(a.emr_time).unix(),
      );
      setEmrList(sortedList);
      setPagination((prev) => ({
        ...prev,
        total: sortedList.length,
        current: 1,
      }));
    } catch {
      setEmrList([]);
    }
  };

  useEffect(() => {
    void loadEmrList();
  }, [visitId, work_type]);

  const [selectedEmr, setSelectedEmr] = useState<EmrRow | null>(null);
  const [formViewOpen, setFormViewOpen] = useState(false);
  const handleView = (record: EmrRow) => {
    setSelectedEmr(record);
    setFormViewOpen(true);
  };
  const handleDelete = (record: EmrRow) => {
    if (record?.emr_id == null) return;
    Modal.confirm({
      title: "确认删除",
      content: "是否确认删除该评估单？",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        await deleteEmr({ emr_id: record.emr_id! });
        message.success("删除成功");
        loadEmrList();
      },
    });
  };

  return (
    <div>
      <Row gutter={12}>
        <Checkbox.Group
          value={selectedDictIds}
          onChange={(vals) =>
            setSelectedDictIds(vals as Array<string | number>)
          }
          className="flex flex-wrap gap-2"
        >
          {dictList.map((item) => (
            <Checkbox key={item.dict_id} value={item.dict_id}>
              {item.dict_name}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Row>

      <div className="mb-3 flex justify-end">
        <Button
          type="primary"
          loading={opening}
          onClick={handleOpenBatch}
          size="small"
        >
          一键评估
        </Button>
      </div>

      <div>
        <Table
          size="small"
          rowKey="emr_id"
          columns={columns}
          dataSource={emrList}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            ...pagination,
            onChange: (current, pageSize) => {
              setPagination({ ...pagination, current, pageSize });
            },
          }}
        />
      </div>
      <FormView
        open={formViewOpen}
        emr={selectedEmr}
        visitId={visitId}
        onCancel={() => {
          setFormViewOpen(false);
          setSelectedEmr(null);
        }}
        onSuccess={loadEmrList}
      />
      <BatchFormModal
        open={batchOpen}
        visitId={visitId}
        forms={formTabs}
        onCancel={() => {
          setBatchOpen(false);
          loadEmrList();
        }}
        onSuccess={loadEmrList}
      />
    </div>
  );
}
