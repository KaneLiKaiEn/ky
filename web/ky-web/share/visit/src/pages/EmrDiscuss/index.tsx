import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  message,
  Select,
  Space,
  Spin,
  Table,
  Card,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import UserMultipleList from "@/pages/UserMultipleList";
import { PieceModal } from "@/pages/CustomForm/components/DataElem/PiecePicker";
import { getEmrDiscussList, getEmrDiscussUserList } from "@/api/emr";
import type { EmrDiscussRow, EmrDiscussUserRow } from "@/types/emr";

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";
const DISCUSS_TYPE_SUMMARY = "总结";

const DIFFICULTY_OPTIONS = [
  { label: "诊断不明确", value: "诊断不明确" },
  { label: "治疗效果不理想", value: "治疗效果不理想" },
];

const isSummaryRow = (row: EmrDiscussRow) =>
  row.discuss_type === DISCUSS_TYPE_SUMMARY;

const splitDiscussRows = (rowList: EmrDiscussRow[]) => {
  const summaryRow = rowList.find(isSummaryRow);
  const speechRows = rowList.filter((row) => !isSummaryRow(row));
  return { speechRows, summaryRow };
};

interface DiscussFormValues {
  custom_title?: string;
  difficulty_types?: string[];
  discuss_start?: Dayjs | null;
  discuss_venue?: string;
  discuss_moderator_id?: number;
  discuss_user_list?: EmrDiscussUserRow[];
  host_summary?: string;
}

interface ParticipantsFieldProps {
  value?: EmrDiscussUserRow[];
  onChange?: (users: EmrDiscussUserRow[]) => void;
}

const ParticipantsField: React.FC<ParticipantsFieldProps> = ({
  value = [],
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const displayText = value
    .map((user) => {
      const name = user.user_name?.trim();
      if (!name) return "";
      return user.work_level ? `${name}（${user.work_level}）` : name;
    })
    .filter(Boolean)
    .join("、");

  return (
    <>
      <Space.Compact>
        <Input
          readOnly
          value={displayText}
          placeholder="请选择参加人员"
          style={{ minWidth: 600 }}
        />
        <Button onClick={() => setOpen(true)}>选择人员</Button>
      </Space.Compact>
      <UserMultipleList
        open={open}
        value={value}
        onCancel={() => setOpen(false)}
        onOk={(users) => {
          onChange?.(users);
          setOpen(false);
        }}
      />
    </>
  );
};

export interface EmrDiscussProperty {
  discuss_start?: string;
  discuss_venue?: string;
  discuss_moderator_id?: number;
  discuss_moderator_name?: string;
}

export interface EmrDiscussProps {
  // 打开savaEmr
  emr_id?: number;

  // 新建createEmr
  doc_name?: string;

  /** 来自 emr_property，编辑回填 */
  emr_property?: EmrDiscussProperty;
}

export interface EmrDiscussRef {
  getDiscussData: () => {
    discuss_list: EmrDiscussRow[];
    discuss_user_list: EmrDiscussUserRow[];
    emr_property: EmrDiscussProperty;
  };
}

const DISCUSS_FORM_ID: Record<
  NonNullable<EmrDiscussProps["doc_name"]>,
  number
> = {
  疑难病例讨论记录: -1,
  死亡病例讨论记录: -2,
  术前讨论记录: -3,
};

const EmrDiscuss = forwardRef<EmrDiscussRef, EmrDiscussProps>(
  ({ emr_id, doc_name, emr_property }, ref) => {
    const [form] = Form.useForm<DiscussFormValues>();
    const [discussList, setDiscussList] = useState<EmrDiscussRow[]>([{}]);
    /** 总结行已有 discuss_id 等，保存时拼回最后一行 */
    const [summaryRow, setSummaryRow] = useState<EmrDiscussRow | undefined>();
    const [loading, setLoading] = useState(false);
    const [manageTemplateOpen, setManageTemplateOpen] = useState(false);
    const [selectDiscussIndex, setSelectDiscussIndex] = useState<number | null>(
      null,
    );

    const formId = doc_name ? DISCUSS_FORM_ID[doc_name] : -9;
    const selectedDiscuss =
      selectDiscussIndex == null ? undefined : discussList[selectDiscussIndex];

    const discussUserList = Form.useWatch("discuss_user_list", form) ?? [];

    useImperativeHandle(
      ref,
      () => ({
        getDiscussData: () => {
          const discuss_user_list: EmrDiscussUserRow[] =
            form.getFieldValue("discuss_user_list") ?? [];
          const discuss_start = form.getFieldValue("discuss_start");
          const discuss_venue = form.getFieldValue("discuss_venue");
          const discuss_moderator_id = form.getFieldValue(
            "discuss_moderator_id",
          ) as number | undefined;
          const discuss_moderator_name = discuss_user_list.find(
            (user) => user.user_id === discuss_moderator_id,
          )?.user_name;
          const host_summary =
            (form.getFieldValue("host_summary") as string | undefined) ?? "";

          return {
            discuss_list: [
              ...discussList,
              {
                ...summaryRow,
                discuss_type: DISCUSS_TYPE_SUMMARY,
                discuss_note: host_summary,
                user_id: discuss_moderator_id,
              },
            ],
            discuss_user_list,
            emr_property: {
              discuss_start: discuss_start?.isValid()
                ? discuss_start.format(DATETIME_FORMAT)
                : undefined,
              discuss_venue,
              discuss_moderator_id,
              discuss_moderator_name,
            },
          };
        },
      }),
      [discussList, form, summaryRow],
    );

    const participantIds = useMemo(
      () =>
        discussUserList
          .map((user) => user.user_id)
          .filter((userId): userId is number => userId != null),
      [discussUserList],
    );

    const participantOptions = useMemo(
      () =>
        discussUserList.flatMap((user) => {
          if (user.user_id == null) return [];
          const name = user.user_name?.trim() || String(user.user_id);
          return [
            {
              label: user.work_level ? `${name}（${user.work_level}）` : name,
              value: user.user_id,
            },
          ];
        }),
      [discussUserList],
    );

    useEffect(() => {
      if (!emr_id) {
        setDiscussList([{}]);
        setSummaryRow(undefined);
        form.setFieldsValue({
          discuss_start: dayjs(),
          discuss_venue: undefined,
          discuss_moderator_id: undefined,
          discuss_user_list: [],
          host_summary: undefined,
        });
        return;
      }

      let cancelled = false;
      setLoading(true);
      void Promise.all([
        getEmrDiscussList({ emr_id }),
        getEmrDiscussUserList({ emr_id }),
      ])
        .then(([discussRes, userRes]) => {
          if (cancelled) return;
          if (discussRes.code !== 0 || userRes.code !== 0) {
            message.error(
              discussRes.message || userRes.message || "加载讨论记录失败",
            );
            return;
          }

          const rowList = discussRes.row_list ?? [];
          const { speechRows, summaryRow: loadedSummary } =
            splitDiscussRows(rowList);
          setDiscussList(speechRows.length > 0 ? speechRows : [{}]);
          setSummaryRow(loadedSummary);
          const discussStart =
            emr_property?.discuss_start ?? speechRows[0]?.discuss_time;
          form.setFieldsValue({
            discuss_start: discussStart ? dayjs(discussStart) : dayjs(),
            discuss_venue: emr_property?.discuss_venue,
            discuss_moderator_id: emr_property?.discuss_moderator_id,
            discuss_user_list: userRes.row_list ?? [],
            host_summary: loadedSummary?.discuss_note,
          });
        })
        .catch(() => {
          if (!cancelled) message.error("加载讨论记录失败");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [emr_id, emr_property, form]);

    // 参加人员变更后，清掉已不在名单中的主持人和讲话人
    useEffect(() => {
      const discuss_moderator_id = form.getFieldValue(
        "discuss_moderator_id",
      ) as number | undefined;
      if (
        discuss_moderator_id != null &&
        !participantIds.includes(discuss_moderator_id)
      ) {
        form.setFieldValue("discuss_moderator_id", undefined);
      }
      setDiscussList((prev) =>
        prev.map((row) =>
          row.user_id != null && !participantIds.includes(row.user_id)
            ? { ...row, user_id: undefined }
            : row,
        ),
      );
    }, [participantIds, form]);

    const handleAddSpeech = () => {
      setDiscussList((prev) => [...prev, {}]);
    };

    const handleDeleteSpeech = (index: number) => {
      setDiscussList((prev) =>
        prev.filter((_, rowIndex) => rowIndex !== index),
      );
    };

    const handleSpeechChange = (
      index: number,
      field: keyof EmrDiscussRow,
      value: number | string | undefined,
    ) => {
      setDiscussList((prev) =>
        prev.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [field]: value } : row,
        ),
      );
    };

    const speechColumns: ColumnsType<EmrDiscussRow> = [
      {
        title: "讨论人",
        dataIndex: "user_id",
        width: 180,
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, record, index) => (
          <Select
            allowClear
            placeholder="请选择"
            options={participantOptions}
            value={record.user_id}
            style={{ width: "100%" }}
            onChange={(value) => handleSpeechChange(index, "user_id", value)}
          />
        ),
      },
      {
        title: (
          <div className="flex justify-between gap-2">
            <span>内容</span>
            <Space>
              <Button
                color="cyan"
                variant="solid"
                size="small"
                disabled={formId == null}
                onClick={() => setManageTemplateOpen(true)}
              >
                模板
              </Button>
              <Button type="primary" size="small" onClick={handleAddSpeech}>
                新增
              </Button>
            </Space>
          </div>
        ),
        dataIndex: "discuss_note",
        render: (_, record, index) => (
          <Input.TextArea
            autoSize={{ minRows: 2 }}
            placeholder="请输入讨论内容"
            value={record.discuss_note}
            onChange={(e) =>
              handleSpeechChange(index, "discuss_note", e.target.value)
            }
          />
        ),
      },
      {
        title: "操作",
        key: "action",
        width: 80,
        align: "center",
        render: (_, _record, index) => (
          <Space size={0}>
            <Button
              type="text"
              icon={<SnippetsOutlined />}
              title="选择模板"
              disabled={formId == null}
              onClick={() => setSelectDiscussIndex(index)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSpeech(index)}
            />
          </Space>
        ),
      },
    ];

    return (
      <div className="p-2">
        <Form
          className="flex direction-column gap-y-3"
          form={form}
          layout="inline"
          initialValues={{
            discuss_start: dayjs(),
            difficulty_types: [],
            discuss_user_list: [],
          }}
        >
          <Card className="w-full" styles={{ body: { padding: "8px" } }}>
            <div className="flex flex-wrap items-start gap-y-3">
              {doc_name === "疑难病例讨论记录" && (
                <Form.Item label="疑难类型" name="discuss_tag">
                  <Checkbox.Group options={DIFFICULTY_OPTIONS} />
                </Form.Item>
              )}

              <Form.Item label="讨论时间和地点">
                <Space wrap size={8}>
                  <Form.Item name="discuss_start" noStyle>
                    <DatePicker
                      showTime={{ format: "HH:mm" }}
                      format={DATETIME_FORMAT}
                      placeholder="请选择讨论时间"
                    />
                  </Form.Item>
                  <Form.Item name="discuss_venue" noStyle>
                    <Input
                      placeholder="请输入讨论地点"
                      style={{ width: 200 }}
                    />
                  </Form.Item>
                </Space>
              </Form.Item>

              <Form.Item name="discuss_user_list" label="参加人员">
                <ParticipantsField />
              </Form.Item>

              <Form.Item name="discuss_moderator_id" label="主持人">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择主持人"
                  options={participantOptions}
                  style={{ width: 160 }}
                />
              </Form.Item>
            </div>
          </Card>

          <Card className="w-full" styles={{ body: { padding: "8px" } }}>
            <Spin spinning={loading}>
              <Table
                bordered
                size="small"
                pagination={false}
                rowKey={(record, index) =>
                  record.discuss_id ?? `new-${index ?? 0}`
                }
                columns={speechColumns}
                dataSource={discussList}
                locale={{ emptyText: "暂无数据，点击上方新增按钮添加" }}
              />
            </Spin>

            <div className="my-2">主持人总结：</div>
            <Form.Item name="host_summary" noStyle>
              <Input.TextArea
                autoSize={{ minRows: 3 }}
                placeholder="请输入主持人总结"
              />
            </Form.Item>
          </Card>
        </Form>

        {formId != null && (
          <>
            <PieceModal
              open={manageTemplateOpen}
              elem_id={-1}
              context={{ form_id: formId }}
              selectMode={false}
              onCancel={() => setManageTemplateOpen(false)}
            />
            <PieceModal
              open={selectDiscussIndex != null}
              elem_id={-1}
              context={{ form_id: formId }}
              selectMode
              currentValue={selectedDiscuss?.discuss_note ?? ""}
              onCancel={() => setSelectDiscussIndex(null)}
              onSelect={(content) => {
                if (selectDiscussIndex != null) {
                  handleSpeechChange(
                    selectDiscussIndex,
                    "discuss_note",
                    content,
                  );
                }
              }}
            />
          </>
        )}
      </div>
    );
  },
);

export default EmrDiscuss;
