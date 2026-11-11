import React from "react";
import MainContent from "./MainContent";
import type { DeptRow } from "@/types/linkBill";

export interface LinkBillProps {
  visit_id?: string;
  link_value?: string;
  link_name?: string;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  baby_id?: string | number;
  /** 申请科室列表（由调用方组装后传入） */
  deptList?: DeptRow[];
  /** 执行科室列表（由调用方组装后传入） */
  deptExecList?: DeptRow[];
  /** 医师列表（由调用方组装后传入） */
  doctorList?: any[];
  /** 选中的计费项目列表变化时回调（供调用方生成处方单时过滤） */
  onBillIdListChange?: (list: any[]) => void;
  /** 退药成功后回调（供调用方刷新处方单/退药单列表） */
  onWithdrawSuccess?: () => void;
}


const LinkBill: React.FC<LinkBillProps> = ({
  visit_id,
  link_value,
  link_name,
  link_data,
  link_tag,
  link_ext,
  baby_id,
  deptList,
  deptExecList,
  doctorList,
  onBillIdListChange,
  onWithdrawSuccess,
}) => {
  return (
    <MainContent
      visit_id={visit_id}
      link_value={link_value}
      link_name={link_name}
      link_data={link_data}
      link_tag={link_tag}
      link_ext={link_ext}
      baby_id={baby_id} 
      deptList={deptList}
      deptExecList={deptExecList}
      doctorList={doctorList}
      onBillIdListChange={onBillIdListChange}
      onWithdrawSuccess={onWithdrawSuccess}
    />
  );
};

export default LinkBill;
