import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ConfigProvider, Form, Input, Modal } from "antd";
import { AdaptiveForm } from "../../src/form/AdaptiveForm";
import PropertyForm from "../../src/metric/components/PropertyForm";
import Parameters from "../../src/report/features/report-preview/components/Parameters";
import ParameterForm from "../../src/board/features/board-preview/components/ParameterForm";
import "../../src/report/features/report-preview/style.scss";
import "../../src/board/features/board-preview/style.scss";
import "../../src/metric/features/dataset-editor/style.scss";
import "./style.scss";

function Fixture() {
  const [hidden, setHidden] = useState(false);
  const [extra, setExtra] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const [values, setValues] = useState({});
  return (
    <ConfigProvider
      theme={{ token: { fontSize, fontFamily } }}
      button={{ autoInsertSpace: false }}
    >
      <Button onClick={() => setHidden(!hidden)}>切换最长字段</Button>
      <Button onClick={() => setExtra(!extra)}>切换动态字段</Button>
      <Button onClick={() => setFontSize(fontSize === 14 ? 20 : 14)}>
        切换字号
      </Button>
      <Button
        onClick={() =>
          setFontFamily(fontFamily === "Arial" ? "monospace" : "Arial")
        }
      >
        切换字体
      </Button>
      <Button onClick={() => setOpen(true)}>打开弹窗</Button>
      <output data-testid="submitted">{submitted}</output>
      <PropertyForm
        className="fixture-editor"
        onFinish={() => setSubmitted(submitted + 1)}
      >
        <div data-form-label-group data-testid="group-a" className="grid">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入名称" }]}
            tooltip="名称提示"
          >
            <Input aria-label="名称" />
          </Form.Item>
          <Form.Item label="编码">
            <Input />
          </Form.Item>
          <Form.Item label="当前分组最长的标签" hidden={hidden}>
            <Input />
          </Form.Item>
          {extra && (
            <Form.Item label="动态添加的更长字段标签">
              <Input />
            </Form.Item>
          )}
          <Form.Item className="wide" label="备注">
            <Input.TextArea />
          </Form.Item>
          <div data-form-label-group data-testid="nested" className="wide">
            <Form.Item label="独立">
              <Input />
            </Form.Item>
            <Form.Item label="编号">
              <Input />
            </Form.Item>
          </div>
        </div>
        <div data-form-label-group data-testid="group-b">
          <Form.Item label="状态">
            <Input />
          </Form.Item>
          <Form.Item label="编号">
            <Input />
          </Form.Item>
        </div>
        <Form.Item>
          <Button htmlType="submit">保存</Button>
        </Form.Item>
      </PropertyForm>
      <AdaptiveForm data-testid="content" className="content">
        <Form.Item label="名">
          <Input />
        </Form.Item>
        <Form.Item label="更长的参数名称">
          <Input />
        </Form.Item>
      </AdaptiveForm>
      <AdaptiveForm data-testid="marks">
        <Form.Item label="短">
          <Input />
        </Form.Item>
        <Form.Item label="短" required tooltip="提示">
          <Input />
        </Form.Item>
      </AdaptiveForm>
      <AdaptiveForm labelSizing="group" data-testid="font-family">
        <Form.Item label="MMMMMMMM">
          <Input />
        </Form.Item>
        <Form.Item label="I">
          <Input />
        </Form.Item>
      </AdaptiveForm>
      <AdaptiveForm component="div" labelSizing="group" data-testid="isolation">
        <Form.Item label="独立表单">
          <Input />
        </Form.Item>
        <Form
          component="div"
          labelCol={{ flex: "180px" }}
          data-testid="native-form"
        >
          <Form.Item label="嵌套表单的长标签不参与外部的分组宽度计算">
            <Input />
          </Form.Item>
        </Form>
      </AdaptiveForm>
      <AdaptiveForm
        labelSizing="group"
        data-testid="long"
        style={{ width: 260 }}
      >
        <Form.Item
          label="这是一段非常长的标签文字需要完整换行显示EnglishWithoutSpaces"
          required
          tooltip="提示"
        >
          <Input />
        </Form.Item>
        <Form.Item label="短">
          <Input />
        </Form.Item>
      </AdaptiveForm>
      <div data-testid="report">
        <Parameters
          args={[
            { arg_code: "short", arg_name: "名称", arg_type: "STR" },
            { arg_code: "long", arg_name: "报表参数名称", arg_type: "STR" },
          ]}
          values={values}
          onChange={setValues}
          onSearch={() => setSubmitted(submitted + 1)}
          disabled={false}
          loading={false}
        />
      </div>
      <div data-testid="board">
        <ParameterForm
          rows={[
            { arg_code: "short", arg_name: "名称", arg_type: "STR" },
            { arg_code: "long", arg_name: "看板参数名称", arg_type: "STR" },
          ]}
          applied={[]}
          onApply={() => setSubmitted(submitted + 1)}
          queue={{ run: async (_signal, task) => task() } as any}
        />
      </div>
      <div className="de-embedded-editor" data-testid="embedded">
        <PropertyForm>
          <div className="mw-form-grid" data-form-label-group>
            <Form.Item label="数据集名称" required>
              <Input />
            </Form.Item>
            <Form.Item label="目录">
              <Input />
            </Form.Item>
          </div>
        </PropertyForm>
      </div>
      <Modal
        open={open}
        destroyOnHidden
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
        title="布局弹窗"
      >
        <AdaptiveForm labelSizing="group">
          <Form.Item label="名称">
            <Input />
          </Form.Item>
          <Form.Item label="弹窗最长标签" required>
            <Input />
          </Form.Item>
        </AdaptiveForm>
      </Modal>
    </ConfigProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
