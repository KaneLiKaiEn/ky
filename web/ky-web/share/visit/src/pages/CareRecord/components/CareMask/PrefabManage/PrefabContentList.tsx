import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Checkbox, Input, Modal, Space, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PersonalModal from "../../PersonalModal/PersonalModal";
import {
  getCarePrefabListAPI,
  newCarePrefabAPI,
  deleteCarePrefabAPI,
  saveCarePrefabPropertyAPI,
} from "../../../api";

export default function PrefabContentList(props: any) {
  const {
    catalogId,
    prefabId,
    setPrefabId,
    getPrefabDetail,
    setPrefabInput,
    visitId: visitIdProp,
  } = props;
  const orgID = localStorage.getItem("SITE_AUTH_CA_ORG_ID");
  const { visitId: visitIdParam } = useParams<{ visitId: string }>();
  const visitId = Number(visitIdProp ?? visitIdParam);

  const [prefabList, setPrefabList] = useState<any[]>([]);
  const [isOrg, setIsOrg] = useState<boolean>(false);
  const [isDept, setIsDept] = useState<boolean>(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [newPrefabInfo, setNewPrefabInfo] = useState({
    prefab_name: "",
    prefab_tag: "",
    prefab_note: "",
    sort_no: "",
  });

  const [editPrefabInfo, setEditPrefabInfo] = useState({
    prefab_id: 0,
    prefab_name: "",
    prefab_tag: "",
    prefab_note: "",
    sort_no: "",
  });

  const prefabTagList = [
    { id: "001", name: "科室共享1", value: "科室共享" },
    { id: "002", name: "机构共享1", value: "机构共享" },
  ];

  const prefabTagEditList = [
    { id: "001", name: "科室共享2", value: "科室共享" },
    { id: "002", name: "机构共享2", value: "机构共享" },
  ];

  function getPrefabList(include_dept: boolean, include_org: boolean) {
    getCarePrefabListAPI({
      org_id: Number(orgID),
      catalog_type: "PREFAB.CARE.CONTENT",
      catalog_id: Number(catalogId),
      include_dept: include_dept,
      include_org: include_org,
    }).then((res) => {
      if (res.code == 0 && res.row_list.length > 0) {
        setPrefabList(res.row_list);
      } else {
        setPrefabList([]);
      }
    });
  }

  function togglePrefabTag(
    currentTag: string,
    value: string,
    checked: boolean,
  ) {
    if (checked) {
      return currentTag.includes(`[${value}]`)
        ? currentTag
        : currentTag + `[${value}]`;
    }
    return currentTag.replace(`[${value}]`, "");
  }

  function addNewAnesPrefab() {
    newCarePrefabAPI({
      anes_id: visitId,
      catalog_id: Number(catalogId),
      prefab_name: newPrefabInfo.prefab_name,
      prefab_tag: newPrefabInfo.prefab_tag,
      prefab_note: newPrefabInfo.prefab_note,
      sort_no: newPrefabInfo.sort_no,
    }).then((res) => {
      if (res.code == 0) {
        message.success("添加成功");
        getPrefabList(isDept, isOrg);
      } else {
        message.error(res.message);
      }
      setAddModalOpen(false);
    });
  }

  function handleDeletePrefab(prefab_id: number) {
    Modal.confirm({
      title: "确定删除？",
      onOk: () =>
        deleteCarePrefabAPI({
          prefab_id: Number(prefab_id),
          delete_note: "",
        }).then((res) => {
          if (res.code == 0) {
            message.success("删除成功");
            getPrefabList(isDept, isOrg);
          } else {
            message.error(res.message);
          }
        }),
    });
  }

  function saveEditPrefab() {
    saveCarePrefabPropertyAPI({
      prefab_id: Number(editPrefabInfo.prefab_id),
      prefab_property: {
        prefab_name: editPrefabInfo.prefab_name,
        prefab_tag: editPrefabInfo.prefab_tag,
        sort_no: editPrefabInfo.sort_no,
      },
    }).then((res) => {
      if (res.code == 0) {
        message.success("保存成功");
        setEditModalOpen(false);
        getPrefabList(isDept, isOrg);
      } else {
        message.error(res.message);
      }
    });
  }

  useEffect(() => {
    if (catalogId) {
      getPrefabList(isDept, isOrg);
    }
  }, [catalogId]);

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 border-b border-(--app-theme-border) pb-1">
        <div>模板列表</div>
        {catalogId ? (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            title="新增"
            onClick={() => setAddModalOpen(true)}
          />
        ) : null}
      </div>

      {catalogId ? (
        <div className="flex items-center gap-4 py-1">
          <Checkbox
            checked={isDept}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsDept(checked);
              getPrefabList(checked, isOrg);
            }}
          >
            科室共享
          </Checkbox>
          <Checkbox
            checked={isOrg}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsOrg(checked);
              getPrefabList(isDept, checked);
            }}
          >
            机构共享
          </Checkbox>
        </div>
      ) : null}

      <div className="relative h-[50vh] overflow-auto p-0">
        {prefabList.map((item: any) => (
          <div
            key={item.prefab_id}
            className="group relative flex cursor-pointer items-center border-b border-(--app-theme-border)"
          >
            <div
              className={`flex-1 px-3 py-2 ${
                prefabId == item.prefab_id
                  ? "bg-(--app-theme-primary) text-white"
                  : ""
              }`}
              onClick={() => {
                setPrefabId(item.prefab_id);
                getPrefabDetail(item.prefab_id);
                setPrefabInput(item.input_note);
              }}
            >
              {item.prefab_name}
            </div>

            <span className="absolute right-2 hidden group-hover:inline-flex">
              <Space size={0} onClick={(e) => e.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  title="编辑"
                  onClick={() => {
                    setEditPrefabInfo({
                      prefab_id: Number(item.prefab_id),
                      prefab_name: item.prefab_name,
                      prefab_note: item.prefab_note || "",
                      prefab_tag: item.prefab_tag || "",
                      sort_no: item.sort_no || "",
                    });
                    setEditModalOpen(true);
                  }}
                />
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  title="删除"
                  onClick={() => handleDeletePrefab(item.prefab_id)}
                />
              </Space>
            </span>
          </div>
        ))}
      </div>

      <PersonalModal
        open={editModalOpen}
        title="修改模板"
        onCancel={() => setEditModalOpen(false)}
        onOk={saveEditPrefab}
      >
        <div className="mb-2">
          <label className="mb-1 block text-(--app-theme-primary)">
            模板名称
          </label>
          <Input
            placeholder="输入模板名称"
            value={editPrefabInfo.prefab_name}
            onChange={(e) =>
              setEditPrefabInfo({
                ...editPrefabInfo,
                prefab_name: e.target.value,
              })
            }
          />
        </div>
        <div className="mb-2">
          <label className="mb-1 block text-(--app-theme-primary)">序号</label>
          <Input
            value={editPrefabInfo.sort_no}
            onChange={(e) =>
              setEditPrefabInfo({ ...editPrefabInfo, sort_no: e.target.value })
            }
          />
        </div>
        <div className="mb-2">
          <label className="mb-1 block text-(--app-theme-primary)">
            模板标识
          </label>
          <div className="flex gap-4">
            {prefabTagEditList.map((item) => (
              <Checkbox
                key={item.id}
                checked={editPrefabInfo.prefab_tag.includes(item.value)}
                onChange={(e) =>
                  setEditPrefabInfo({
                    ...editPrefabInfo,
                    prefab_tag: togglePrefabTag(
                      editPrefabInfo.prefab_tag,
                      item.value,
                      e.target.checked,
                    ),
                  })
                }
              >
                {item.value}
              </Checkbox>
            ))}
          </div>
        </div>
      </PersonalModal>

      <PersonalModal
        open={addModalOpen}
        title="添加模板"
        onCancel={() => setAddModalOpen(false)}
        onOk={addNewAnesPrefab}
      >
        <div className="mb-2">
          <label className="mb-1 block text-(--app-theme-primary)">
            模板名称
          </label>
          <Input
            placeholder="输入模板名称"
            value={newPrefabInfo.prefab_name}
            onChange={(e) =>
              setNewPrefabInfo({
                ...newPrefabInfo,
                prefab_name: e.target.value,
              })
            }
          />
        </div>
        <div className="mb-2">
          <label className="mb-1 block text-(--app-theme-primary)">序号</label>
          <Input
            value={newPrefabInfo.sort_no}
            onChange={(e) =>
              setNewPrefabInfo({ ...newPrefabInfo, sort_no: e.target.value })
            }
          />
        </div>
        <div className="mb-2">
          <label className="mb-1 block text-(--app-theme-primary)">
            模板标识
          </label>
          <div className="flex gap-4">
            {prefabTagList.map((item) => (
              <Checkbox
                key={item.id}
                checked={newPrefabInfo.prefab_tag.includes(item.value)}
                onChange={(e) =>
                  setNewPrefabInfo({
                    ...newPrefabInfo,
                    prefab_tag: togglePrefabTag(
                      newPrefabInfo.prefab_tag,
                      item.value,
                      e.target.checked,
                    ),
                  })
                }
              >
                {item.value}
              </Checkbox>
            ))}
          </div>
        </div>
      </PersonalModal>
    </div>
  );
}
