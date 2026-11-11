import { AdaptiveForm } from "../../../../form/AdaptiveForm";
import {
  getDatasetTrans,
  getSubsetTrans,
  saveDatasetTrans,
  saveSubsetTrans,
} from "../../../api/dataset";
import type { EditorContext } from "../types";
import { decodeTags, encodeTags } from "comm/utils";
import type {
  DatasetTransRow,
  SubsetTransRow,
} from "../../../types/dataset.d.ts";
import { Form, Input, Select } from "antd";

import { formLayout } from "../../../styles/formLayout";
import Editor from "../../../components/ManagementEditor/index";
import { useManagementEditor } from "comm/management";

export default function TransPanel({
  context,
  subsetId,
}: {
  context: EditorContext;
  subsetId?: number;
}) {
  const editor = useManagementEditor<DatasetTransRow & SubsetTransRow>(
    {
      identity: `trans:${context.identity}:${subsetId || "dataset"}`,
      isCurrent: context.isCurrent,
      guard: context.guard,
    },
    async () =>
      subsetId
        ? ((await getSubsetTrans({ subset_id: subsetId, column_list: "*" }))
            .trans_property ?? { subset_id: subsetId })
        : ((
            await getDatasetTrans({
              dataset_id: context.dataset.dataset_id,
              column_list: "*",
            })
          ).trans_property ?? { dataset_id: context.dataset.dataset_id }),
    async (value) => {
      if (subsetId)
        await saveSubsetTrans({ subset_id: subsetId, trans_property: value });
      else
        await saveDatasetTrans({
          dataset_id: context.dataset.dataset_id,
          trans_property: value,
        });
    },
  );

  const change = (field: string, value: string) =>
    editor.setValue((row) => ({ ...row, [field]: value }));
  return (
    <Editor
      title="转换脚本"
      {...editor}
      retry={() => void editor.reload().catch(() => {})}
    >
      <AdaptiveForm labelSizing="group" {...formLayout}>
        <div className="mw-form-grid" data-form-label-group>
          <Form.Item className="mw-form-wide" label="标签">
            <Select
              mode="tags"
              value={decodeTags(editor.value?.trans_tag)}
              onChange={(tags) => change("trans_tag", encodeTags(tags))}
            />
          </Form.Item>
          <Form.Item className="mw-form-wide" label="备注">
            <Input.TextArea
              rows={4}
              value={editor.value?.trans_note}
              onChange={(event) => change("trans_note", event.target.value)}
            />
          </Form.Item>
          <Form.Item className="mw-form-wide" label="脚本">
            <Input.TextArea
              className="de-code"
              rows={20}
              value={editor.value?.trans_script}
              onChange={(event) => change("trans_script", event.target.value)}
            />
          </Form.Item>
        </div>
      </AdaptiveForm>
    </Editor>
  );
}
