import { App, Button, Space } from "antd";

export interface WorkspaceConfirmationState {
  pending?: Promise<boolean>;
}

interface WorkspaceConfirmationOptions {
  saveOnly?: boolean;
  content?: string;
  wrap?: boolean;
  showSave?: boolean;
  canSave?: () => boolean;
  save: () => Promise<boolean> | undefined;
  onDiscard?: () => void;
  onFinish: (value: boolean) => void;
  /** Preserve the root ensureSaved dialog's native retry and close behavior. */
  retryOnSaveFailure?: boolean;
}

/** Optional state shares one confirmation across concurrent requests. */
export function confirmWorkspaceNavigation(
  modal: ReturnType<typeof App.useApp>["modal"],
  options: WorkspaceConfirmationOptions,
  state?: WorkspaceConfirmationState,
): Promise<boolean> {
  if (state?.pending) return state.pending;
  const result = new Promise<boolean>((resolve) => {
    let finished = false;
    const finish = (value: boolean) => {
      if (finished) return;
      finished = true;
      options.onFinish(value);
      dialog.destroy();
      resolve(value);
    };
    const save = async () => {
      if (options.canSave && !options.canSave()) return;
      dialog.update({ footer: <Button loading>正在保存</Button> });
      let saved = false;
      try {
        saved = !!(await options.save());
      } catch {
        /* editor displays the failure */
      }
      finish(saved);
    };
    const dialog = modal.confirm({
      title: options.saveOnly ? "请先保存当前配置" : "当前修改尚未保存",
      content: options.content,
      ...(options.retryOnSaveFailure
        ? {
            okText: "保存并继续",
            cancelText: "继续编辑",
            onCancel: () => resolve(false),
            onOk: async () => {
              const saved = await options.save();
              if (!saved) throw new Error("配置未保存，请检查当前表单");
              options.onFinish(true);
              resolve(true);
            },
          }
        : {
            closable: false,
            mask: { closable: false },
            onCancel: () => finish(false),
            footer: () => (
              <Space wrap={options.wrap}>
                <Button onClick={() => finish(false)}>继续编辑</Button>
                {!options.saveOnly && (
                  <Button
                    danger
                    onClick={() => {
                      options.onDiscard?.();
                      finish(true);
                    }}
                  >
                    放弃修改
                  </Button>
                )}
                {options.showSave !== false && (
                  <Button type="primary" onClick={save}>
                    {options.saveOnly ? "保存并继续" : "保存并离开"}
                  </Button>
                )}
              </Space>
            ),
          }),
    });
  });
  if (!state) return result;
  state.pending = result.finally(() => {
    state.pending = undefined;
  });
  return state.pending;
}
