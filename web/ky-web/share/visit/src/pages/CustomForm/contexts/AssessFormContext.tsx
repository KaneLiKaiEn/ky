import { createContext, useContext } from "react";

export interface AssessFormContextValue {
  isAssessForm: boolean;
  assessTotal?: number;
  reportElemScore: (scoreKey: string, score: number) => void;
  removeElemScore: (scoreKey: string) => void;
}

export const AssessFormContext = createContext<AssessFormContextValue | null>(
  null,
);

export const useAssessForm = () => useContext(AssessFormContext);
