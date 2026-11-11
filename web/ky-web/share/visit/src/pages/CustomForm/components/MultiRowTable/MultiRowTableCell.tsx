import type { FC } from "react";
import { Space } from "antd";
import DataElemControl from "../DataElem/Control";
import { PiecePickerAddon } from "../DataElem/PiecePicker";
import { useFieldController } from "../../hooks/useFieldController";
import type { ElemProp, FormContext } from "../DataElem/types";
import type { CellValue, TableRow } from "../../model/multiRowModel";

const MultiRowTableCell: FC<{
  elem: ElemProp;
  section_id: number;
  formContext?: FormContext;
  record: TableRow;
  cellValue: CellValue;
  onChange: (next: CellValue) => void;
  onScoreChange: (score: number | null) => void;
}> = ({ elem, section_id, formContext, record, cellValue, onChange, onScoreChange }) => {
  const { behavior, renderHtml, handleControlChange } = useFieldController({
    elemProp: { ...elem, section_id, row_no: record.id },
    value: cellValue,
    onChange: (next) => onChange(next),
    getScore: () => cellValue.value_score ?? 0,
  });

  return (
    <div data-section-item-elem-id={elem.elem_id}>
      {behavior.isEventTriggerResultRender ? (
        <div className="min-h-8 px-2" dangerouslySetInnerHTML={{ __html: renderHtml }} />
      ) : null}
      <div className={behavior.isEventTriggerResultRender ? "hidden" : undefined}>
        <Space.Compact block>
          <DataElemControl
            elemProp={elem}
            assessScoreKey={`${section_id}-${elem.elem_id}-${record.id}`}
            value={cellValue}
            onChange={handleControlChange}
            onScoreChange={onScoreChange}
          />
          {behavior.isPiece ? (
            <Space.Addon>
              <PiecePickerAddon
                elem_id={elem.elem_id}
                elem_name={elem.elem_name}
                context={formContext}
                currentValue={cellValue.value_text ?? ""}
                disabled={behavior.isReadOnly}
                onSelect={(content) => handleControlChange({ ...cellValue, value_text: content })}
              />
            </Space.Addon>
          ) : null}
          {elem.elem_unit ? <Space.Addon>{elem.elem_unit}</Space.Addon> : null}
        </Space.Compact>
      </div>
    </div>
  );
};

export default MultiRowTableCell;
