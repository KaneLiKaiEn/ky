import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Input, Empty, Tooltip, Modal, Form, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  deleteProblemItem,
  getProblemItemList,
  getProblemItemProperty,
  saveProblemItemActionList,
  saveProblemItemGoalList,
  saveProblemItemProperty,
} from "../api";
import EditProblemItem from "./EditProblemItem";

interface ProblemItemProps {
  chooseItem: any;
  setChooseItem: (val: any) => void;
  onProblemUpdated?: (problem: any) => void;
}

const ProblemItem = forwardRef<any, ProblemItemProps>(
  ({ chooseItem, setChooseItem, onProblemUpdated }, ref) => {
    const [problemList, setProblemList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormItem, setEditFormItem] = useState<any>(null);
    const [form] = Form.useForm();

    const fetchProblemList = async () => {
      try {
        const res = await getProblemItemList({ catalog_id: 1 });
        if (res.code === 0 || res.code === "0") {
          setProblemList(res.row_list || []);
        } else {
          message.error(res.message || "获取护理问题失败");
          setProblemList([]);
        }
      } catch (error) {
        console.error("fetchProblemList error:", error);
      }
    };

    useImperativeHandle(ref, () => ({
      refreshList: fetchProblemList,
    }));

    // 获取问题属性 回填 action_content / goal_content
    const fetchProblemItemProperty = async (item_id: number) => {
      const res = await getProblemItemProperty({
        item_id,
        column_do: "*",
        column_goal: "*",
      });
      if (res.code === 0 || res.code === "0") {
        const actionContents = (res.action_list || []).map(
          (item: any) => item.action_content || "",
        );
        const goalContents = (res.goal_list || []).map(
          (item: any) => item.goal_content || "",
        );

        const fullData = {
          ...res.item_property,
          _actionContents: actionContents,
          _goalContents: goalContents,
        };

        setEditFormItem(fullData);
        form.setFieldsValue(res.item_property);
        setEditModalOpen(true);
      } else {
        message.error(res.message || "获取问题属性失败");
      }
    };

    const handleSaveEdit = async () => {
      try {
        const values = await form.validateFields();

        const action_list = (editFormItem._actionContents || [])
          .filter((content: string) => content?.trim())
          .map((content: string) => ({ action_content: content.trim() }));
        const goal_list = (editFormItem._goalContents || [])
          .filter((content: string) => content?.trim())
          .map((content: string) => ({ goal_content: content.trim() }));

        const res = await saveProblemItemProperty({
          item_id: Number(editFormItem.item_id),
          item_property: {
            item_type: values.item_type || "",
            item_name: values.item_name,
            item_code: values.item_code || "",
            item_code_system: values.item_code_system || "",
            item_tag: values.item_tag || "",
            item_note: values.item_note || "",
            sort_no: values.sort_no || "",
          },
          action_list,
          goal_list,
        });
        await saveProblemItemActionList({
          item_id: Number(editFormItem.item_id),
          action_list,
        });
        await saveProblemItemGoalList({
          item_id: Number(editFormItem.item_id),
          goal_list,
        });

        if (res.code === 0 || res.code === "0") {
          message.success("修改成功");
          setEditModalOpen(false);
          form.resetFields();

          const updatedProblem = {
            item_id: Number(editFormItem.item_id),
            item_type: values.item_type || "",
            item_name: values.item_name,
            item_code: values.item_code || "",
            item_code_system: values.item_code_system || "",
            item_tag: values.item_tag || "",
            item_note: values.item_note || "",
            sort_no: values.sort_no || "",
            action_list: action_list.map((d: any) => ({
              action_content: d.action_content,
            })),
            goal_list: goal_list.map((g: any) => ({
              goal_content: g.goal_content,
            })),
          };

          if (onProblemUpdated) {
            onProblemUpdated(updatedProblem);
          }

          fetchProblemList();
        } else {
          message.error(res.message || "保存失败");
        }
      } catch (error: any) {
        if (error.errorFields) {
          message.warning("请完善必填项");
        }
      }
    };

    const handleDelete = async (item_id: number) => {
      Modal.confirm({
        title: "是否确认删除？",
        content: (
          <div>
            <p>确定要删除该问题以及问题包含的目标和措施吗？</p>
          </div>
        ),
        okText: "确认",
        okType: "danger",
        onOk: async () => {
          const res1 = await saveProblemItemActionList({
            item_id,
            action_list: [],
          });
          if (res1.code !== 0 && res1.code !== "0") {
            message.error(res1.message || "删除失败");
            return;
          }
          const res2 = await saveProblemItemGoalList({
            item_id,
            goal_list: [],
          });
          if (res2.code !== 0 && res2.code !== "0") {
            message.error(res2.message || "删除失败");
            return;
          }
          const res = await deleteProblemItem({ item_id });
          if (res.code === 0 || res.code === "0") {
            message.success("删除成功");
            fetchProblemList();
          } else {
            message.error(res.message || "删除失败");
          }
        },
      });
    };

    const filteredList = problemList.filter(
      (item) =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kb_code?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
      fetchProblemList();
    }, []);

    return (
      <>
        <div className="h-80 flex flex-col">
          <Input
            placeholder="搜索问题名称或编码"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
            size="small"
            allowClear
            onBlur={() => setSearchTerm("")}
          />
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredList.length > 0 ? (
              filteredList.map((item, idx) => (
                <div
                  key={item.item_id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-(--app-theme-primary-bg) transition ${
                    chooseItem?.item_id === item.item_id
                      ? "bg-(--app-theme-primary-bg) border-l-4 border-(--app-theme-primary)"
                      : ""
                  }`}
                  onClick={async () => {
                    setChooseItem(item);
                    try {
                      const res = await getProblemItemProperty({
                        item_id: item.item_id,
                        column_do: "*",
                        column_goal: "*",
                      });
                      if (res.code === 0 || res.code === "0") {
                        setChooseItem({
                          item_id: item.item_id,
                          ...res.item_property,
                          action_list: res.action_list || [],
                          goal_list: res.goal_list || [],
                        });
                      }
                    } catch (err) {
                      console.error(
                        `Failed to fetch property for ${item.item_id}`,
                        err,
                      );
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-(--app-theme-primary)  rounded text-white">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {item.item_name}
                      </div>
                      <Tooltip title={item.item_code}>
                        <div className="truncate">
                          {item.kb_code || item.item_code}
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="编辑">
                      <EditOutlined
                        style={{ color: "#1890FF" }}
                        className="cursor-pointer "
                        onClick={() => fetchProblemItemProperty(item.item_id)}
                      />
                    </Tooltip>
                    <Tooltip title="删除">
                      <DeleteOutlined
                        style={{ color: "#FF4D4F" }}
                        className=" cursor-pointer not-only-of-type: "
                        onClick={() => handleDelete(item.item_id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="暂无护理问题项目" className="py-6" />
            )}
          </div>
        </div>

        <Modal
          title="编辑项目"
          open={editModalOpen}
          onOk={handleSaveEdit}
          onCancel={() => {
            setEditModalOpen(false);
            form.resetFields();
          }}
          okText="确认"
          cancelText="取消"
          width={1000}
          destroyOnHidden={true}
        >
          <EditProblemItem
            problemItemProperty={editFormItem}
            setProblemItemProperty={setEditFormItem}
            form={form}
          />
        </Modal>
      </>
    );
  },
);

ProblemItem.displayName = "ProblemItem";
export default ProblemItem;
