import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  DatePicker,
  Modal,
  Space,
  Input,
  Checkbox,
  Select,
  Table,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import NewProblemItem, { NewProblemItemRef } from "./components/NewProblemItem";
import ProblemItem from "./components/ProblemItem";
import {
  deletePlan,
  getSessionInfoAPI,
  newPlan,
  newProblemItem,
  savePlanActionList,
  savePlanGoalList,
  savePlanProperty,
  saveProblemItemActionList,
  saveProblemItemGoalList,
  getProblemItemList,
  getProblemItemProperty,
} from "./api";
import {
  ActionRow,
  GoalRow,
  addActionRow,
  addGoalRow,
  buildActionRows,
  buildGoalRows,
  emptyActionRow,
  emptyGoalRow,
  removeActionRow,
  removeGoalRow,
} from "./utils/plan-rows";
import { filterSelectOption } from "./utils/filter-select";
import { useAutoHeight } from "./hooks/use-auto-height";

export interface CarePlanProblemProps {
  visit_id: number;
  /** 刷新上半区护理计划列表；护士站联动时传入 */
  getPlanList?: () => void;
  /** 当前选中的护理计划；有值时进入编辑模式 */
  planProperty?: any;
  /** 更新/清空当前选中护理计划 */
  setPlanProperty?: (val: any) => void;
  /** 传入时自动选中对应护理问题并回填措施/目标 */
  item_id?: number | string;
  /** 新建护理计划保存成功后回调 */
  onSaved?: () => void;
}

/**
 * 护理计划编辑区（护理问题 / 措施 / 目标）
 */
export default function CarePlanProblem({
  visit_id,
  getPlanList,
  planProperty,
  setPlanProperty,
  item_id,
  onSaved,
}: CarePlanProblemProps) {
  const [planTime, setPlanTime] = useState<string>("");
  const [chooseItem, setChooseItem] = useState<any>(null);
  const [problemList, setProblemList] = useState<any[]>([]);

  const [planAction, setPlanAction] = useState<ActionRow[]>([emptyActionRow()]);
  const [planGoal, setPlanGoal] = useState<GoalRow[]>([emptyGoalRow()]);

  const resetActionGoal = () => {
    setPlanAction([emptyActionRow()]);
    setPlanGoal([emptyGoalRow()]);
  };

  const tableRef = useRef<HTMLDivElement>(null);
  const { clientHeight } = useAutoHeight(tableRef, { toBottom: 50 });

  const [problemModalOpen, setProblemModalOpen] = useState(false);
  const [newProblemModalOpen, setNewProblemModalOpen] = useState(false);

  const problemItemRef = useRef<any>(null);
  const newProblemItemRef = useRef<NewProblemItemRef>(null);
  const lockProblemSelect = item_id != null && item_id !== "";

  const applyProblemProperty = async (
    targetId: number | string,
    extra?: Record<string, any>,
  ) => {
    try {
      const res = await getProblemItemProperty({
        item_id: targetId,
        column_do: "*",
        column_goal: "*",
      });
      if (res.code === 0 || res.code === "0") {
        const selectedProblem = {
          item_id: targetId,
          ...res.item_property,
          ...extra,
          action_list: res.action_list || [],
          goal_list: res.goal_list || [],
        };
        setChooseItem(selectedProblem);
        setPlanAction(buildActionRows(selectedProblem.action_list, true));
        setPlanGoal(buildGoalRows(selectedProblem.goal_list, true));
        return selectedProblem;
      }
      message.error(res.message || "获取问题属性失败");
    } catch (err) {
      console.error(`Failed to fetch property for ${targetId}`, err);
    }
    return null;
  };

  const fetchProblemList = async () => {
    try {
      const res = await getProblemItemList({ catalog_id: 1 });
      if (res.code === 0 || res.code === "0") {
        const list = res.row_list || [];
        setProblemList(list);
        return list;
      }
    } catch (error) {
      console.error("fetchProblemList error:", error);
    }
    return [];
  };

  useEffect(() => {
    setPlanTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
    void fetchProblemList();
  }, []);

  useEffect(() => {
    setChooseItem(null);
    resetActionGoal();
  }, [visit_id]);

  // 上半区选中计划时回填
  useEffect(() => {
    if (planProperty?.plan_id) {
      setChooseItem({
        item_id: planProperty.link_value,
        item_name: planProperty.plan_name,
        fromTable: true,
        action_list: planProperty.action_list || [],
        goal_list: planProperty.goal_list || [],
      });

      if (planProperty.plan_time) {
        setPlanTime(planProperty.plan_time);
      }

      setPlanAction(buildActionRows(planProperty.action_list || [], true));
      setPlanGoal(buildGoalRows(planProperty.goal_list || [], true));
    }
  }, [planProperty]);

  // 外部传入 item_id 时自动选中护理问题并回填措施/目标
  useEffect(() => {
    if (planProperty?.plan_id) return;
    if (item_id == null || item_id === "") return;
    if (!problemList.length) return;
    const selectedProblem = problemList.find(
      (item) => Number(item.item_id) === Number(item_id),
    );
    if (!selectedProblem) return;
    void applyProblemProperty(item_id, { item_name: selectedProblem.item_name });
  }, [item_id, problemList, planProperty?.plan_id]);

  useEffect(() => {
    if (chooseItem?.item_id && !chooseItem.fromTable) {
      setPlanAction(buildActionRows(chooseItem.action_list || [], true));
      setPlanGoal(buildGoalRows(chooseItem.goal_list || [], true));
    }
  }, [chooseItem]);

  const clearChooseItem = () => {
    setChooseItem(null);
    resetActionGoal();
  };

  const handleNewProblemOk = async () => {
    const data = newProblemItemRef.current?.getProblemItem();
    if (!data?.item_name?.trim()) {
      message.warning("请输入问题名称");
      return Promise.reject();
    }

    try {
      const res = await newProblemItem({
        catalog_id: 1,
        item_type: data.item_type || "",
        item_name: data.item_name,
        item_code: data.item_code || "",
        item_code_system: data.item_code_system || "",
        item_tag: data.item_tag || "",
        item_note: data.item_note || "",
        sort_no: data.sort_no || "",
      });

      if (res.code === 0) {
        const problemId = res.item_id;

        const checkedActions = (data.planAction || [])
          .filter((i: any) => i.action_content?.trim())
          .map((i: any) => ({
            item_id: problemId,
            action_content: i.action_content.trim(),
          }));

        if (checkedActions.length > 0) {
          const res1 = await saveProblemItemActionList({
            item_id: problemId,
            action_list: checkedActions,
          });
          if (res1.code !== 0) {
            message.error(res1.message || "新增失败");
          }
        }

        const checkedGoals = (data.planGoal || [])
          .filter((i: any) => i.goal_content?.trim())
          .map((i: any) => ({
            item_id: problemId,
            goal_content: i.goal_content.trim(),
          }));

        if (checkedGoals.length > 0) {
          const res2 = await saveProblemItemGoalList({
            item_id: problemId,
            goal_list: checkedGoals,
          });
          if (res2.code !== 0) {
            message.error(res2.message || "新增失败");
          }
        }
        message.success("新增成功");
        problemItemRef.current?.refreshList?.();
        newProblemItemRef.current?.resetForm?.();
        setNewProblemModalOpen(false);
        setTimeout(async () => {
          await fetchProblemList();
          await applyProblemProperty(problemId);
        }, 300);
      } else {
        message.error(res.message || "新增失败");
        setNewProblemModalOpen(false);
      }
    } catch (error) {
      console.error("新增接口异常:", error);
      return Promise.reject();
    }
  };

  const newProblemReq = async () => {
    if (!chooseItem?.item_name) {
      message.warning("请选择护理问题");
      return;
    }

    const sessionId = getSessionId();
    if (!sessionId) {
      message.warning("请先登录");
      return;
    }

    const sessionRes = await getSessionInfoAPI({ session_id: sessionId });
    if (sessionRes.code !== 0 && sessionRes.code !== "0") {
      message.error(
        (sessionRes.message || "获取会话信息失败") + (sessionRes.hint || ""),
      );
      return;
    }

    const user = sessionRes.session_info;
    if (!user?.user_id) {
      message.error("获取会话信息失败");
      return;
    }

    const planActionValue = planAction.filter(
      (i: any) => i.checked && i.action_content?.trim(),
    );
    const planGoalValue = planGoal.filter(
      (i: any) => i.checked && i.goal_content?.trim(),
    );

    const newRes = await newPlan({
      visit_id: Number(visit_id),
      user_id: Number(user.user_id),
      user_name: user.user_name,
      plan_time: planTime,
      plan_name: chooseItem.item_name,
      link_value: chooseItem.item_id,
      action_list: planActionValue.map((i: any) => ({
        ...(i.action_id != null ? { action_id: Number(i.action_id) } : {}),
        item_id: Number(chooseItem.item_id),
        action_content: i.action_content.trim(),
      })),
      goal_list: planGoalValue.map((i: any) => ({
        item_id: Number(chooseItem.item_id),
        item_name: i.goal_content.trim(),
      })),
    });

    if (newRes.code === 0 || newRes.code === "0") {
      message.success("保存成功");
      setTimeout(() => {
        getPlanList?.();
        resetActionGoal();
        setChooseItem(null);
        setPlanProperty?.(null);
        onSaved?.();
      }, 500);
    } else {
      message.error(newRes.message || "新增失败");
    }
  };

  const deletePlanReq = () => {
    Modal.confirm({
      title: "确认删除",
      content: "是否确认删除该护理计划？",
      okText: "确定",
      cancelText: "取消",
      onOk: async () => {
        const deleteRes = await deletePlan({
          plan_id: Number(planProperty.plan_id),
        });
        if (deleteRes.code === 0 || deleteRes.code === "0") {
          message.success("删除成功！");
          getPlanList?.();
          setChooseItem(null);
          setPlanProperty?.(null);
          resetActionGoal();
        } else {
          message.error(deleteRes.message || "删除失败");
        }
      },
    });
  };

  const modifyPlanReq = async () => {
    if (planProperty?.plan_status === "COMMIT") {
      message.warning("已提交护理计划，不可修改，如要修改，请先取消提交");
      return;
    }
    const saveRes = await savePlanProperty({
      plan_id: Number(planProperty.plan_id),
      plan_property: {
        plan_time: planTime,
        plan_name: chooseItem.item_name,
        link_value: chooseItem.item_id,
      },
    });

    if (saveRes.code === 0 || saveRes.code === "0") {
      const promises: Promise<any>[] = [];
      const planActionValue = planAction.filter(
        (i: any) => i.checked && i.action_content?.trim(),
      );

      promises.push(
        savePlanActionList({
          plan_id: Number(planProperty.plan_id),
          delete_row: 0,
          row_list: planActionValue.map((i: any) => ({
            ...(i.action_id != null ? { action_id: Number(i.action_id) } : {}),
            item_id: Number(chooseItem.item_id),
            action_content: i.action_content.trim(),
          })),
        }),
      );

      const planGoalValue = planGoal.filter(
        (i: any) => i.checked && i.goal_content?.trim(),
      );

      promises.push(
        savePlanGoalList({
          plan_id: Number(planProperty.plan_id),
          delete_row: 0,
          row_list: planGoalValue.map((i: any) => ({
            item_id: Number(chooseItem.item_id),
            item_name: i.goal_content.trim(),
          })),
        }),
      );

      if (promises.length > 0) {
        const results = await Promise.all(promises);
        const errors = results
          .filter((r: any) => r.code !== 0 && r.code !== "0")
          .map((r: any) => r.message);
        if (errors.length > 0) {
          message.error(errors.join("<br/>"));
        } else {
          message.success("保存成功");
        }
      }

      setTimeout(async () => {
        await getPlanList?.();

        if (planProperty?.plan_id) {
          setPlanProperty?.({
            ...planProperty,
            plan_time: planTime,
            plan_name: chooseItem.item_name,
            link_value: chooseItem.item_id,
            action_list: planAction
              .filter((i: any) => i.checked && i.action_content?.trim())
              .map((i: any) => ({
                ...(i.action_id != null ? { action_id: Number(i.action_id) } : {}),
                item_id: Number(chooseItem.item_id),
                action_content: i.action_content.trim(),
              })),
            goal_list: planGoal
              .filter((i: any) => i.checked && i.goal_content?.trim())
              .map((i: any) => ({
                item_id: Number(chooseItem.item_id),
                item_name: i.goal_content.trim(),
              })),
          });
        }
      }, 500);
    } else {
      message.error(saveRes.message || "修改失败");
    }
  };

  const cancelPlanReq = () => {
    setPlanTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
    setChooseItem(null);
    resetActionGoal();
    setPlanProperty?.(null);
  };

  const handleCheckboxChange = (
    list: any[],
    idx: number,
    checked: boolean,
    type: "action" | "goal",
  ) => {
    const newList = [...list];
    newList[idx] = { ...newList[idx], checked };
    if (type === "action") setPlanAction(newList);
    else setPlanGoal(newList);
  };

  const handleProblemSelect = (selectedId: number) => {
    const selectedProblem = problemList.find(
      (item) => item.item_id === selectedId,
    );
    if (!selectedProblem) return;
    setChooseItem(selectedProblem);
    resetActionGoal();
    void applyProblemProperty(selectedId, {
      item_name: selectedProblem.item_name,
    });
  };

  const handleItemChange = (
    list: any[],
    idx: number,
    value: string,
    type: "action" | "goal",
  ) => {
    const newList = [...list];
    const fieldName = type === "action" ? "action_content" : "goal_content";
    newList[idx] = {
      ...newList[idx],
      [fieldName]: value,
      checked: value.trim() !== "",
    };
    if (type === "action") setPlanAction(newList);
    else setPlanGoal(newList);
  };

  const actionColumns = [
    {
      title: "序号",
      width: 44,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "护理措施",
      dataIndex: "action_content",
      render: (_: any, record: ActionRow, index: number) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={record.action_content || ""}
          onChange={(e) =>
            handleItemChange(planAction, index, e.target.value, "action")
          }
        />
      ),
    },
    {
      title: "选",
      width: 40,
      align: "center" as const,
      render: (_: any, record: ActionRow, index: number) => (
        <Checkbox
          checked={!!record.checked}
          onChange={(e) =>
            handleCheckboxChange(planAction, index, e.target.checked, "action")
          }
        />
      ),
    },
    {
      title: "操作",
      width: 80,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <div className="flex items-center justify-center">
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            title="新增"
            onClick={() => setPlanAction(addActionRow(planAction, index))}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除"
            onClick={() => setPlanAction(removeActionRow(planAction, index))}
          />
        </div>
      ),
    },
  ];

  const goalColumns = [
    {
      title: "序号",
      width: 44,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "护理目标",
      dataIndex: "goal_content",
      render: (_: any, record: GoalRow, index: number) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={record.goal_content || ""}
          onChange={(e) =>
            handleItemChange(planGoal, index, e.target.value, "goal")
          }
        />
      ),
    },
    {
      title: "选",
      width: 40,
      align: "center" as const,
      render: (_: any, record: GoalRow, index: number) => (
        <Checkbox
          checked={!!record.checked}
          onChange={(e) =>
            handleCheckboxChange(planGoal, index, e.target.checked, "goal")
          }
        />
      ),
    },
    {
      title: "操作",
      width: 80,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <div className="flex items-center justify-center">
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            title="新增"
            onClick={() => setPlanGoal(addGoalRow(planGoal, index))}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除"
            onClick={() => setPlanGoal(removeGoalRow(planGoal, index))}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-1">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <span>时间：</span>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            value={planTime ? dayjs(planTime) : null}
            onChange={(_, dateStr) => setPlanTime(dateStr as string)}
            className="w-48"
            size="small"
          />
        </div>
        <Space size="small">
          {planProperty ? (
            <>
              <Button size="small" onClick={cancelPlanReq} type="primary">
                新增
              </Button>
              <Button size="small" danger onClick={deletePlanReq}>
                删除
              </Button>
              <Button size="small" type="primary" onClick={modifyPlanReq}>
                确定
              </Button>
            </>
          ) : (
            <Button size="small" type="primary" onClick={newProblemReq}>
              确定
            </Button>
          )}
        </Space>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
        <div className="w-1/5 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <span>护理问题：</span>
            <Button
              size="small"
              type="primary"
              disabled={lockProblemSelect}
              onClick={() => setProblemModalOpen(true)}
            >
              维护
            </Button>
          </div>

          <Select
            size="small"
            value={chooseItem?.item_id}
            placeholder="请选择护理问题"
            disabled={lockProblemSelect}
            onChange={handleProblemSelect}
            style={{ width: "100%" }}
            showSearch
            filterOption={(input, option) =>
              filterSelectOption(input, {
                item_name:
                  typeof option?.label === "string"
                    ? option.label
                    : String(option?.label ?? ""),
              })
            }
          >
            {problemList.map((item) => (
              <Select.Option
                key={item.item_id}
                value={item.item_id}
                label={item.item_name}
              >
                {item.item_name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="flex w-2/5 min-h-0 flex-col overflow-hidden rounded-lg">
          <div className="shrink-0 bg-(--app-theme-bg-fill-alter) px-3 py-2 font-medium">
            护理措施
          </div>
          <div ref={tableRef} className="min-h-0 flex-1 overflow-hidden">
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              columns={actionColumns}
              dataSource={planAction}
              scroll={{ y: clientHeight }}
            />
          </div>
        </div>

        <div className="flex w-2/5 min-h-0 flex-col overflow-hidden rounded-lg">
          <div className="shrink-0 bg-(--app-theme-bg-fill-alter) px-3 py-2 font-medium">
            护理目标
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              columns={goalColumns}
              dataSource={planGoal}
              scroll={{ y: clientHeight }}
            />
          </div>
        </div>
      </div>

      <Modal
        title="护理问题"
        open={problemModalOpen}
        onCancel={() => {
          setProblemModalOpen(false);
          setChooseItem(null);
          clearChooseItem();
        }}
        footer={
          <div className="flex items-center justify-between">
            <Button
              key="add"
              type="primary"
              onClick={() => setNewProblemModalOpen(true)}
            >
              新增
            </Button>
            <Space>
              <Button
                key="cancel"
                onClick={() => {
                  setProblemModalOpen(false);
                  setChooseItem(null);
                }}
              >
                取消
              </Button>
              <Button
                key="ok"
                type="primary"
                onClick={() => setProblemModalOpen(false)}
              >
                确定
              </Button>
            </Space>
          </div>
        }
        width={600}
      >
        <ProblemItem
          ref={problemItemRef}
          chooseItem={chooseItem}
          setChooseItem={setChooseItem}
          onProblemUpdated={(updatedProblem) => {
            fetchProblemList();
            setChooseItem(updatedProblem);
            setPlanAction(buildActionRows(updatedProblem.action_list || [], true));
            setPlanGoal(buildGoalRows(updatedProblem.goal_list || [], true));
          }}
        />
      </Modal>

      <Modal
        title="新增项目"
        open={newProblemModalOpen}
        onOk={handleNewProblemOk}
        onCancel={() => {
          newProblemItemRef.current?.resetForm();
          setNewProblemModalOpen(false);
        }}
        okText="确认"
        cancelText="取消"
        width={1000}
        destroyOnHidden
      >
        <NewProblemItem ref={newProblemItemRef} />
      </Modal>
    </div>
  );
}

export type { CarePlanProblemProps as CarePlanProblemPageProps };
