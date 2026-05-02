import type { RequestEventBase } from '@builder.io/qwik-city';

type EnvGetter = RequestEventBase['env'];

type PlatformWithEnv = {
  env?: Record<string, unknown>;
};

export type BindingEvent = Pick<RequestEventBase, 'env' | 'platform'>;

export function getBinding<K extends Parameters<EnvGetter['get']>[0]>(
  event: BindingEvent,
  key: K
): ReturnType<EnvGetter['get']> | undefined {
  const platformEnv = (event.platform as PlatformWithEnv | undefined)?.env;
  return (platformEnv?.[key] ?? event.env.get(key)) as
    | ReturnType<EnvGetter['get']>
    | undefined;
}
