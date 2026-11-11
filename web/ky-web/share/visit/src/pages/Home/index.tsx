import { useEffect, useMemo, useRef } from "react";
import { Button, Space } from "antd";
import CustomForm from "@/pages/CustomForm";
import type { FormRef } from "@/pages/CustomForm/components/Form/types";

const Home: React.FC = () => {
  const formRef = useRef<FormRef>(null);
  const handleChange = (section_id: number, elem_id: number) => {
    console.log("changed:", section_id, elem_id);
  };

  const handleInitFormValues = () => {
    formRef.current?.initFormValue({
      link_name: "",
      link_value: 0,
      link_data: "",
      link_tag: "",
      link_ext: "",
    });
  };

  const handleGetFormValues = () => {
    const formValues = formRef.current?.getFormValues();
    console.log(formValues);
  };

  const handleGetFormAssess = () => {
    const formAssess = formRef.current?.getFormAssess();
    console.log(formAssess);
  };

  const formValues = useMemo(() => {
    return [
      // {
      //   section_id: 600035,
      //   elem_id: 60012,
      //   value_text: "2025-01-01",
      // },
      // {
      //   section_id: 300003,
      //   elem_id: 210004,
      //   row_no: 1,
      //   value_text: "222",
      // },
    ];
  }, []);

  return (
    <>
      <Space className="mx-4">
        <Button onClick={handleInitFormValues}>初始化</Button>
        <Button onClick={handleGetFormValues}>获取表单值</Button>
        <Button onClick={handleGetFormAssess}>获取表单评估</Button>
      </Space>
      <CustomForm
        ref={formRef}
        formProp={{
          form_id: 90004,
          visit_id: 20240000316,
          baby_id: 0,
        }}
        formValues={formValues}
        onFormValueChanged={handleChange}
      />
    </>
  );
};

export default Home;
