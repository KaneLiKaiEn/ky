import { useDataThemeStyle } from "../../../../theme";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  App,
  Button,
  Empty,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { printReport } from "../../../api/report";
import type { ReportRow } from "../../../types/report.d.ts";
import type { ArgValueRow } from "../../../types/source.d.ts";
import { errorText } from "comm/utils";
import Feedback from "../../../components/Feedback";
import { usePreview, type PreviewOptions } from "../hooks/usePreview";
import { allRows } from "../service";
import {
  csv,
  sortRows,
  success,
  type DataRow,
  type Link,
  type Sort,
  type Values,
} from "../model";
import { downloadBlob, excel } from "../files";
import Parameters from "./Parameters";
import DataTable from "./DataTable";
import PdfViewer from "./PdfViewer";

export default function ReportView({
  reportId,
  initial,
  active,
  instance,
  onLock,
  onLink,
  homeId,
  onHome,
  homeBusy,
  embedded = false,
  previewOptions,
}: {
  reportId: number;
  initial: Values;
  active: boolean;
  instance: string;
  onLock: (key: string, locked: boolean) => void;
  onLink: (
    link: Link,
    row: DataRow,
    values: Values,
    args: ArgValueRow[],
  ) => void;
  homeId?: number;
  onHome?: (row: ReportRow) => Promise<void>;
  homeBusy?: boolean;
  embedded?: boolean;
  previewOptions?: PreviewOptions;
}) {
  const variables = useDataThemeStyle();
  const [printOpen, setPrintOpen] = useState(false),
    [printAll, setPrintAll] = useState(false),
    [pdf, setPdf] = useState<string>();
  const w = usePreview(reportId, initial, active && !printOpen, {
      ...previewOptions,
      blocked: printOpen,
    }),
    { message } = App.useApp();
  const [sorts, setSorts] = useState<Sort[]>([]),
    [fileError, setFileError] = useState<string>();
  const locked = w.locked || !!homeBusy;
  const hostLocked = locked || printOpen;
  useEffect(() => {
    onLock(instance, hostLocked);
    return () => onLock(instance, false);
  }, [hostLocked, instance, onLock]);
  const property = w.meta?.property;
  const name = property?.report_name || `报表 ${reportId}`;
  const handleLink = useCallback(
    (link: Link, row: DataRow) => {
      if (w.view)
        onLink(link, row, w.view.snapshot.values, w.view.snapshot.args);
    },
    [onLink, w.view],
  );
  const runExport = async () => {
    setFileError(undefined);
    try {
      await w.fileOperation(async ({ meta, result, snapshot, ticket }) => {
        const rows = sortRows(
          await allRows(meta, snapshot, result, ticket),
          sorts,
        );
        ticket.check();
        const blob = await excel(meta, result, rows, snapshot.values, ticket);
        ticket.check();
        downloadBlob(blob, `${name}.xlsx`);
      });
    } catch (err) {
      setFileError(errorText(err));
    }
  };
  const generatePdf = async () => {
    setFileError(undefined);
    setPdf(undefined);
    try {
      await w.fileOperation(async ({ meta, result, snapshot, ticket }) => {
        const rows = sortRows(
          printAll
            ? await allRows(meta, snapshot, result, ticket)
            : result.rows,
          sorts,
        );
        ticket.check();
        const response = success(
          await ticket.run(() =>
            printReport(
              {
                report_id: reportId,
                arg_list: snapshot.args,
                data_format: "csv",
                data_content: csv(rows, result.columns),
              },
              ticket.signal,
            ),
          ),
        );
        ticket.check();
        if (
          response.file_format?.toLowerCase() !== "pdf" ||
          !response.file_content
        )
          throw new Error("打印未返回有效 PDF 文件");
        setPdf(response.file_content);
      });
    } catch (err) {
      setFileError(errorText(err));
    }
  };
  return (
    <section className="rp-report" aria-label={name} style={variables}>
      <div className="rp-report-header">
        {!embedded && (
          <Space wrap>
            <Typography.Title level={4}>{name}</Typography.Title>
            {property && <Tag>{property.report_type}</Tag>}
          </Space>
        )}
        <Space wrap>
          {onHome && property && (
            <Button
              icon={<StarOutlined />}
              disabled={w.locked || w.loading}
              loading={homeBusy}
              onClick={() =>
                void onHome(property)
                  .then(() =>
                    message.success(
                      homeId === reportId ? "已取消主页" : "已设为主页",
                    ),
                  )
                  .catch((err) => message.error(errorText(err)))
              }
            >
              {homeId === reportId ? "取消主页" : "设为主页"}
            </Button>
          )}
          {property?.report_type !== "CONTENT" && (
            <Button
              icon={<DownloadOutlined />}
              disabled={!w.view || locked || w.loading}
              onClick={() => void runExport()}
            >
              导出 Excel
            </Button>
          )}
          {property?.report_type !== "CONTENT" && (
            <Button
              icon={<PrinterOutlined />}
              disabled={!w.view || locked || w.loading}
              onClick={() => {
                setPrintAll(false);
                setPdf(undefined);
                setFileError(undefined);
                setPrintOpen(true);
              }}
            >
              打印
            </Button>
          )}
        </Space>
      </div>
      <Feedback
        loading={w.metaLoading}
        error={w.metaError}
        retry={w.retryMeta}
      />
      {w.meta && !w.metaError && (
        <>
          <Parameters
            requestRunner={previewOptions?.requestRunner}
            args={w.meta.args}
            values={w.draft}
            onChange={w.setDraft}
            onSearch={() => {
              setSorts([]);
              w.search();
            }}
            disabled={locked || !!homeBusy}
            loading={w.loading}
          />
          {w.error && (
            <Alert
              type="error"
              showIcon
              title="检索失败"
              description={w.error}
              action={
                <Button disabled={locked} onClick={w.retry}>
                  重试检索
                </Button>
              }
            />
          )}
          {fileError && !printOpen && (
            <Alert
              type="error"
              showIcon
              title="文件操作失败"
              description={fileError}
              closable
              onClose={() => setFileError(undefined)}
            />
          )}
          {w.view ? (
            <>
              <Typography.Text type="secondary" className="rp-snapshot-note">
                分页、导出和打印使用最近一次成功检索的条件。
              </Typography.Text>
              {w.view.result.pdf ? (
                <PdfViewer content={w.view.result.pdf} name={name} />
              ) : (
                <DataTable
                  result={w.view.result}
                  snapshot={w.view.snapshot}
                  reportType={property!.report_type!}
                  reportTag={property!.report_tag}
                  loading={w.loading}
                  working={w.working || !!homeBusy}
                  active={active}
                  sorts={sorts}
                  onSort={setSorts}
                  onPage={w.paginate}
                  onEdit={w.saveCell}
                  onEditing={w.setEditing}
                  onLink={handleLink}
                />
              )}
            </>
          ) : (
            !w.metaLoading && (
              <Empty
                description={w.loading ? "正在检索报表" : "请填写参数后检索"}
              />
            )
          )}
        </>
      )}
      <Modal
        style={variables}
        title={`${name} · 打印`}
        open={printOpen}
        zIndex={
          previewOptions ? 1560 + (previewOptions.depth ?? 0) * 100 : undefined
        }
        width="90vw"
        footer={null}
        closable={!w.working}
        mask={{ closable: !w.working }}
        onCancel={() => {
          if (!w.working) {
            setPrintOpen(false);
            setPdf(undefined);
          }
        }}
        destroyOnHidden
      >
        <Space wrap className="rp-print-actions">
          {property?.report_type === "TABLE" && (
            <Select
              aria-label="打印范围"
              value={printAll ? "all" : "page"}
              disabled={w.working}
              options={[
                { value: "page", label: "当前页" },
                { value: "all", label: "全部查询结果" },
              ]}
              onChange={(value) => {
                setPrintAll(value === "all");
                setPdf(undefined);
              }}
            />
          )}
          <Button
            type="primary"
            loading={w.working}
            disabled={w.editing}
            onClick={() => void generatePdf()}
          >
            生成打印预览
          </Button>
        </Space>
        {fileError && (
          <Alert type="error" title="打印失败" description={fileError} />
        )}
        {pdf && <PdfViewer content={pdf} name={name} />}
      </Modal>
    </section>
  );
}
