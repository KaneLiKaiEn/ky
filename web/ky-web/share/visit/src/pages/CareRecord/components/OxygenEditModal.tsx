import { useEffect, useState } from "react";
import { AutoComplete, Button, DatePicker, Input, Modal, message } from "antd";
import dayjs from "dayjs";
import {
  deleteOxygenAPI,
  getOxygenPropertyAPI,
  newOxygenAPI,
  saveOxygenPropertyAPI,
} from "../api";
import { dictOptions } from "../utils/care-related";
import { ensureDictData } from "../utils/dict-data";
import { getCurrentDateTime2 } from "../utils/time-func";

interface OxygenForm {
  oxygen_id: number;
  oxygen_method: string;
  oxygen_rate: number;
  oxygen_tidal: number;
  oxygen_br: number;
  oxygen_concentration: number;
  start_time: string;
}

const emptyOxygen = (startTime: string): OxygenForm => ({
  oxygen_id: 0,
  oxygen_method: "",
  oxygen_rate: 0,
  oxygen_tidal: 0,
  oxygen_br: 0,
  oxygen_concentration: 0,
  start_time: startTime,
});

interface OxygenEditModalProps {
  active: boolean;
  visitId: number;
  careTime: string;
  oxygenId?: number;
  hasOxygen?: boolean;
  onSaved: () => void;
  onCancel?: () => void;
}

export default function OxygenEditModal(props: OxygenEditModalProps) {
  const { active, visitId, careTime, oxygenId, hasOxygen, onSaved, onCancel } =
    props;
  const [saving, setSaving] = useState(false);
  const [methodList, setMethodList] = useState<any[]>([]);
  const [form, setForm] = useState<OxygenForm>(() =>
    emptyOxygen(careTime || getCurrentDateTime2()),
  );
  const isEdit = Boolean(oxygenId && hasOxygen);
  const isVentilator = form.oxygen_method?.includes("呼吸机");

  useEffect(() => {
    if (!active) return;

    if (oxygenId && hasOxygen) {
      getOxygenPropertyAPI({ oxygen_id: oxygenId }).then((res: any) => {
        const property = res?.oxygen_property;
        if (property) {
          setForm({
            oxygen_id: Number(property.oxygen_id),
            oxygen_method: property.oxygen_method || "",
            oxygen_rate: Number(property.oxygen_rate) || 0,
            oxygen_tidal: Number(property.oxygen_tidal) || 0,
            oxygen_br: Number(property.oxygen_br) || 0,
            oxygen_concentration: Number(property.oxygen_concentration) || 0,
            start_time: property.start_time || careTime,
          });
        } else {
          setForm(emptyOxygen(careTime || getCurrentDateTime2()));
        }
      });
    } else {
      setForm(emptyOxygen(careTime || getCurrentDateTime2()));
    }
  }, [active, oxygenId, hasOxygen, careTime]);

  const applyMethod = (method: string) => {
    if (method?.includes("呼吸机")) {
      setForm((prev) => ({
        ...prev,
        oxygen_method: method,
        oxygen_tidal: prev.oxygen_tidal || 400,
        oxygen_concentration: prev.oxygen_concentration || 40,
        oxygen_br: prev.oxygen_br || 12,
        oxygen_rate: 0,
      }));
    } else if (
      ["吸氧", "给氧", "面罩"].some((keyword) => method.includes(keyword))
    ) {
      setForm((prev) => ({
        ...prev,
        oxygen_method: method,
        oxygen_tidal: 0,
        oxygen_concentration: 0,
        oxygen_br: 0,
        oxygen_rate: prev.oxygen_rate || 5,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        oxygen_method: method,
        oxygen_tidal: 0,
        oxygen_concentration: 0,
        oxygen_br: 0,
      }));
    }
  };

  const handleSave = async () => {
    if (!form.start_time) {
      message.warning("请选择时间");
      return;
    }
    if (!form.oxygen_method) {
      message.warning("请填写吸氧方式");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        oxygen_rate: Number(form.oxygen_rate) || 0,
        oxygen_tidal: Number(form.oxygen_tidal) || 0,
        oxygen_br: Number(form.oxygen_br) || 0,
        oxygen_concentration: Number(form.oxygen_concentration) || 0,
        oxygen_method: form.oxygen_method,
        start_time: form.start_time,
      };
      const res = isEdit
        ? await saveOxygenPropertyAPI({
            oxygen_id: form.oxygen_id,
            oxygen_property: payload,
          })
        : await newOxygenAPI({
            visit_id: visitId,
            ...payload,
          });
      if (res.code == 0) {
        message.success(isEdit ? "保存成功" : "添加成功");
        onSaved();
      } else {
        message.error(res.message || "保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!form.oxygen_id) return;
    Modal.confirm({
      title: "确认删除",
      content: "是否删除该吸氧记录？",
      okText: "确认",
      okType: "danger",
      onOk: async () => {
        const res = await deleteOxygenAPI({ oxygen_id: form.oxygen_id });
        if (res.code == 0) {
          message.success("已删除");
          onSaved();
        } else {
          message.error(res.message || "删除失败");
        }
      },
    });
  };

  const handleTimeChange = (date: dayjs.Dayjs | null) => {
    const formatted = date ? date.format("YYYY-MM-DD HH:mm:00") : "";
    setForm((prev) => ({
      ...prev,
      start_time: formatted,
    }));
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-(--app-theme-border) bg-(--app-theme-bg-container) px-2 py-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span>时间：</span>
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            value={form.start_time ? dayjs(form.start_time) : null}
            onChange={handleTimeChange}
            className="min-w-0 max-w-full"
            size="small"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          {isEdit ? (
            <Button size="small" danger onClick={handleDelete}>
              删除
            </Button>
          ) : null}

          <Button
            size="small"
            type="primary"
            loading={saving}
            onClick={() => void handleSave()}
          >
            确定
          </Button>
          <Button size="small" onClick={() => onCancel?.()}>
            取消
          </Button>
        </div>
      </div>
      <div className="p-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-[110px] shrink-0 text-right">方式：</span>
            <AutoComplete
              className="flex-1"
              value={form.oxygen_method}
              options={dictOptions(methodList)}
              allowClear
              onFocus={() =>
                ensureDictData("oxygen.method", methodList, setMethodList)
              }
              onChange={(value) => applyMethod(value || "")}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[110px] shrink-0 text-right">氧流量：</span>
            <Input
              className="flex-1"
              suffix="L/min"
              value={form.oxygen_rate || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  oxygen_rate: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[110px] shrink-0 text-right">潮气量：</span>
            <Input
              className="flex-1"
              suffix="ml"
              disabled={!isVentilator}
              value={form.oxygen_tidal || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  oxygen_tidal: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[110px] shrink-0 text-right">浓度：</span>
            <Input
              className="flex-1"
              suffix="%"
              disabled={!isVentilator}
              value={form.oxygen_concentration || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  oxygen_concentration: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[110px] shrink-0 text-right">频率：</span>
            <Input
              className="flex-1"
              suffix="n/min"
              disabled={!isVentilator}
              value={form.oxygen_br || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  oxygen_br: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
