import React from "react";
export interface ReportLabViewerProps {
    visit_id?: number;
    patient_id?: number;
    baby_id?: number;
    favorite_visit_id?: number;
    report_start?: string;
    report_end?: string;
    abnormalChecked?: boolean;
}
export interface ReportLabViewerHandle {
    getStructuredReference: () => string;
}
declare const ReportLabViewer: React.ForwardRefExoticComponent<ReportLabViewerProps & React.RefAttributes<ReportLabViewerHandle>>;
export default ReportLabViewer;
