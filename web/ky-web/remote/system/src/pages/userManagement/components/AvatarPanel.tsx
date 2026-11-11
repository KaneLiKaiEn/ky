import { getSessionId } from "comm/session";
import { useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Image as AntImage,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getUserPhoto, saveUserPhoto } from "@/api/user";
import type { EditorProps } from "../types";
import { useEditor } from "@/hooks/useEditor";
import { useResource } from "@/hooks/useResource";
import { assertResult } from "@/utils/result";
import { photoBase64, photoFormat, PHOTO_LIMIT } from "../dto";
import { LoadFeedback, SaveError, RefreshFeedback } from "@/components/Feedback";

interface Photo {
  format: string;
  content: string;
}

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败，请重新选择"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function validateImage(src: string) {
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) resolve();
      else reject(new Error("图片内容无效"));
    };
    image.onerror = () => reject(new Error("图片无法解码，请选择有效图片"));
    image.src = src;
  });
}

export default function AvatarPanel(props: EditorProps) {
  const { user } = props;
  const { message, modal } = App.useApp();
  const editor = useEditor(props);
  const [committed, setCommitted] = useState<Photo>();
  const [pending, setPending] = useState<Photo>();
  const resource = useResource(`photo:${user.user_id}`, async () => {
    const res = assertResult(await getUserPhoto({ user_id: user.user_id }));
    const content = photoBase64(res.photo_content);
    const format = (res.photo_format || "png")
      .toLowerCase()
      .replace(/^image\//, "");
    if (content && !["jpg", "jpeg", "png", "gif", "webp"].includes(format))
      throw new Error("头像格式不受支持");
    return { format, content };
  });
  useEffect(() => {
    if (resource.data) setCommitted(resource.data);
  }, [resource.data]);
  const resourceBlocked = resource.loading || Boolean(resource.error);
  if (!resource.data)
    return <LoadFeedback prefix="user-page" {...resource} retry={resource.reload} />;
  const photo = pending ?? committed ?? resource.data;
  const src = photo.content
    ? `data:image/${photo.format === "jpg" ? "jpeg" : photo.format};base64,${photo.content}`
    : undefined;
  const select = (file: File) =>
    editor.run(async () => {
      const requestSessionId = getSessionId();
      if (props.disabled || resourceBlocked) return;
      const format = photoFormat(file.name, file.type);
      if (!format) throw new Error("请选择 JPG、PNG、GIF 或 WebP 图片");
      if (!file.size || file.size > PHOTO_LIMIT)
        throw new Error("请选择大小在 20MB 以内的非空图片");
      const dataUrl = await readPhoto(file);
      await validateImage(dataUrl);
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      setPending({ format, content: dataUrl.slice(dataUrl.indexOf(",") + 1) });
      editor.dirty(true);
    });
  const save = () =>
    editor.run(async () => {
      const requestSessionId = getSessionId();
      if (props.disabled || resourceBlocked) return;
      if (!pending) return;
      assertResult(
        await saveUserPhoto({
          user_id: user.user_id,
          photo_format: pending.format,
          photo_content: pending.content,
        }),
      );
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      setCommitted(pending);
      setPending(undefined);
      editor.dirty(false);
      message.success("头像已保存");
    });
  const clear = () =>
    editor.run(async () => {
      const requestSessionId = getSessionId();
      if (props.disabled || resourceBlocked) return;
      if (
        !(await modal.confirm({
          title: "清除当前头像？",
          content: "确认后将恢复默认头像，尚未保存的图片也会被丢弃。",
          okText: "清除头像",
          cancelText: "取消",
          okButtonProps: { danger: true },
        }))
      )
        return;
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      assertResult(
        await saveUserPhoto({
          user_id: user.user_id,
          photo_format: "",
          photo_content: "",
        }),
      );
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      setCommitted({ format: "", content: "" });
      setPending(undefined);
      editor.dirty(false);
      message.success("头像已清除");
    });
  return (
    <div className="user-panel">
      <RefreshFeedback prefix="user-page" {...resource} retry={resource.reload} />
      <SaveError prefix="user-page" error={editor.error} />
      <div className="user-panel__intro">
        <Typography.Title level={5}>用户头像</Typography.Title>
        <Typography.Text type="secondary">
          支持 JPG、PNG、GIF、WebP，最大 20MB。选择后可预览，保存后生效。
        </Typography.Text>
      </div>
      <div className="user-avatar-editor">
        <div className="user-avatar-editor__preview">
          {src ? (
            <AntImage
              width={160}
              height={160}
              style={{ objectFit: "contain" }}
              src={src}
              alt={`${user.user_name ?? "用户"}的头像`}
            />
          ) : (
            <Avatar
              size={160}
              shape="square"
              icon={<UserOutlined aria-hidden />}
            />
          )}
        </div>
        <div>
          <Typography.Paragraph>
            {user.user_name} {pending && <Tag color="processing">待保存</Tag>}
          </Typography.Paragraph>
          <Space wrap>
            <Upload
              accept=".jpg,.jpeg,.png,.gif,.webp"
              showUploadList={false}
              disabled={props.disabled || resourceBlocked || editor.saving}
              beforeUpload={(file) => {
                void select(file);
                return Upload.LIST_IGNORE;
              }}
            >
              <Button disabled={props.disabled || resourceBlocked || editor.saving}>
                选择图片
              </Button>
            </Upload>
            <Button
              type="primary"
              loading={editor.saving}
              disabled={props.disabled || resourceBlocked || !pending}
              onClick={save}
            >
              保存头像
            </Button>
            <Button
              danger
              disabled={props.disabled || resourceBlocked || editor.saving || !photo.content}
              onClick={clear}
            >
              清除头像
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
