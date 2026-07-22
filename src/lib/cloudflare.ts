import type { RouterContextProvider } from "react-router";
import { cloudflareContext } from "~/lib/context";

export function getOptionalBinding<K extends keyof Env>(
  context: Readonly<RouterContextProvider>,
  key: K,
): Env[K] {
  return context.get(cloudflareContext).env[key];
}

export function getBinding<K extends keyof Env>(
  context: Readonly<RouterContextProvider>,
  key: K,
): Required<Env>[K] {
  const binding = getOptionalBinding(context, key);
  if (binding === undefined) {
    throw new Error(`Missing Cloudflare binding: ${key}`);
  }
  return binding as Required<Env>[K];
}
