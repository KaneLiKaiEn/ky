import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { message } from "antd";
import {
  shouldShowCareContentForm,
  shouldShowVitalForm,
  type CareRecordTableColumnKey,
} from "../../columns";
import ConditionChange from "./ConditionChange";
import CarePrefabTemplate from "./CarePrefabTemplate";
import VitalObserveForm from "./VitalObserveForm";
import { getCarePropertyAPI } from "../../api";
import { getCurrentDateTime2 } from "../../utils/time-func";
import type { ElemProps } from "../../utils/care-related";

interface AddCareMaskProps {
  visitId?: number;
  type: "add" | "edit";
  /** 连续保存后指定的下一时间；不传则用当前时刻 */
  initialTime?: string;
  newTime: string;
  setNewTime: (value: string) => void;
  modifyTime: string;
  setModifyTime: (value: string) => void;
  senseProperty: ElemProps;
  setSenseProperty: Dispatch<SetStateAction<ElemProps>>;
  tubeProperty: ElemProps;
  setTubeProperty: Dispatch<SetStateAction<ElemProps>>;
  leftPupilProperty: ElemProps;
  setLeftPupilProperty: Dispatch<SetStateAction<ElemProps>>;
  rightPupilProperty: ElemProps;
  setRightPupilProperty: Dispatch<SetStateAction<ElemProps>>;
  leftReflexProperty: ElemProps;
  setLeftReflexProperty: Dispatch<SetStateAction<ElemProps>>;
  rightReflexProperty: ElemProps;
  setRightReflexProperty: Dispatch<SetStateAction<ElemProps>>;
  tempProperty: ElemProps;
  setTempProperty: Dispatch<SetStateAction<ElemProps>>;
  plusProperty: ElemProps;
  setPlusProperty: Dispatch<SetStateAction<ElemProps>>;
  heartProperty: ElemProps;
  setHeartProperty: Dispatch<SetStateAction<ElemProps>>;
  breathProperty: ElemProps;
  setBreathProperty: Dispatch<SetStateAction<ElemProps>>;
  sBpProperty: ElemProps;
  setSbpProperty: Dispatch<SetStateAction<ElemProps>>;
  dBpProperty: ElemProps;
  setDbpProperty: Dispatch<SetStateAction<ElemProps>>;
  spo2Property: ElemProps;
  setSpo2Property: Dispatch<SetStateAction<ElemProps>>;
  careId: string;
  initCareProperty: any;
  careProperty: any;
  setCareProperty: Dispatch<SetStateAction<any>>;
  lockedLink?: {
    link_name: string;
    link_value: number | string;
    link_tag?: string;
  };
  visibleColumns?: readonly CareRecordTableColumnKey[];
  /** 弹窗录入时拉宽病情措施区域 */
  compactLayout?: boolean;
  showLoad24HourInOut?: boolean;
  showLinkSurgery?: boolean;
  /** 为 true 时展示病情措施「引用」按钮（默认不展示） */
  showReportReference?: boolean;
}

export default function AddCareMask(props: AddCareMaskProps) {
  const {
    visitId,
    type,
    initialTime,
    setNewTime,
    senseProperty,
    setSenseProperty,
    tubeProperty,
    setTubeProperty,
    leftPupilProperty,
    setLeftPupilProperty,
    rightPupilProperty,
    setRightPupilProperty,
    leftReflexProperty,
    setLeftReflexProperty,
    rightReflexProperty,
    setRightReflexProperty,
    tempProperty,
    setTempProperty,
    plusProperty,
    setPlusProperty,
    heartProperty,
    setHeartProperty,
    breathProperty,
    setBreathProperty,
    sBpProperty,
    setSbpProperty,
    dBpProperty,
    setDbpProperty,
    spo2Property,
    setSpo2Property,
    careId,
    initCareProperty,
    careProperty,
    setCareProperty,
    lockedLink,
    visibleColumns,
    compactLayout = false,
    showLoad24HourInOut = false,
    showLinkSurgery = true,
    showReportReference = false,
  } = props;

  const [prefabRefreshKey, setPrefabRefreshKey] = useState(0);
  const showVital = shouldShowVitalForm(visibleColumns);
  const showCareContent = shouldShowCareContentForm(visibleColumns);
  /** 弹窗或无体征时：左侧病情 + 右侧模板（左右布局） */
  const sideBySide =
    showCareContent && (showVital || compactLayout);

  const refreshPrefabTemplate = () => {
    setPrefabRefreshKey((key) => key + 1);
  };

  useEffect(() => {
    if (type == "add") {
      const time = initialTime || getCurrentDateTime2();
      setNewTime(time);
      setCareProperty(initCareProperty);
    } else {
      getCareProperty(careId);
    }
  }, [type]);

  function getCareProperty(care_id: any) {
    getCarePropertyAPI({
      care_id: Number(care_id),
    }).then((res) => {
      if (res.code == 0) {
        setCareProperty(res.care_property);
      } else {
        setCareProperty(initCareProperty);
        message.error(res.message);
      }
    });
  }

  return (
    <div
      className={
        sideBySide
          ? "flex w-full flex-col gap-2 md:flex-row md:items-start"
          : "flex w-full flex-col gap-2"
      }
    >
      {(showVital || showCareContent) && (
        <div className="min-w-0 flex-1">
          {showVital ? (
            <VitalObserveForm
              visibleColumns={visibleColumns}
              senseProperty={senseProperty}
              setSenseProperty={setSenseProperty}
              tubeProperty={tubeProperty}
              setTubeProperty={setTubeProperty}
              leftPupilProperty={leftPupilProperty}
              setLeftPupilProperty={setLeftPupilProperty}
              rightPupilProperty={rightPupilProperty}
              setRightPupilProperty={setRightPupilProperty}
              leftReflexProperty={leftReflexProperty}
              setLeftReflexProperty={setLeftReflexProperty}
              rightReflexProperty={rightReflexProperty}
              setRightReflexProperty={setRightReflexProperty}
              tempProperty={tempProperty}
              setTempProperty={setTempProperty}
              plusProperty={plusProperty}
              setPlusProperty={setPlusProperty}
              heartProperty={heartProperty}
              setHeartProperty={setHeartProperty}
              breathProperty={breathProperty}
              setBreathProperty={setBreathProperty}
              sBpProperty={sBpProperty}
              setSbpProperty={setSbpProperty}
              dBpProperty={dBpProperty}
              setDbpProperty={setDbpProperty}
              spo2Property={spo2Property}
              setSpo2Property={setSpo2Property}
            />
          ) : null}

          {showCareContent ? (
            <div className={showVital ? "mt-1" : undefined}>
              <ConditionChange
                visitId={visitId}
                careProperty={careProperty}
                setCareProperty={setCareProperty}
                onTemplateModalChange={refreshPrefabTemplate}
                lockedLink={lockedLink}
                showLoad24HourInOut={showLoad24HourInOut}
                showLinkSurgery={showLinkSurgery}
                showReportReference={showReportReference}
              />
            </div>
          ) : null}
        </div>
      )}

      {showCareContent ? (
        <div
          className={
            sideBySide ? "w-full shrink-0 md:w-70" : "w-full min-w-0 flex-1"
          }
        >
          <div className="mb-1">病情变化与措施模板：</div>
          <CarePrefabTemplate
            refreshKey={prefabRefreshKey}
            onSelect={(careContent) => {
              setCareProperty((prev: any) => ({
                ...prev,
                care_content: `${prev.care_content || ""}${careContent}`,
              }));
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
