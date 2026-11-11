import { Modal } from "antd";
import PatientInfo from "./PatientInfo";
import type { PatientInfoModalProps } from "./types";

/**
 * 患者信息弹窗：内部承载可复用的 PatientInfo 面板
 */
const PatientInfoModal: React.FC<PatientInfoModalProps> = ({
  open,
  onClose,
  title = "患者信息",
  width = "100%",
  patientId,
  visitId,
  visitNo,
  visitType,
  fromVisit,
  onSaved,
  onDeleted,
  onVisitSelect,
  hideHeader,
  showVisitSelectBtn,
  showCardTab,
  showDeleteBtn,
}) => {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={null}
      width={width}
      destroyOnHidden
      centered
      styles={{
        body: {
          padding: 0,
          maxHeight: "calc(100vh - 160px)",
          overflow: "hidden",
        },
      }}
    >
      {open ? (
        <div className="h-[min(720px,calc(100vh-160px))]">
          <PatientInfo
            patientId={patientId}
            visitId={visitId}
            visitNo={visitNo}
            visitType={visitType}
            fromVisit={fromVisit}
            hideHeader={hideHeader}
            showVisitSelectBtn={showVisitSelectBtn}
            showCardTab={showCardTab}
            onSaved={onSaved}
            onDeleted={onDeleted}
            onVisitSelect={onVisitSelect}
            showDeleteBtn={showDeleteBtn}
          />
        </div>
      ) : null}
    </Modal>
  );
};

export default PatientInfoModal;
