import { PlusOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";

type EmrEmptyCreateProps = {
  description?: string;
  createText?: string;
  disabled?: boolean;
  onCreate?: () => void;
};

/** 无病历空态 + 带 icon 的新建按钮（single / radio 等共用） */
const EmrEmptyCreate = ({
  description = "暂无病历",
  createText = "新建",
  disabled,
  onCreate,
}: EmrEmptyCreateProps) => (
  <Empty
    description={
      <span className="inline-flex items-center gap-2">
        <span>{description}</span>
        {onCreate ? (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            disabled={disabled}
            onClick={onCreate}
          >
            {createText}
          </Button>
        ) : null}
      </span>
    }
  />
);

export default EmrEmptyCreate;
