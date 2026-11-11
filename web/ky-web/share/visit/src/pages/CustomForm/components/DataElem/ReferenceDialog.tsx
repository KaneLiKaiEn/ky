import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, DatePicker, Form, Modal, Radio, Space } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import ReportLabViewer from "@/pages/ReportLab";
import type { ReportLabViewerHandle } from "@/pages/ReportLab";
import ReportExamViewer from "@/pages/ReportExam";
import ReportPathologyViewer from "@/pages/ReportPathology";
import type { FormContext } from "./types";
import dayjs from "dayjs";

export type ReferenceReportType = "lab" | "exam" | "pathology";

export interface ReferenceFilterFormValues {
  report_type: ReferenceReportType;
  date_range: [Dayjs, Dayjs] | null;
}

const getDefaultFilterValues = (): ReferenceFilterFormValues => ({
  report_type: "lab",
  date_range: [dayjs(), dayjs()],
});

const DATE_FORMAT = "YYYY-MM-DD";

export interface ReferenceDialogAddonProps {
  disabled?: boolean;
  context?: FormContext;
  onSelect?: (content: string) => void;
}

export const ReferenceDialogAddon: React.FC<ReferenceDialogAddonProps> = ({
  disabled,
  context,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const [form] = Form.useForm<ReferenceFilterFormValues>();
  const labRef = useRef<ReportLabViewerHandle>(null);

  const reportType = Form.useWatch("report_type", form) ?? "lab";
  const dateRange = Form.useWatch("date_range", form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(getDefaultFilterValues());
    setAbnormalOnly(false);
  }, [form, open]);

  const handleClose = () => {
    setOpen(false);
  };

  const [reportStart, reportEnd] = useMemo<
    [string | undefined, string | undefined]
  >(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return [undefined, undefined];
    }
    return [dateRange[0].format(DATE_FORMAT), dateRange[1].format(DATE_FORMAT)];
  }, [dateRange]);

  const handleAbnormalChange = (checked: boolean) => {
    setAbnormalOnly(checked);
  };

  const handleStructuredReference = () => {
    const content = labRef.current?.getStructuredReference() ?? "";
    if (!content) return;
    onSelect?.(content);
    handleClose();
  };

  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<LinkOutlined />}
        disabled={disabled}
        title="引用"
        onClick={() => setOpen(true)}
      />
      <Modal
        title="引用"
        open={open}
        width="90vw"
        destroyOnHidden
        onOk={handleClose}
        onCancel={handleClose}
      >
        <Form form={form} layout="inline" style={{ marginBottom: 12 }}>
          <Form.Item name="report_type">
            <Radio.Group>
              <Radio value="lab">检验报告</Radio>
              <Radio value="exam">检查报告</Radio>
              <Radio value="pathology">病理报告</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="date_range">
            <DatePicker.RangePicker
              format={DATE_FORMAT}
              placeholder={["开始日期", "结束日期"]}
            />
          </Form.Item>
          {reportType === "lab" ? (
            <Form.Item>
              <Space>
                <Checkbox
                  checked={abnormalOnly}
                  onChange={(e) => handleAbnormalChange(e.target.checked)}
                >
                  异常
                </Checkbox>
                <Button type="primary" onClick={handleStructuredReference}>
                  结构化引用
                </Button>
              </Space>
            </Form.Item>
          ) : null}
        </Form>

        {reportType === "lab" ? (
          <ReportLabViewer
            ref={labRef}
            visit_id={context?.visit_id}
            report_start={reportStart}
            report_end={reportEnd}
            abnormalChecked={abnormalOnly}
          />
        ) : null}
        {reportType === "exam" ? (
          <ReportExamViewer
            visit_id={context?.visit_id}
            report_start={reportStart}
            report_end={reportEnd}
          />
        ) : null}
        {reportType === "pathology" ? (
          <ReportPathologyViewer
            visit_id={context?.visit_id}
            report_start={reportStart}
            report_end={reportEnd}
          />
        ) : null}
      </Modal>
    </>
  );
};
