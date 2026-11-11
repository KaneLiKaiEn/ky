import React, { useEffect, useState } from "react";
import { Form, Input, Table, Button } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
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
} from "../utils/plan-rows";

interface EditProblemItemProps {
  problemItemProperty: Record<string, any> | null;
  setProblemItemProperty: (val: Record<string, any>) => void;
  form: any;
}

const EditProblemItem: React.FC<EditProblemItemProps> = ({
  problemItemProperty,
  setProblemItemProperty,
  form,
}) => {
  const [planAction, setPlanAction] = useState<ActionRow[]>([emptyActionRow()]);
  const [planGoal, setPlanGoal] = useState<GoalRow[]>([emptyGoalRow()]);

  useEffect(() => {
    if (!problemItemProperty) return;

    form.setFieldsValue(problemItemProperty);

    const actionContents: string[] = problemItemProperty._actionContents || [];
    const goalContents: string[] = problemItemProperty._goalContents || [];

    setPlanAction(
      buildActionRows(
        actionContents.map((action_content) => ({ action_content })),
        false,
      ),
    );
    setPlanGoal(
      buildGoalRows(
        goalContents.map((goal_content) => ({ goal_content })),
        false,
      ),
    );
  }, [problemItemProperty?.item_id, form]);

  const syncActionContents = (rows: ActionRow[]) => {
    setProblemItemProperty({
      ...problemItemProperty,
      _actionContents: rows.map((item) => item.action_content),
    });
  };

  const syncGoalContents = (rows: GoalRow[]) => {
    setProblemItemProperty({
      ...problemItemProperty,
      _goalContents: rows.map((item) => item.goal_content),
    });
  };

  const handleValuesChange = (_: any, allValues: any) => {
    setProblemItemProperty({ ...problemItemProperty, ...allValues });
  };

  const handleActionChange = (idx: number, value: string) => {
    const next = [...planAction];
    next[idx] = { ...next[idx], action_content: value };
    setPlanAction(next);
    syncActionContents(next);
  };

  const handleGoalChange = (idx: number, value: string) => {
    const next = [...planGoal];
    next[idx] = { ...next[idx], goal_content: value };
    setPlanGoal(next);
    syncGoalContents(next);
  };

  const actionColumns = [
    {
      title: "序号",
      width: 50,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "护理措施",
      dataIndex: "action_content",
      render: (_: any, record: ActionRow, index: number) => (
        <Input
          size="small"
          value={record.action_content}
          placeholder={`措施${index + 1}`}
          onChange={(e) => handleActionChange(index, e.target.value)}
        />
      ),
    },
    {
      title: "操作",
      key: "op",
      width: 90,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <div className="flex items-center justify-center">
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            title="新增"
            onClick={() => {
              const next = addActionRow(planAction, index);
              setPlanAction(next);
              syncActionContents(next);
            }}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除"
            onClick={() => {
              const next = removeActionRow(planAction, index);
              setPlanAction(next);
              syncActionContents(next);
            }}
          />
        </div>
      ),
    },
  ];

  const goalColumns = [
    {
      title: "序号",
      width: 50,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "护理目标",
      dataIndex: "goal_content",
      render: (_: any, record: GoalRow, index: number) => (
        <Input
          size="small"
          value={record.goal_content}
          placeholder={`目标${index + 1}`}
          onChange={(e) => handleGoalChange(index, e.target.value)}
        />
      ),
    },
    {
      title: "操作",
      key: "op",
      width: 90,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <div className="flex items-center justify-center">
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            title="新增"
            onClick={() => {
              const next = addGoalRow(planGoal, index);
              setPlanGoal(next);
              syncGoalContents(next);
            }}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除"
            onClick={() => {
              const next = removeGoalRow(planGoal, index);
              setPlanGoal(next);
              syncGoalContents(next);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-2">
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        className="space-y-2"
      >
        <Form.Item
          label="问题名称"
          name="item_name"
          rules={[{ required: true, message: "请输入问题名称" }]}
        >
          <Input size="small" placeholder="请输入问题名称" />
        </Form.Item>
        <Form.Item label="问题类型" name="item_type">
          <Input size="small" placeholder="请输入问题类型" />
        </Form.Item>
        <Form.Item label="排序号" name="sort_no">
          <Input size="small" type="number" placeholder="请输入排序号" />
        </Form.Item>

        <div className="flex w-full gap-2">
          <div className="w-1/2 overflow-hidden rounded-lg">
            <div className="bg-(--app-theme-bg-fill-alter) px-3 py-2 font-medium">
              护理措施
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              <Table
                size="small"
                rowKey="key"
                pagination={false}
                columns={actionColumns}
                dataSource={planAction}
              />
            </div>
          </div>

          <div className="w-1/2 overflow-hidden rounded-lg">
            <div className="bg-(--app-theme-bg-fill-alter) px-3 py-2 font-medium">
              护理目标
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              <Table
                size="small"
                rowKey="key"
                pagination={false}
                columns={goalColumns}
                dataSource={planGoal}
              />
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default EditProblemItem;
