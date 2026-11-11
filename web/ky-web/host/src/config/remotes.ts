import type { RemoteAppConfig } from '@/config/remoteApps';
import { resolveEntryUrl } from '@/config/resolveEntryUrl';

export interface RemoteConfig {
  name: string;
  entry: string;
  entryGlobalName: string;
  type: 'module';
  shareScope: 'default';
}

const MF_DEFAULTS = { type: 'module' as const, shareScope: 'default' as const };

const _dynamicConfigs = new Map<string, Omit<RemoteConfig, 'type' | 'shareScope'>>();

/** 固定远程：不依赖后端接口动态下发，初始化时即可加载（登录页） */
const _staticConfigs = new Map<string, Omit<RemoteConfig, 'type' | 'shareScope'>>();

const LOGIN_ENTRY = import.meta.env.VITE_LOGIN_ENTRY ?? '';
if (LOGIN_ENTRY) {
  _staticConfigs.set('login', {
    name: 'login',
    entry: resolveEntryUrl(LOGIN_ENTRY),
    entryGlobalName: 'login',
  });
}

export const buildRemoteConfigs = (apps: RemoteAppConfig[]): void => {
  _dynamicConfigs.clear();
  for (const app of apps) {
    _dynamicConfigs.set(app.name, {
      name: app.name,
      entry: resolveEntryUrl(app.entry),
      entryGlobalName: app.name,
    });
  }
};

export const getRemoteConfig = (remoteName: string): RemoteConfig | undefined => {
  const cfg = _dynamicConfigs.get(remoteName) ?? _staticConfigs.get(remoteName);
  return cfg ? { ...cfg, ...MF_DEFAULTS } : undefined;
};

export const getRemoteNameFromModuleId = (moduleId: string): string => {
  if (!moduleId) throw new Error('moduleId must not be empty');
  const slashIndex = moduleId.indexOf('/');
  return slashIndex === -1 ? moduleId : moduleId.slice(0, slashIndex);
};