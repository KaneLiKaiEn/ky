import type { PatientInfoProps } from "./types";
/**
 * 患者信息主面板（可独立复用，不依赖 admission 业务）
 * - 默认 patientId + patient 服务
 * - fromVisit=true 时走 visit 服务（可传 visitId）
 */
declare const PatientInfo: React.FC<PatientInfoProps>;
export default PatientInfo;
