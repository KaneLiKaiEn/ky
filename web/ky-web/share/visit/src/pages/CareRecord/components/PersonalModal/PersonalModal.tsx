import React, { ReactNode } from 'react'
import { Modal, Button } from 'antd'

interface PersonalModalProps {
  open: boolean
  title: string
  onCancel: () => void
  onOk?: () => void
  confirmText?: string
  confirmLoading?: boolean
  width?: number | string
  styles?: { body?: React.CSSProperties }
  zIndex?: number
  children: ReactNode
  otherFooterBtn?: ReactNode
  showFooter?: boolean
}

export default function PersonalModal({
  open,
  title,
  onCancel,
  onOk,
  confirmText = '确认',
  confirmLoading,
  width,
  styles,
  zIndex,
  children,
  otherFooterBtn,
  showFooter = true,
}: PersonalModalProps) {
  const footer = showFooter ? (
    <>
      <Button onClick={onCancel}>关闭</Button>
      {otherFooterBtn}
      {onOk ? (
        <Button type="primary" onClick={onOk} loading={confirmLoading}>
          {confirmText}
        </Button>
      ) : null}
    </>
  ) : null

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      footer={footer}
      width={width ?? 720}
      styles={styles}
      zIndex={zIndex}
      destroyOnHidden
    >
      {children}
    </Modal>
  )
}
