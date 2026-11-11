import type { VisitStatusRow } from "@/types/visit";

export type InsuranceTagInfo = {
  color: string;
  text: string;
};

/** 按医保类型 / 结算身份生成展示 Tag */
export const getInsuranceTagInfo = (
  data?: VisitStatusRow | null,
): InsuranceTagInfo | null => {
  if (!data) return null;

  const insuranceType = data.insurance_type;
  const settleTag = data.settle_tag ? `【${data.settle_note ?? ""}】` : "";

  // 代表自费
  if (Number(insuranceType) === 0) {
    return {
      color: "blue",
      text: `自费${settleTag}`,
    };
  }

  // 代表是医保，但是身份是自费
  if (Number(data.settle_type) === 0) {
    return {
      color: "purple",
      text: "【自费】",
    };
  }

  // 代表是医保
  const text = `${data.service_name ?? ""}${
    data.service_note ? `（${data.service_note}）` : ""
  }`;
  if (!text) return null;

  return {
    color: "cyan",
    text,
  };
};
