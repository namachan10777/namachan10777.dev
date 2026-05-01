type EnvGetter = {
  get(key: string): unknown;
};

type PlatformWithEnv = {
  env?: Record<string, unknown>;
};

export type BindingEvent = {
  env: EnvGetter;
  platform?: unknown;
};

export function getBinding<T>(event: BindingEvent, key: string): T | undefined {
  const platformEnv = (event.platform as PlatformWithEnv | undefined)?.env;
  return (platformEnv?.[key] ?? event.env.get(key)) as T | undefined;
}
