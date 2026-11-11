import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Space, Typography } from "antd";
import ActionNoteModal from "./components/ActionNoteModal";
import EmrQcTable from "./components/EmrQcTable";
import { useMedrecordQuality } from "./hooks/useMedrecordQuality";
import type { MedrecordQualityProps } from "./types";

export type { MedrecordQualityProps, MedrecordQualityRole } from "./types";

/**
 * 病历质控提交。
 * role=nurse 展示护理提交时间，role=doctor 展示医生提交时间。
 */
export default function MedrecordQuality({
  visitId,
  role = "nurse",
  onSuccess,
}: MedrecordQualityProps) {
  const {
    list,
    listLoading,
    commitLoading,
    commitTime,
    rollbackLoading,
    rollbackOpen,
    refresh,
    handleQcCheck,
    handleCommitQc,
    openRollback,
    closeRollback,
    handleRollbackQc,
  } = useMedrecordQuality(visitId, role, onSuccess);

  if (visitId == null) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Empty description="请先选择住院患者" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <Card
        size="small"
        title="质控提交"
        className="flex min-h-0 flex-1 flex-col overflow-hidden [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-0 [&_.ant-card-body]:flex-1 [&_.ant-card-body]:flex-col [&_.ant-card-body]:overflow-hidden"
        extra={
          <Space wrap>
            <Button size="small" onClick={handleQcCheck}>
              质控检查
            </Button>
            {commitTime ? null : (
              <Button
                type="primary"
                size="small"
                loading={commitLoading}
                onClick={() => void handleCommitQc()}
              >
                提交质控
              </Button>
            )}
            <Button size="small" onClick={openRollback}>
              申请退回
            </Button>
            {commitTime ? (
              <Typography.Text type="success">
                已提交（{commitTime}）
              </Typography.Text>
            ) : null}
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              title="刷新"
              loading={listLoading}
              onClick={() => void refresh()}
            />
          </Space>
        }
      >
        <EmrQcTable dataSource={list} loading={listLoading} />
      </Card>

      <ActionNoteModal
        open={rollbackOpen}
        title="申请退回"
        content="请填写申请退回原因后确认。"
        noteLabel="退回原因"
        noteRequired
        okText="确认退回"
        confirmLoading={rollbackLoading}
        onCancel={closeRollback}
        onOk={(note) => void handleRollbackQc(note)}
      />
    </div>
  );
}
