import type { FormProperty } from "../components/Form/types";

export const getFormDefinitionKey = (formProp: FormProperty): string =>
  JSON.stringify([formProp.form_id, formProp.form_version ?? null]);

export const getFormSessionKey = (formProp: FormProperty): string =>
  JSON.stringify([
    formProp.form_id,
    formProp.form_version ?? null,
    formProp.visit_id,
    formProp.baby_id ?? null,
    formProp.emr_id ?? null,
  ]);

/** Assigning the first saved EMR ID keeps the current draft's values and scores. */
export const isDraftEmrBinding = (
  previous: FormProperty,
  next: FormProperty,
): boolean =>
  previous.emr_id == null &&
  next.emr_id != null &&
  getFormSessionKey({ ...previous, emr_id: undefined }) ===
    getFormSessionKey({ ...next, emr_id: undefined });
