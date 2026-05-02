import type { RequestEventBase } from "@qwik.dev/router/middleware/request-handler";

type PlatformWithEnv = {
  env?: Record<string, unknown>;
};

export type BindingEvent = Pick<RequestEventBase<PlatformWithEnv>, "env"> &
  Partial<Pick<RequestEventBase<PlatformWithEnv>, "platform">>;

export function getBinding<T>(event: BindingEvent, key: string): T | undefined {
  return (event.platform?.env?.[key] ?? event.env.get(key)) as T | undefined;
}
