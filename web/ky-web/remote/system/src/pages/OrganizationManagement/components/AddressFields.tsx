import { Col, Form, Input, Row } from "antd";
import {
  AddressRegion,
  CountrySelect,
  useAddressEditorFields,
} from "./AddressControls";
import type { AddressPrefix } from "./address";

export interface AddressFieldsProps {
  prefix: AddressPrefix;
  disabled?: boolean;
}

const AddressFields = ({ prefix, disabled }: AddressFieldsProps) => {
  const { field, isChina, handleCountryChange, handleAreaSelect } =
    useAddressEditorFields(prefix);
  return (
    <Row gutter={[16, 0]}>
      <Col xs={24} md={12} xl={8}>
        <Form.Item
          name={field("_nation")}
          label="国家 / 地区"
          initialValue="中国"
        >
          <CountrySelect disabled={disabled} onChange={handleCountryChange} />
        </Form.Item>
      </Col>
      {isChina ? (
        <Col xs={24} md={12} xl={8}>
          <Form.Item name={field("")} label="省 / 市 / 区县">
            <AddressRegion disabled={disabled} onSelect={handleAreaSelect} />
          </Form.Item>
        </Col>
      ) : (
        <Form.Item name={field("")} hidden>
          <Input />
        </Form.Item>
      )}
      {isChina ? (
        <Col xs={24} md={12} xl={8}>
          <Form.Item name={field("_post")} label="邮政编码">
            <Input disabled={disabled} maxLength={12} />
          </Form.Item>
        </Col>
      ) : (
        <Form.Item name={field("_post")} hidden>
          <Input />
        </Form.Item>
      )}
      <Col span={24}>
        <Form.Item name={field("_detail")} label="详细地址">
          <Input.TextArea
            rows={2}
            disabled={disabled}
            placeholder="道路、门牌号、小区、楼栋号、单元等"
          />
        </Form.Item>
      </Col>
      {["_state", "_city", "_county", "_district", "_long", "_lat", "_map"].map(
        (suffix) => (
          <Form.Item key={suffix} name={field(suffix)} hidden>
            <Input />
          </Form.Item>
        ),
      )}
    </Row>
  );
};

export default AddressFields;
