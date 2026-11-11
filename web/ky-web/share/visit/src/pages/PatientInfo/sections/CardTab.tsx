import { useCallback, useEffect, useState } from "react";
import { CreditCardOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Popconfirm, Select, Space, Spin } from "antd";
import {
  attachPatientAPI,
  detachPatientAPI,
  getCardLostListAPI,
  getOrgReaderListAPI,
  getPatientCardListAPI,
  lostCardAPI,
} from "../api/card";
import { resolveOrgId } from "../api/org";
import { FORM_LABEL_WIDTH } from "../constants";
import type { CardLostRow, CardPatientRow } from "../types/card";

interface CardTabProps {
  patientId?: number | null;
}

interface IssueValues {
  card_type?: string;
  card_no?: string;
}

const labelCol = { flex: `${FORM_LABEL_WIDTH}px` };
const wrapperCol = { flex: 1 };

const randomCardNo = () =>
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");

const cardIdOf = (item: { card_no?: string; card_id?: string }) =>
  item.card_no || "";

/** 与旧页 app-skeuo-card-bg-cherry-dark / cyan-dark 一致 */
const CARD_BG = {
  active: "linear-gradient(to right, #493240, #f09)",
  lost: "linear-gradient(to right, #373b44, #4286f4)",
} as const;

const CardFace: React.FC<{
  tone: keyof typeof CARD_BG;
  cardType?: string;
  cardName?: string;
  cardNo?: string;
}> = ({ tone, cardType, cardName, cardNo }) => (
  <div
    className="relative min-h-[148px] w-full max-w-[280px] shrink-0 overflow-hidden rounded-lg px-4 py-4 text-white"
    style={{ background: CARD_BG[tone] }}
  >
    <CreditCardOutlined className="pointer-events-none absolute -right-6 top-5 text-[110px] text-black opacity-10" />
    <div className="relative mb-6 text-sm">
      <span className="mr-1 opacity-50">{cardType || "就诊卡"}</span>
      <CreditCardOutlined />
    </div>
    <div className="relative truncate text-2xl font-light leading-tight">
      {cardName || "-"}
    </div>
    <div className="relative mt-1 font-mono text-base text-white/50">
      {cardNo || "-"}
    </div>
  </div>
);

/**
 * 就诊卡：绑定列表、发卡、解绑、挂失，以及已挂失卡。
 * 卡操作都按患者维度，card_id 与旧页一致，缺省时用卡号。
 */
const CardTab: React.FC<CardTabProps> = ({ patientId }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<IssueValues>();
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeOptions, setTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [list, setList] = useState<CardPatientRow[]>([]);
  const [lostList, setLostList] = useState<CardLostRow[]>([]);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        getPatientCardListAPI({ patient_id: id, include_detach: false }),
        getPatientCardListAPI({ patient_id: id, include_detach: true }),
      ]);
      const active = activeRes.row_list ?? [];
      const all = allRes.row_list ?? [];
      setList(active);
      const lostGroups = await Promise.all(
        all.map((item) =>
          getCardLostListAPI({
            card_type: item.card_type,
            card_no: item.card_no,
            card_id: item.card_id,
          })
            .then((res) => res.row_list ?? [])
            .catch(() => [] as CardLostRow[]),
        ),
      );
      setLostList(lostGroups.flat());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAdding(false);
    setList([]);
    setLostList([]);
    if (patientId == null) return;
    void load(patientId);
  }, [load, patientId]);

  const openIssue = async () => {
    setAdding(true);
    form.setFieldsValue({ card_type: undefined, card_no: randomCardNo() });
    if (typeOptions.length > 0) return;
    setTypeLoading(true);
    try {
      const orgId = await resolveOrgId();
      const res = await getOrgReaderListAPI({ org_id: orgId });
      setTypeOptions(
        (res.reader_list ?? [])
          .filter((item) => item.reader_type)
          .map((item) => ({
            label: item.reader_type as string,
            value: item.reader_type as string,
          })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setTypeLoading(false);
    }
  };

  const handleIssue = async (values: IssueValues) => {
    if (patientId == null || !values.card_type || !values.card_no) return;
    setActing(true);
    try {
      await attachPatientAPI({
        card_type: values.card_type,
        card_no: values.card_no,
        card_id: values.card_no,
        patient_id: patientId,
      });
      message.success("发卡成功");
      setAdding(false);
      await load(patientId);
    } catch (error) {
      console.error(error);
    } finally {
      setActing(false);
    }
  };

  const runAction = async (
    action: "detach" | "lost",
    item: CardPatientRow,
  ) => {
    if (patientId == null || !item.card_type || !item.card_no) return;
    setActing(true);
    try {
      const params = {
        card_type: item.card_type,
        card_no: item.card_no,
        card_id: cardIdOf(item),
        patient_id: patientId,
      };
      if (action === "detach") {
        await detachPatientAPI(params);
        message.success("解绑成功");
      } else {
        await lostCardAPI(params);
        message.success("挂失成功");
      }
      await load(patientId);
    } catch (error) {
      console.error(error);
    } finally {
      setActing(false);
    }
  };

  if (patientId == null) {
    return (
      <div className="px-3 py-6 text-(length:--app-theme-font-sm, 13px) text-(--app-theme-text-secondary)">
        请先定位患者
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <div className="flex flex-col gap-4 px-3 py-2">
        <div>
          <div className="mb-2">
            {adding ? (
              <Button size="small" onClick={() => setAdding(false)}>
                返回
              </Button>
            ) : (
              <Button size="small" type="primary" onClick={() => void openIssue()}>
                发卡
              </Button>
            )}
          </div>

          {adding ? (
            <Form
              form={form}
              layout="horizontal"
              labelCol={labelCol}
              wrapperCol={wrapperCol}
              disabled={acting}
              onFinish={(values) => void handleIssue(values)}
            >
              <Form.Item
                label="卡类型"
                name="card_type"
                className="mb-2!"
                rules={[{ required: true, message: "请选择卡类型" }]}
              >
                <Select
                  placeholder="请选择"
                  loading={typeLoading}
                  options={typeOptions}
                />
              </Form.Item>
              <Form.Item
                label="卡号"
                name="card_no"
                className="mb-3!"
                rules={[{ required: true, message: "请输入卡号" }]}
                normalize={(value) => String(value ?? "").replace(/\D/g, "")}
              >
                <Input placeholder="卡号" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={acting}>
                保存
              </Button>
            </Form>
          ) : list.length === 0 ? (
            <div className="text-(length:--app-theme-font-sm, 13px) text-(--app-theme-text-secondary)">
              还没有绑定任何卡片
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {list.map((item) => (
                <div
                  key={item.row_id ?? `${item.card_type}-${item.card_no}`}
                  className="flex flex-wrap items-center gap-3"
                >
                  <CardFace
                    tone="active"
                    cardType={item.card_type}
                    cardName={item.card_name}
                    cardNo={item.card_no}
                  />
                  <Space>
                    <Popconfirm
                      title="确定解绑?"
                      okText="确定"
                      cancelText="取消"
                      onConfirm={() => runAction("detach", item)}
                    >
                      <Button size="small" disabled={acting}>
                        解绑
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="确定挂失?"
                      okText="确定"
                      cancelText="取消"
                      onConfirm={() => runAction("lost", item)}
                    >
                      <Button size="small" disabled={acting}>
                        挂失
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              ))}
            </div>
          )}
        </div>

        {lostList.length > 0 ? (
          <div>
            <div className="mb-2 text-(length:--app-theme-font-sm, 13px) font-medium">
              挂失卡
            </div>
            <div className="flex flex-col gap-2">
              {lostList.map((item) => (
                <CardFace
                  key={item.lost_id ?? `${item.card_type}-${item.card_no}`}
                  tone="lost"
                  cardType={item.card_type}
                  cardName={item.card_name}
                  cardNo={item.card_no}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Spin>
  );
};

export default CardTab;
