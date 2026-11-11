import {
  LoadFeedback as SharedLoadFeedback,
  SaveError as SharedSaveError,
  RefreshFeedback as SharedRefreshFeedback,
} from "@/components/Feedback";
import type { ComponentProps } from "react";

export const LoadFeedback = (props: ComponentProps<typeof SharedLoadFeedback>) => (
  <SharedLoadFeedback {...props} prefix="department-page" />
);

export const SaveError = (props: ComponentProps<typeof SharedSaveError>) => (
  <SharedSaveError {...props} prefix="department-page" />
);

export const RefreshFeedback = (props: ComponentProps<typeof SharedRefreshFeedback>) => (
  <SharedRefreshFeedback {...props} prefix="department-page" />
);
