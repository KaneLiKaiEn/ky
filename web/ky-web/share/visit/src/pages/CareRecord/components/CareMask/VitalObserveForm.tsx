import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AutoComplete, Input } from "antd";
import {
  dictOptions,
  FALLBACK_SENSE_LIST,
  LIGHT_REFLEX_OPTIONS,
  TUBE_CARE_OPTIONS,
  type ElemProps,
} from "../../utils/care-related";
import { ensureDictData } from "../../utils/dict-data";
import {
  getCachedElemProperty,
  loadElemProperty,
  type ElemPropertySnapshot,
} from "../../utils/elem-property";
import { buildTempRangeValues } from "../../../TemperatureSheet/components/EntryTable/TempValueSelect";
import {
  shouldShowVitalField,
  shouldShowVitalForm,
  type CareRecordTableColumnKey,
} from "../../columns";

interface VitalObserveFormProps {
  visibleColumns?: readonly CareRecordTableColumnKey[];
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
}

interface ValueRange {
  min: number;
  max: number;
}

function rangeOptions(min: number, max: number, step: number) {
  return buildTempRangeValues(min, max, step).map((value) => ({
    value,
    label: value,
  }));
}

const VITAL_POPUP_WIDTH = 420;

function VitalValueAutoComplete({
  className,
  value,
  options,
  onChange,
  onFocus,
}: {
  className?: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  onFocus?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AutoComplete
      size="small"
      className={className}
      value={value}
      options={options}
      allowClear
      open={open}
      onFocus={onFocus}
      onOpenChange={setOpen}
      popupMatchSelectWidth={false}
      styles={{ popup: { root: { width: VITAL_POPUP_WIDTH } } }}
      popupRender={() => (
        <div
          className="max-h-72 overflow-y-auto p-1"
          style={{ width: VITAL_POPUP_WIDTH }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div
            className="grid gap-0"
            style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
          >
            {options.map((item) => {
              const selected = value === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={[
                    "cursor-pointer border-0 bg-transparent px-1 py-0.5 text-center text-xs leading-5 outline-none",
                    selected
                      ? "bg-(--app-theme-primary-bg) font-semibold text-(--app-theme-primary)"
                      : "hover:bg-(--app-theme-primary-bg)",
                  ].join(" ")}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      onChange={(next) => onChange(next || "")}
    />
  );
}

function applyElemProperty(
  setter: Dispatch<SetStateAction<ElemProps>>,
  property: ElemPropertySnapshot,
  setRange?: Dispatch<SetStateAction<ValueRange>>,
) {
  setter((prev) => ({
    ...prev,
    elem_id: Number(property.elem_id) || prev.elem_id,
    elem_code: property.elem_code || prev.elem_code,
    elem_name: property.elem_name || prev.elem_name,
  }));
  if (!setRange) return;
  const min = Number(property.value_min);
  const max = Number(property.value_max);
  if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
    setRange({ min, max });
  }
}

function activateElem(
  elemName: string,
  current: ElemProps,
  setter: Dispatch<SetStateAction<ElemProps>>,
  setRange?: Dispatch<SetStateAction<ValueRange>>,
) {
  const cached = getCachedElemProperty(elemName);
  if (cached) {
    applyElemProperty(setter, cached, setRange);
    return;
  }
  if (current.elem_id && !setRange) return;
  void loadElemProperty(elemName).then((property) => {
    if (property) applyElemProperty(setter, property, setRange);
  });
}

export default function VitalObserveForm(props: VitalObserveFormProps) {
  const {
    visibleColumns,
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
  } = props;

  const showField = (field: Parameters<typeof shouldShowVitalField>[1]) =>
    shouldShowVitalField(visibleColumns, field);

  const [senseList, setSenseList] = useState(FALLBACK_SENSE_LIST);
  const [tempRange, setTempRange] = useState<ValueRange>({ min: 35, max: 42 });
  const [plusRange, setPlusRange] = useState<ValueRange>({ min: 0, max: 100 });
  const [heartRange, setHeartRange] = useState<ValueRange>({ min: 0, max: 200 });
  const [breathRange, setBreathRange] = useState<ValueRange>({
    min: 0,
    max: 100,
  });

  const tempOptions = useMemo(
    () => rangeOptions(tempRange.min, tempRange.max, 0.1),
    [tempRange.min, tempRange.max],
  );
  const plusOptions = useMemo(
    () => rangeOptions(plusRange.min, plusRange.max, 1),
    [plusRange.min, plusRange.max],
  );
  const heartOptions = useMemo(
    () => rangeOptions(heartRange.min, heartRange.max, 1),
    [heartRange.min, heartRange.max],
  );
  const breathOptions = useMemo(
    () => rangeOptions(breathRange.min, breathRange.max, 1),
    [breathRange.min, breathRange.max],
  );

  if (!shouldShowVitalForm(visibleColumns)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded border-1  border-(--app-theme-border) p-2">
      {showField("sense") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">神志：</span>
        <AutoComplete
          size="small"
          className="w-[110px]"
          value={senseProperty.observe_value}
          options={dictOptions(senseList)}
          allowClear
          onFocus={() => {
            activateElem("神志", senseProperty, setSenseProperty);
            ensureDictData("ops.sense", senseList, setSenseList);
          }}
          onChange={(value) =>
            setSenseProperty((prev) => ({
              ...prev,
              observe_value: value || "",
            }))
          }
        />
      </div>
      ) : null}
      {showField("temp") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">体温：</span>
        <VitalValueAutoComplete
          className="w-[80px]"
          value={tempProperty.observe_value}
          options={tempOptions}
          onFocus={() =>
            activateElem("体温", tempProperty, setTempProperty, setTempRange)
          }
          onChange={(value) =>
            setTempProperty((prev) => ({ ...prev, observe_value: value }))
          }
        />
        <span className="whitespace-nowrap text-(--app-theme-text-secondary)">
          ℃
        </span>
      </div>
      ) : null}
      {showField("plus") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">脉搏：</span>
        <VitalValueAutoComplete
          className="w-[90px]"
          value={plusProperty.observe_value}
          options={plusOptions}
          onFocus={() =>
            activateElem("脉搏", plusProperty, setPlusProperty, setPlusRange)
          }
          onChange={(value) =>
            setPlusProperty((prev) => ({ ...prev, observe_value: value }))
          }
        />
        <span className="whitespace-nowrap text-(--app-theme-text-secondary)">
          次/分
        </span>
      </div>
      ) : null}
      {showField("heart") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">心率：</span>
        <VitalValueAutoComplete
          className="w-[90px]"
          value={heartProperty.observe_value}
          options={heartOptions}
          onFocus={() =>
            activateElem("心率", heartProperty, setHeartProperty, setHeartRange)
          }
          onChange={(value) =>
            setHeartProperty((prev) => ({ ...prev, observe_value: value }))
          }
        />
        <span className="whitespace-nowrap text-(--app-theme-text-secondary)">
          次/分
        </span>
      </div>
      ) : null}
      {showField("breath") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">呼吸：</span>
        <VitalValueAutoComplete
          className="w-[90px]"
          value={breathProperty.observe_value}
          options={breathOptions}
          onFocus={() =>
            activateElem(
              "呼吸",
              breathProperty,
              setBreathProperty,
              setBreathRange,
            )
          }
          onChange={(value) =>
            setBreathProperty((prev) => ({ ...prev, observe_value: value }))
          }
        />
        <span className="whitespace-nowrap text-(--app-theme-text-secondary)">
          次/分
        </span>
      </div>
      ) : null}
      {showField("bp") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">血压：</span>
        <Input
          size="small"
          className="w-[72px]"
          value={sBpProperty.observe_value}
          onFocus={() => activateElem("收缩压", sBpProperty, setSbpProperty)}
          onChange={(e) =>
            setSbpProperty((prev) => ({
              ...prev,
              observe_value: e.target.value,
            }))
          }
        />
        <span>/</span>
        <Input
          size="small"
          className="w-[92px]"
          suffix="mmHg"
          value={dBpProperty.observe_value}
          onFocus={() => activateElem("舒张压", dBpProperty, setDbpProperty)}
          onChange={(e) =>
            setDbpProperty((prev) => ({
              ...prev,
              observe_value: e.target.value,
            }))
          }
        />
      </div>
      ) : null}
      {showField("spo2") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">SPO2：</span>
        <Input
          size="small"
          className="w-[80px]"
          suffix="%"
          value={spo2Property.observe_value}
          onFocus={() => activateElem("SpO2", spo2Property, setSpo2Property)}
          onChange={(e) =>
            setSpo2Property((prev) => ({
              ...prev,
              observe_value: e.target.value,
            }))
          }
        />
      </div>
      ) : null}
      {showField("tube") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">管道护理：</span>
        <AutoComplete
          size="small"
          className="w-[80px]"
          value={tubeProperty.observe_value}
          options={dictOptions(TUBE_CARE_OPTIONS)}
          allowClear
          onFocus={() => activateElem("管道护理", tubeProperty, setTubeProperty)}
          onChange={(value) =>
            setTubeProperty((prev) => ({
              ...prev,
              observe_value: value || "",
            }))
          }
        />
      </div>
      ) : null}
      {showField("left_pupil") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">左瞳孔大小：</span>
        <Input
          size="small"
          className="w-[80px]"
          suffix="mm"
          value={leftPupilProperty.observe_value}
          onFocus={() =>
            activateElem("左瞳孔大小", leftPupilProperty, setLeftPupilProperty)
          }
          onChange={(e) =>
            setLeftPupilProperty((prev) => ({
              ...prev,
              observe_value: e.target.value,
            }))
          }
        />
      </div>
      ) : null}
      {showField("right_pupil") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">右瞳孔大小：</span>
        <Input
          size="small"
          className="w-[80px]"
          suffix="mm"
          value={rightPupilProperty.observe_value}
          onFocus={() =>
            activateElem("右瞳孔大小", rightPupilProperty, setRightPupilProperty)
          }
          onChange={(e) =>
            setRightPupilProperty((prev) => ({
              ...prev,
              observe_value: e.target.value,
            }))
          }
        />
      </div>
      ) : null}
      {showField("left_reflex") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">左对光反射：</span>
        <AutoComplete
          size="small"
          className="w-[90px]"
          value={leftReflexProperty.observe_value}
          options={dictOptions(LIGHT_REFLEX_OPTIONS)}
          allowClear
          onFocus={() =>
            activateElem("左对光反射", leftReflexProperty, setLeftReflexProperty)
          }
          onChange={(value) =>
            setLeftReflexProperty((prev) => ({
              ...prev,
              observe_value: value || "",
            }))
          }
        />
      </div>
      ) : null}
      {showField("right_reflex") ? (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">右对光反射：</span>
        <AutoComplete
          size="small"
          className="w-[90px]"
          value={rightReflexProperty.observe_value}
          options={dictOptions(LIGHT_REFLEX_OPTIONS)}
          allowClear
          onFocus={() =>
            activateElem(
              "右对光反射",
              rightReflexProperty,
              setRightReflexProperty,
            )
          }
          onChange={(value) =>
            setRightReflexProperty((prev) => ({
              ...prev,
              observe_value: value || "",
            }))
          }
        />
      </div>
      ) : null}
    </div>
  );
}
