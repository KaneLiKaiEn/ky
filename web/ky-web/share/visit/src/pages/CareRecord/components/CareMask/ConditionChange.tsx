import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, Checkbox, Input, message, Select } from "antd";
import PrefabManage from "./PrefabManage/PrefabManage";
import PersonalModal from "../PersonalModal/PersonalModal";
import io from "../../utils/io";
import { eventBus } from "../../../../utils/eventBus";

/** 护理记录「引用」：宿主监听后打开报告抽屉 */
export const CARE_RECORD_OPEN_REPORT = "care-record:open-report";
import {
  getCarePrefabContentAPI,
  getVisitPropertyAPI,
  getIoListAPI,
  newIoSumAPI,
  getIoSumPropertyAPI,
  getSurgeryListAPI,
} from "../../api";

export default function ConditionChange(props: any) {
  const {
    careProperty,
    setCareProperty,
    visitId: visitIdProp,
    onTemplateModalChange,
    lockedLink,
    showLoad24HourInOut = false,
    showLinkSurgery = true,
    showReportReference = false,
  } = props;
  const { visitId: visitIdParam } = useParams<{ visitId: string }>();
  const visitId = Number(visitIdProp ?? visitIdParam);
  const isLinkLocked = Boolean(
    lockedLink?.link_name === "手术" &&
    lockedLink?.link_value != null &&
    Number(lockedLink.link_value) > 0,
  );

  const [isShow, setIsShow] = useState<boolean>(false);
  const [prefabId, setPrefabId] = useState<any>("");
  const [contentDetail, setContentDetail] = useState<any>("");
  const [admissionTime, setAdmissionTime] = useState<any>("");

  function getCareContentValue(value: string) {
    setCareProperty({
      ...careProperty,
      care_content: value,
    });
  }

  function newCarePrefab() {
    if (!prefabId) {
      message.error("请先选择模板");
      return;
    }

    setCareProperty({
      ...careProperty,
      care_content: contentDetail,
    });

    setIsShow(false);
    onTemplateModalChange?.(false);
  }

  function openTemplateModal() {
    setIsShow(true);
    onTemplateModalChange?.(true);
  }

  function closeTemplateModal() {
    setIsShow(false);
    onTemplateModalChange?.(false);
  }

  function handleEnterPress() {
    getCarePrefabContentAPI({
      kb_code: careProperty.care_content,
    }).then((res: any) => {
      if (res.code == 0 && res.care_content != "") {
        setCareProperty({
          ...careProperty,
          care_content: res.care_content,
        });
      }
    });
  }

  const getIpProperty = () => {
    getVisitPropertyAPI({
      visit_id: visitId,
      column_ip: "*",
    }).then((res: any) => {
      if (res.code == 0 && res.ip_property) {
        setAdmissionTime(res.ip_property.admission_time);
      } else {
        message.error(`${res.message}${res.hint || ""}`);
      }
    });
  };

  useEffect(() => {
    if (visitId && showLoad24HourInOut) {
      getIpProperty();
    }
  }, [visitId, showLoad24HourInOut]);

  const handleLoad24HourInOut = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let startTime = `${yesterdayStr} 07:00:00`;
    let endTime = `${todayStr} 07:00:00`;

    if (admissionTime) {
      const admissionDateTime = new Date(admissionTime);
      const standardStartTime = new Date(`${yesterdayStr} 07:00:00`);

      if (admissionDateTime > standardStartTime) {
        startTime = admissionTime;
      }
    }

    getIoListAPI({
      visit_id: visitId,
      io_start: startTime,
      io_end: endTime,
    }).then((ioRes: any) => {
      const ioList = ioRes.row_list || [];
      const hoursSet = new Set<string>();

      ioList.forEach((item: any) => {
        if (item.io_time) {
          const timePart = item.io_time.split(" ")[1];
          if (timePart) {
            hoursSet.add(timePart);
          }
        }
      });

      const hourPrefix = `${hoursSet.size}H`;

      newIoSumAPI({
        visit_id: visitId,
        sum_start: startTime,
        sum_end: endTime,
      }).then((res: any) => {
        if (res.code == 0) {
          const sum_id = res.sum_id;
          getIoSumPropertyAPI({
            sum_id: sum_id,
          }).then((sumRes: any) => {
            if (sumRes.code == 0 && sumRes.sum_property) {
              const inOutContent = `${sumRes.sum_property.sum_in_detail}\n${sumRes.sum_property.sum_out_detail}`;
              const balanceContext = `${sumRes.sum_property.sum_in}-${sumRes.sum_property.sum_out}`;
              const [inVal, outVal] = balanceContext.split("-").map(parseFloat);
              const balance = inVal - outVal;

              setCareProperty((prev: any) => ({
                ...prev,
                care_content:
                  (prev.care_content || "") +
                  hourPrefix +
                  inOutContent +
                  "平衡量:" +
                  `${balance}ml`,
              }));
            } else {
              message.error(`${sumRes.message}${sumRes.hint || ""}`);
            }
          });
        } else {
          message.error(`${res.message}${res.hint || ""}`);
        }
      });
    });
  };

  const handleReportDetailsCopy = () => {
    eventBus.emit(CARE_RECORD_OPEN_REPORT, {
      visit_id: visitId,
    });
    io("PROGRAM_COMMAND", {
      tag: "OPEN_DATA_ISLAND",
      data: {
        visit_id: visitId,
      },
    });
  };

  // 关联手术：勾选后才展示并加载手术列表
  const [linkSurgery, setLinkSurgery] = useState(false);
  const [selectedOpsId, setSelectedOpsId] = useState<number | undefined>();
  const [selectedLinkTag, setSelectedLinkTag] = useState<string | undefined>();
  const [surgeryList, setSurgeryList] = useState<any[]>([]);

  // 编辑回显：仅在已有关联手术时同步勾选，避免勾选后未选手术被反向取消
  useEffect(() => {
    if (!showLinkSurgery) return;
    if (isLinkLocked) {
      const opsId = Number(lockedLink.link_value);
      const tag = lockedLink.link_tag ? String(lockedLink.link_tag) : undefined;
      setLinkSurgery(true);
      setSelectedOpsId(opsId);
      setSelectedLinkTag(tag);
      setCareProperty((prev: any) => {
        if (
          prev?.link_name === "手术" &&
          Number(prev?.link_value) === opsId &&
          (prev?.link_tag ? String(prev.link_tag) : undefined) === tag
        ) {
          return prev;
        }
        const next = { ...prev, link_name: "手术", link_value: opsId };
        if (tag) next.link_tag = tag;
        else delete next.link_tag;
        return next;
      });
      return;
    }
    if (
      careProperty?.link_name === "手术" &&
      careProperty?.link_value != null &&
      Number(careProperty.link_value) > 0
    ) {
      setLinkSurgery(true);
      setSelectedOpsId(Number(careProperty.link_value));
      setSelectedLinkTag(
        careProperty?.link_tag ? String(careProperty.link_tag) : undefined,
      );
    }
  }, [
    isLinkLocked,
    lockedLink?.link_value,
    lockedLink?.link_tag,
    careProperty?.link_name,
    careProperty?.link_value,
    careProperty?.link_tag,
    setCareProperty,
    showLinkSurgery,
  ]);

  useEffect(() => {
    if (
      !showLinkSurgery ||
      !linkSurgery ||
      visitId == null ||
      !Number.isFinite(visitId)
    ) {
      setSurgeryList([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getSurgeryListAPI({
          visit_id: visitId,
          ops_status: "[PLAN][SUSPEND][COMMIT][RECV][SCHEDULE]",
        });
        if (!cancelled) setSurgeryList(res.row_list ?? []);
      } catch (error) {
        console.error(error);
        if (!cancelled) setSurgeryList([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [linkSurgery, visitId, showLinkSurgery]);

  const updateSurgeryLink = (
    checked: boolean,
    opsId?: number,
    linkTag?: string,
  ) => {
    setLinkSurgery(checked);
    setSelectedOpsId(checked ? opsId : undefined);
    setSelectedLinkTag(checked ? linkTag : undefined);
    setCareProperty((prev: any) => {
      const next = { ...prev };
      if (checked && opsId != null) {
        next.link_name = "手术";
        next.link_value = opsId;
        if (linkTag) {
          next.link_tag = linkTag;
        } else {
          delete next.link_tag;
        }
      } else {
        delete next.link_name;
        delete next.link_value;
        delete next.link_tag;
      }
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" onClick={openTemplateModal}>
              模板
            </Button>
            {showLoad24HourInOut ? (
              <Button size="small" onClick={handleLoad24HourInOut}>
                载入24小时入出量
              </Button>
            ) : null}
            {showLinkSurgery ? (
              <>
                <Checkbox
                  checked={linkSurgery}
                  disabled={isLinkLocked}
                  onChange={(e) => {
                    updateSurgeryLink(e.target.checked, undefined);
                  }}
                >
                  关联手术
                </Checkbox>
                {linkSurgery && (
                  <div className="flex items-center gap-2">
                    <Select
                      allowClear={!isLinkLocked}
                      disabled={isLinkLocked}
                      size="small"
                      placeholder="请选择手术"
                      className="min-w-48"
                      value={selectedOpsId}
                      onChange={(value) => {
                        updateSurgeryLink(
                          true,
                          value != null ? Number(value) : undefined,
                          selectedLinkTag,
                        );
                      }}
                      options={surgeryList.map((item) => ({
                        label: item.plan_name,
                        value: item.ops_id,
                      }))}
                    />
                    <Select
                      allowClear={!isLinkLocked}
                      disabled={isLinkLocked}
                      size="small"
                      placeholder="请选择阶段"
                      className="min-w-28"
                      value={selectedLinkTag}
                      onChange={(value) => {
                        updateSurgeryLink(
                          true,
                          selectedOpsId,
                          value != null ? String(value) : undefined,
                        );
                      }}
                      options={[
                        { label: "术前", value: "[术前]" },
                        { label: "术中", value: "[术中]" },
                        { label: "术后", value: "[术后]" },
                      ]}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
          {showReportReference ? (
            <Button
              size="small"
              variant="link"
              color="blue"
              onClick={handleReportDetailsCopy}
            >
              引用
            </Button>
          ) : null}
        </div>

        <Input.TextArea
          placeholder="病情变化和措施内容"
          className="w-full!"
          autoSize={{ minRows: 6, maxRows: 12 }}
          style={{ resize: "vertical" }}
          value={careProperty.care_content}
          onChange={(e) => getCareContentValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              handleEnterPress();
            }
          }}
        />
      </div>

      <PersonalModal
        open={isShow}
        title="模板管理"
        confirmText="载入"
        width="90vw"
        styles={{ body: { minHeight: "65vh" } }}
        zIndex={1105}
        onCancel={closeTemplateModal}
        onOk={newCarePrefab}
        otherFooterBtn={
          <Button
            type="default"
            onClick={() => {
              setCareProperty((prev: any) => {
                const tmp = { ...prev };
                tmp.care_content += `${contentDetail}`;
                message.success("已添加");
                return tmp;
              });
            }}
          >
            引用
          </Button>
        }
      >
        {isShow ? (
          <PrefabManage
            visitId={visitId}
            prefabId={prefabId}
            setPrefabId={setPrefabId}
            contentDetail={contentDetail}
            setContentDetail={setContentDetail}
          />
        ) : null}
      </PersonalModal>
    </>
  );
}
