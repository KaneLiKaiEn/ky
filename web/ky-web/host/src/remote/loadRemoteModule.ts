import type { ComponentType } from "react";
import { loadRemote, registerRemotes } from "@module-federation/runtime";
import { getRemoteConfig, getRemoteNameFromModuleId } from "@/config/remotes";
import { trackRemoteVersion } from "@/utils/versionCheck";
type RemoteModuleExport<TProps extends object> =
  | ComponentType<TProps>
  | { default: ComponentType<TProps> };

const registeredRemotes = new Set<string>();

const ensureRemoteRegistered = (moduleId: string): void => {
  const remoteName = getRemoteNameFromModuleId(moduleId);
  const remoteConfig = getRemoteConfig(remoteName);

  if (!remoteConfig) {
    throw new Error(`Unknown remote "${remoteName}" for module "${moduleId}"`);
  }

  if (registeredRemotes.has(remoteName)) {
    return;
  }

  registerRemotes([remoteConfig]);
  registeredRemotes.add(remoteName);
  void trackRemoteVersion(remoteConfig.entry);
};

export const loadRemoteModule = async <TProps extends object = object>(
  moduleId: string,
): Promise<{ default: ComponentType<TProps> }> => {
  ensureRemoteRegistered(moduleId);

  const remoteModule = await loadRemote<RemoteModuleExport<TProps>>(moduleId);

  if (typeof remoteModule === "function") {
    return { default: remoteModule };
  }

  const component = remoteModule?.default;

  if (!component) {
    throw new Error(`Remote module "${moduleId}" has no default export`);
  }

  return { default: component };
};
