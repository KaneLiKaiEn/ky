import { useState } from "react";
import { EllipsisOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import type { ButtonProps } from "antd";

export type PrintToolbarProps = {
  label?: React.ReactNode;
  previewTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonProps["size"];
  type?: ButtonProps["type"];
  onPrint?: () => void | Promise<void>;
  onPrintPreview?: () => void;
};

/** 打印 + 打印预览组合按钮（病程记录等场景） */
const PrintToolbar = ({
  label = "打印",
  previewTitle = "打印预览",
  loading: loadingProp,
  disabled,
  size = "small",
  type,
  onPrint,
  onPrintPreview,
}: PrintToolbarProps) => {
  const [innerLoading, setInnerLoading] = useState(false);
  const loading = loadingProp ?? innerLoading;

  const handlePrint = async () => {
    if (!onPrint) return;
    setInnerLoading(true);
    try {
      await onPrint();
    } finally {
      setInnerLoading(false);
    }
  };

  return (
    <Space.Compact>
      <Button
        type={type}
        size={size}
        icon={<PrinterOutlined />}
        loading={loading}
        disabled={disabled}
        onClick={() => void handlePrint()}
      >
        {label}
      </Button>
      {onPrintPreview ? (
        <Button
          size={size}
          icon={<EllipsisOutlined />}
          title={previewTitle}
          disabled={disabled || loading}
          onClick={onPrintPreview}
        />
      ) : null}
    </Space.Compact>
  );
};

export default PrintToolbar;
