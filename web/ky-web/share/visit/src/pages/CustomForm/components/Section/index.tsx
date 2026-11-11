import { forwardRef, useImperativeHandle, useMemo, type MouseEvent } from "react";
import { Alert, Col, Row, Spin } from "antd";
import DataElem from "../DataElem";
import MultiRowTable from "../MultiRowTable";
import { getSectionDomId } from "../../utils/elemTags";
import { getElemKey } from "../../model/sectionDefinition";
import { getColProps, parseColumnWidth } from "../../model/sectionLayout";
import { useSectionDefinition } from "../../hooks/useSectionDefinition";
import { useSectionController } from "../../hooks/useSectionController";
import SectionFrame from "./SectionFrame";
import type { SectionProps, SectionRef } from "./types";

const Section = forwardRef<SectionRef, SectionProps>(
  ({ sectionProp, sectionValues, onSectionValueChanged }, ref) => {
    const { form_id, section_id, section_version, section_tag, section_init, column_width, visit_id, baby_id, emr_id } = sectionProp;
    const isMultiRow = section_tag?.includes("[多行]") ?? false;
    const canReinit = section_tag?.includes("[重新初始化]") ?? false;
    const { loading, elemList, error } = useSectionDefinition(sectionProp);
    const contextKey = JSON.stringify([form_id, section_id, section_version, visit_id, baby_id, emr_id]);
    const { elemRefs, multiRowTableRef, controller, queueSectionInit } = useSectionController({
      contextKey,
      loading,
      elemList,
      isMultiRow,
    });
    const columnSpans = useMemo(() => parseColumnWidth(column_width), [column_width]);
    const formContext = useMemo(() => ({ form_id, visit_id, baby_id, emr_id }), [form_id, visit_id, baby_id, emr_id]);

    useImperativeHandle(ref, () => controller, [controller]);

    const handleReinit = (event: MouseEvent) => {
      event.stopPropagation();
      queueSectionInit({ visit_id: visit_id ?? 0, baby_id }, { force: true });
    };

    const content = isMultiRow ? (
      <MultiRowTable
        ref={multiRowTableRef}
        section_id={section_id}
        formContext={formContext}
        elemList={elemList}
        sectionValues={sectionValues}
        sectionInit={section_init}
        onSectionValueChanged={onSectionValueChanged}
      />
    ) : (
      <Row gutter={[16, 8]}>
        {elemList.map((elemProp, index) => {
          const elemKey = getElemKey(elemProp, index);
          return (
            <Col key={elemKey} {...getColProps(index, columnSpans, elemProp.elem_width)}>
              <DataElem
                ref={(instance) => {
                  if (instance) elemRefs.current.set(elemKey, instance);
                  else elemRefs.current.delete(elemKey);
                }}
                elemProp={elemProp}
                formContext={formContext}
                elemValue={sectionValues?.find((value) => value.elem_id === elemProp.elem_id)}
                onElemValueChanged={onSectionValueChanged}
              />
            </Col>
          );
        })}
      </Row>
    );

    return (
      <div data-section-id={getSectionDomId(section_id)}>
        <Spin spinning={loading}>
          <SectionFrame title={sectionProp.section_title} compact={isMultiRow} onReinit={canReinit ? handleReinit : undefined}>
            {error ? <Alert type="error" title={error} showIcon /> : content}
          </SectionFrame>
        </Spin>
      </div>
    );
  },
);

export default Section;
