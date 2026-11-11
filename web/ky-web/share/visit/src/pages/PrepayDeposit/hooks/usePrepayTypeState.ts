import { useState } from "react";
import type { PrepayType } from "@/types/account";

/**
 * prepay_type 有值：锁定类型，不展示 Radio；
 * 无值：默认门诊(O)，可切换。
 */
export function usePrepayTypeState(prepay_type?: PrepayType) {
  const locked = prepay_type != null;
  const [localType, setLocalType] = useState<PrepayType>(prepay_type ?? "O");

  const prepayType = locked ? prepay_type : localType;

  return {
    prepayType,
    setPrepayType: setLocalType,
    showTypeSelector: !locked,
  };
}
