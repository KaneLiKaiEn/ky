export const DICT_PATIENT_TYPE = "patient.type";
export const DICT_TIME_TYPE = "emr.time_rule.time.type";
export const DICT_TIME_UNIT = "emr.time_rule.time.unit";

export const ALERT_FIELDS = [
  { name: "alert_user", label: "提醒用户" },
  { name: "alert_leader", label: "提醒组长" },
  { name: "alert_director", label: "提醒主任" },
  { name: "alert_manager", label: "提醒管理者" },
  { name: "alert_president", label: "提醒院长" },
] as const;
