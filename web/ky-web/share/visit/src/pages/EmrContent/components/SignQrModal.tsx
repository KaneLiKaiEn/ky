import { Button, Modal, Spin } from "antd";

export interface SignQrModalProps {
  open: boolean;
  title?: string;
  imageSrc?: string;
  onCancel: () => void;
}

const SignQrModal: React.FC<SignQrModalProps> = ({
  open,
  title = "CA 签名",
  imageSrc,
  onCancel,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={
        <Button onClick={onCancel}>关闭</Button>
      }
      destroyOnHidden
      width={360}
    >
      <div className="flex flex-col items-center gap-2 py-2">
        <p className="text-[14px] text-(--app-theme-text-secondary)">
          请使用 CA 客户端扫描下方二维码完成签名
        </p>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="签名二维码"
            className="h-[220px] w-[220px] rounded border border-(--app-theme-border) object-contain"
          />
        ) : (
          <div className="flex h-[220px] w-[220px] items-center justify-center">
            <Spin tip="正在生成二维码..." />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SignQrModal;
