import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/TemplateSaveForm/index");
export default mod.default;
export type * from "../pages/TemplateSaveForm/index";
export { DEFAULT_TEMPLATE_SAVE_FORM_VALUES } from "../pages/TemplateSaveForm/index";
export {
  PREFAB_AGE_UNIT_OPTIONS,
  PREFAB_GENDER_OPTIONS,
  PREFAB_VISIT_TYPE_OPTIONS,
  PREFAB_SHARE_OPTIONS,
  encodePrefabTagList,
} from "../pages/TemplateSaveForm/enum";
