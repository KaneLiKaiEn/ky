import { useDataThemeStyle } from "../../../theme";
import { Alert, Button, ConfigProvider, Space } from "antd";
import type { ReactNode, SyntheticEvent } from "react";
import Feedback from "../Feedback/index";
import "./style.scss";
export { default as Feedback } from "../Feedback/index";
export interface ManagementEditorProps {
  title: string;
  description?: string;
  className?: string;
  loading?: boolean;
  loadError?: string;
  retry: () => void;
  busy: boolean;
  error?: string;
  saved?: boolean;
  dirty: boolean;
  save: () => Promise<boolean>;
  children: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
  readOnly?: boolean;
  saveLabel?: string;
  hideTitle?: boolean;
  statusFooter?: boolean;
  footerNote?: ReactNode;
  recoveryAction?: { label?: string; run: () => unknown };
}
export default function ManagementEditor({
  title,
  description,
  className = "",
  loading = false,
  loadError,
  retry,
  busy,
  error,
  saved = false,
  dirty,
  save,
  children,
  actions,
  navigation,
  readOnly = false,
  saveLabel = "保存",
  hideTitle = false,
  statusFooter = true,
  footerNote,
  recoveryAction,
}: ManagementEditorProps) {
  const themeStyle = useDataThemeStyle();
  const disabled = busy || loading || !!loadError || readOnly;
  const block = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <section
      className={`mw-editor ${className}`}
      style={themeStyle}
      aria-label={title}
      aria-busy={busy || loading}
    >
      {(!hideTitle || actions || navigation) && (
        <header className="mw-panel-toolbar">
          {!hideTitle && (
            <div>
              <h3>{title}</h3>
              {description && <p>{description}</p>}
            </div>
          )}
          {navigation}
          {actions && (
            <ConfigProvider componentDisabled={disabled}>
              <fieldset
                className="mw-editor-actions"
                disabled={disabled}
                inert={disabled}
                onClickCapture={disabled ? block : undefined}
              >
                {actions}
              </fieldset>
            </ConfigProvider>
          )}
        </header>
      )}
      <Feedback loading={loading} error={loadError} retry={retry} />
      {error && error !== loadError && (
        <Alert type="error" showIcon title="保存失败" description={error} />
      )}
      {saved && !dirty && !error && !statusFooter && (
        <Alert type="success" showIcon title="所有修改已保存" />
      )}
      <ConfigProvider componentDisabled={disabled}>
        <fieldset
          className="mw-editor-body"
          disabled={disabled}
          inert={disabled}
          onClickCapture={disabled ? block : undefined}
          onChangeCapture={disabled ? block : undefined}
        >
          {!loading && children}
        </fieldset>
      </ConfigProvider>
      <footer className="mw-editor-footer">
        <span>
          {dirty ? "有未保存的修改" : "所有修改已保存"}
          {footerNote && <> · {footerNote}</>}
        </span>
        <Space wrap>
          {recoveryAction ? (
            <Button
              type="primary"
              loading={busy}
              disabled={busy || loading}
              onClick={() => void recoveryAction.run()}
            >
              {recoveryAction.label || "重试读取"}
            </Button>
          ) : (
            <Button
              type="primary"
              loading={busy}
              disabled={disabled || !dirty}
              onClick={() => void save()}
            >
              {saveLabel}
            </Button>
          )}
        </Space>
      </footer>
    </section>
  );
}
