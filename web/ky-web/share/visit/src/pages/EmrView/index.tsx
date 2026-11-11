import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button, Spin, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import PdfViewer from "@/components/PdfViewer";
import { getDocVisit2Emr, getDocVisit2EmrUrl, savePrintDoc } from "@/api/doc";
import { getEmrProperty, getEmrContent } from "@/api/emr";
import { getSessionId } from "comm/session";
import type { EmrRow } from "@/types/emr";
import dayjs from "dayjs";
import EmrStakeholderSign from "../EmrContent/components/EmrStakeholderSign";

export interface EmrViewProps {
  emr_id: number;
  showToolbar?: boolean;
  onToggleToolbar?: () => void;
}

export interface EmrViewRef {
  /** 打印成功返回 true */
  print: () => Promise<boolean>;
  printPreview: () => void;
  reload: () => Promise<void>;
}

interface ProgressRow {
  key: string;
  text?: string | null;
}

const EmrView = forwardRef<EmrViewRef, EmrViewProps>(function EmrView(
  { emr_id, showToolbar, onToggleToolbar },
  ref,
) {
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emrProperty, setEmrProperty] = useState<EmrRow | null>(null);
  const [emrContent, setEmrContent] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadSeqRef = useRef(0);

  const isProgressNote = emrProperty?.doc_type === "病程记录";

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const loadDoc = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    revokeObjectUrl();
    setLoading(true);
    setDocUrl(null);
    setEmrProperty(null);
    setEmrContent(null);

    try {
      const res = await getEmrProperty({ emr_id });
      if (seq !== loadSeqRef.current) return;
      const property = res.emr_property ?? null;
      setEmrProperty(property);

      if (property?.doc_type === "病程记录") {
        const contentRes = await getEmrContent({ emr_id });
        if (seq !== loadSeqRef.current) return;
        setEmrContent(contentRes.emr_content ?? null);
        return;
      }

      setEmrContent(null);
      const blob = await getDocVisit2Emr({
        session_id: getSessionId() ?? "",
        emr_id,
      });
      if (seq !== loadSeqRef.current) return;
      const pdfBlob =
        blob instanceof Blob
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      if (seq !== loadSeqRef.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      objectUrlRef.current = objectUrl;
      setDocUrl(objectUrl);
    } catch {
      if (seq !== loadSeqRef.current) return;
      revokeObjectUrl();
      setEmrProperty(null);
      setEmrContent(null);
      setDocUrl(null);
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [emr_id]);

  useImperativeHandle(
    ref,
    () => ({
      print: async () => {
        if (!docUrl) {
          message.warning("请先生成pdf");
          return false;
        }
        try {
          const res = await axios.post("http://localhost:7890/print", {
            pdf: getDocVisit2EmrUrl({
              session_id: getSessionId() ?? "",
              emr_id,
            }),
          });
          if (res.data.code === 0) {
            try {
              await savePrintDoc({
                owner_type: "EMR",
                owner_id: emr_id,
                doc_type: emrProperty?.doc_type,
                doc_name: emrProperty?.doc_name,
                doc_tag: emrProperty?.doc_tag,
                print_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              });
            } catch (saveError) {
              console.log("savePrintDoc error: ", saveError);
            }
            message.success("打印成功!");
            return true;
          }
          return false;
        } catch (error) {
          console.log("error: ", error);
          message.error("打印失败");
          return false;
        }
      },
      printPreview: () => {
        if (!docUrl) {
          message.warning("请先生成pdf");
          return;
        }
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.src = docUrl;
        document.body.appendChild(iframe);

        let cleaned = false;
        let fallbackTimer = 0;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          window.clearTimeout(fallbackTimer);
          iframe.remove();
        };

        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            // PDF 插件就绪略有延迟
            window.setTimeout(() => {
              iframe.contentWindow?.print();
            }, 250);
          } catch (error) {
            console.log("error: ", error);
            message.error("打印预览失败");
            cleanup();
            return;
          }
          iframe.contentWindow?.addEventListener("afterprint", cleanup, {
            once: true,
          });
          fallbackTimer = window.setTimeout(cleanup, 60_000);
        };
      },
      reload: loadDoc,
    }),
    [docUrl, emr_id, emrProperty, loadDoc],
  );

  useEffect(() => {
    void loadDoc();
    return () => {
      loadSeqRef.current += 1;
      revokeObjectUrl();
    };
  }, [loadDoc]);

  const progressColumns: ColumnsType<ProgressRow> = [
    {
      title: dayjs(emrProperty?.emr_time).format("YYYY-MM-DD HH:mm") ?? "",
      dataIndex: "text",
      key: "text",
      width: 200,
      onCell: (record) => ({
        colSpan: 3,
        style:
          record.key === "users"
            ? undefined
            : {
                textAlign: "justify",
                textJustify: "inter-character",
                lineHeight: 2,
                whiteSpace: "pre-wrap",
              },
      }),
      render: (text, record) =>
        record.key === "users" ? (
          <EmrStakeholderSign
            emrId={emr_id}
            visitId={emrProperty?.visit_id}
            emrStatus={emrProperty?.emr_status}
          />
        ) : (
          text
        ),
    },
    {
      title: emrProperty?.emr_title ?? "",
      key: "emr_title",
      align: "center",
      onCell: () => ({ colSpan: 0 }),
    },
    {
      title: onToggleToolbar ? (
        <Button type="link" size="small" onClick={onToggleToolbar}>
          {showToolbar ? "隐藏操作栏" : "显示操作栏"}
        </Button>
      ) : (
        <></>
      ),
      key: "submit",
      width: 200,
      onCell: () => ({ colSpan: 0 }),
    },
  ];

  const progressData: ProgressRow[] = [
    { key: "content", text: emrContent ?? "" },
    { key: "users", text: emrProperty?.user_name_list },
  ];

  return (
    <Spin
      spinning={loading}
      wrapperClassName="h-full min-h-0 [&_.ant-spin-container]:h-full [&_.ant-spin-container]:min-h-0"
    >
      {isProgressNote ? (
        <Table<ProgressRow>
          bordered
          pagination={false}
          columns={progressColumns}
          dataSource={progressData}
          rowKey="key"
          size="small"
        />
      ) : (
        <PdfViewer className="report-exam__doc-frame h-full min-h-0" src={docUrl} />
      )}
    </Spin>
  );
});

export default EmrView;
