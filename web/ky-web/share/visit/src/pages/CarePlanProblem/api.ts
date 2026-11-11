import { request } from "comm/request";

export const getSessionInfoAPI = (params: any) => {
  return request.post<any>("auth/GetSessionInfo", params);
};

export const newPlan = (params: {
  visit_id: number;
  user_id: number;
  user_name: string;
  plan_time: string;
  plan_name: string;
  link_value: string | number;
  action_list?: {
    action_id?: number;
    item_id?: number;
    action_content: string;
  }[];
  goal_list?: { item_id: number; item_name: string }[];
}) => {
  return request.post<any>("care/plan/NewPlan", params);
};

export const savePlanProperty = (params: any) => {
  return request.post<any>("care/plan/SavePlanProperty", params);
};

export const deletePlan = (params: any) => {
  return request.post<any>("care/plan/DeletePlan", params);
};

export const savePlanActionList = (params: any) => {
  return request.post<any>("care/plan/SavePlanActionList", params);
};

export const savePlanGoalList = (params: any) => {
  return request.post<any>("care/plan/SavePlanGoalList", params);
};

export const getProblemItemList = (params: any) => {
  return request.post<any>("care/problem/GetProblemItemList", params);
};

export const newProblemItem = (params: any) => {
  return request.post<any>("care/problem/NewProblemItem", params);
};

export const saveProblemItemActionList = (params: any) => {
  return request.post<any>("care/problem/SaveProblemItemActionList", params);
};

export const saveProblemItemGoalList = (params: any) => {
  return request.post<any>("care/problem/SaveProblemItemGoalList", params);
};

export const getProblemItemProperty = (params: any) => {
  return request.post<any>("care/problem/GetProblemItemProperty", params);
};

export const saveProblemItemProperty = (params: any) => {
  return request.post<any>("care/problem/SaveProblemItemProperty", params);
};

export const deleteProblemItem = (params: any) => {
  return request.post<any>("care/problem/DeleteProblemItem", params);
};
