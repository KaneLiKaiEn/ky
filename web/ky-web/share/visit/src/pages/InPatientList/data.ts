import type { VisitItemRow } from "../VisitItem";

/** 住院患者列表测试数据 */
export const mockInPatientList: VisitItemRow[] = [
  {
    visit_id: 10001,
    patient_id: 10001,
    bed_no: "01床",
    patient_name: "张三",
    patient_no: "ZY20260001",
    patient_gender: "男",
    patient_age: 56,
    hospital_days: 12,
    diag_list: ["2型糖尿病", "高血压病3级（极高危）"],
    tag_list: [
      {
        label: "危重",
      },
      {
        label: "糖尿病",
      },
    ],
  },
  {
    visit_id: 10002,
    patient_id: 10002,
    bed_no: "02床",
    patient_name: "李四",
    patient_no: "ZY20260002",
    patient_gender: "男",
    patient_age: 68,
    hospital_days: 5,
    diag_list: ["社区获得性肺炎", "慢性阻塞性肺疾病"],
    tag_list: [
      {
        label: "呼吸科",
      },
      {
        label: "吸氧",
      },
    ],
  },
  {
    visit_id: 10003,
    patient_id: 10003,
    bed_no: "03床",
    patient_name: "王五",
    patient_no: "ZY20260003",
    patient_gender: "女",
    patient_age: 34,
    hospital_days: 3,
    diag_list: ["急性阑尾炎术后"],
    tag_list: [
      {
        label: "术后",
      },
      {
        label: "禁食",
      },
    ],
  },
  {
    visit_id: 10004,
    patient_id: 10004,
    bed_no: "05床",
    patient_name: "赵六",
    patient_no: "ZY20260004",
    patient_gender: "男",
    patient_age: 72,
    hospital_days: 18,
    diag_list: ["脑梗死", "心房颤动", "高脂血症"],
    tag_list: [
      {
        label: "神经内科",
      },
      {
        label: "抗凝",
      },
    ],
  },
  {
    visit_id: 10005,
    patient_id: 10005,
    bed_no: "08床",
    patient_name: "钱七",
    patient_no: "ZY20260005",
    patient_gender: "女",
    patient_age: 61,
    hospital_days: 27,
    diag_list: ["慢性肾功能不全", "贫血"],
    tag_list: [
      {
        label: "透析",
      },
      {
        label: "重点关注",
      },
    ],
  },
  {
    visit_id: 10006,
    patient_id: 10006,
    bed_no: "12床",
    patient_name: "孙八",
    patient_no: "ZY20260006",
    patient_gender: "男",
    patient_age: 45,
    hospital_days: 1,
    diag_list: [],
    tag_list: [
      {
        label: "新入院",
      },
    ],
  },
];
