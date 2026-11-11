import { useState } from "react";
import { Button, Dropdown } from "antd";
import {
  previewPrepayReceipt,
  printPrepayReceipt,
} from "../PrepayDeposit/utils/print";

export interface PrepayPrintDropdownProps {
  prepayId: number;
  /** 该条交易金额，打印时转为大写写入 link_value */
  amount?: string | number | null;
}

/** 行内「打印」下拉：打印 / 打印预览 */
const PrepayPrintDropdown = ({ prepayId, amount }: PrepayPrintDropdownProps) => {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      await printPrepayReceipt(prepayId, amount);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      await previewPrepayReceipt(prepayId, amount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dropdown
      trigger={["click"]}
      disabled={loading}
      menu={{
        items: [
          { key: "print", label: "打印" },
          { key: "preview", label: "打印预览" },
        ],
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          if (key === "print") void handlePrint();
          else void handlePreview();
        },
      }}
    >
      <Button
        type="link"
        className="px-0"
        loading={loading}
        onClick={(e) => e.stopPropagation()}
      >
        打印
      </Button>
    </Dropdown>
  );
};

export default PrepayPrintDropdown;
