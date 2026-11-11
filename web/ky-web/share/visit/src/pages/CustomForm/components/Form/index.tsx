import { forwardRef, useEffect, useRef, type ForwardedRef } from "react";
import { Alert, Empty, Flex, Spin } from "antd";
import { FormEventExtraForm } from "../ExtraFormModal";
import { AssessFormContext } from "../../contexts/AssessFormContext";
import { FormEventProvider } from "../../contexts/FormEventContext";
import { useFormDefinition } from "../../hooks/useFormDefinition";
import { useAssessment } from "../../hooks/useAssessment";
import { useFormHandle } from "../../hooks/useFormHandle";
import type { SectionRef } from "../Section/types";
import type { FormProps, FormRef } from "./types";
import AssessSummary from "./AssessSummary";
import SectionRenderer from "./SectionRenderer";

type FormDefinition = ReturnType<typeof useFormDefinition>;

const FormBody = ({
  definition, forwardedRef, formProp, formValues, recordTime, initialAssess, onFormValueChanged,
}: Omit<FormProps, "onReady"> & { definition: FormDefinition; forwardedRef: ForwardedRef<FormRef> }) => {
  const sectionRefs = useRef<Map<string, SectionRef>>(new Map());
  const { contextValue, assessment, error } = useAssessment({
    formProp, docInfo: definition.docInfo, formReady: definition.ready, initialAssess,
  });
  useFormHandle(forwardedRef, sectionRefs, formProp, assessment);
  const assessmentError = definition.assessmentError ?? error;
  return (
    <AssessFormContext.Provider value={contextValue}>
      <Spin spinning={definition.loading} description="加载表单...">
        {contextValue.isAssessForm ? <AssessSummary assessment={assessment} /> : null}
        {definition.eligibilityWarning ? <Alert className="mx-2 mb-3" type="warning" title={definition.eligibilityWarning} /> : null}
        {assessmentError ? <Alert className="mx-2 mb-3" type="warning" title={assessmentError} /> : null}
        {definition.error ? <Alert className="mx-2" type="error" title={definition.error} /> :
          definition.sectionList.length === 0 && !definition.loading ? <Empty description="暂无表单区块" /> : (
            <Flex vertical gap={16}>
              <SectionRenderer
                sectionList={definition.sectionList}
                sectionRefs={sectionRefs}
                formProp={formProp}
                formValues={formValues}
                recordTime={recordTime}
                onFormValueChanged={onFormValueChanged}
              />
            </Flex>
          )}
      </Spin>
      <FormEventExtraForm />
    </AssessFormContext.Provider>
  );
};

const Form = forwardRef<FormRef, FormProps>((props, ref) => {
  const definition = useFormDefinition(props.formProp);
  const onReadyRef = useRef(props.onReady);
  onReadyRef.current = props.onReady;
  const notifiedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!definition.ready || notifiedKeyRef.current === definition.loadKey) return;
    notifiedKeyRef.current = definition.loadKey;
    onReadyRef.current?.();
  }, [definition.loadKey, definition.ready]);

  return (
    <FormEventProvider {...props.formProp} formReady={definition.ready}>
      <FormBody {...props} definition={definition} forwardedRef={ref} />
    </FormEventProvider>
  );
});

export default Form;
