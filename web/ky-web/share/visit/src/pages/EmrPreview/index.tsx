import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import PdfViewer from "@/components/PdfViewer";
import { getDocVisit2Emr, getDocVisit2Preview } from "@/api/doc";
import { getSessionId } from "comm/session";

export interface EmrPreviewProps {
  emr_id: number;
  owner_type?: string;
  /** 为 false 时请求 doc/visit2，不走 doc/visit2/preview */
  preview?: boolean;
}

const EmrPreview: React.FC<EmrPreviewProps> = ({
  emr_id,
  owner_type,
  preview = true,
}) => {
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setDocUrl(null);
    const session_id = getSessionId() ?? "";
    const request = preview
      ? getDocVisit2Preview({ session_id, owner_type, owner_id: emr_id })
      : getDocVisit2Emr({ session_id, owner_type, emr_id });
    request
      .then((blob) => {
        if (cancelled) return;
        const pdfBlob =
          blob instanceof Blob
            ? blob
            : new Blob([blob], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);
        setDocUrl(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setDocUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [emr_id, owner_type, preview]);

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <PdfViewer className="h-full min-h-0" src={docUrl} />
    </div>
  );
};

export default EmrPreview;