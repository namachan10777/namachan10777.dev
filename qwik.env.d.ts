// This file can be used to add references for global types like `vite/client`.

// Add global `vite/client` types. For more info, see: https://vitejs.dev/guide/features#client-types
/// <reference types="vite/client" />
import "@builder.io/qwik-city/middleware/request-handler"; // これ重要：元型を読む

declare module "@builder.io/qwik-city/middleware/request-handler" {
  // Qwik 1.x の RequestEventCommon が持つ env を上書き/拡張
  interface EnvGetter {
    get(key: "DB"): D1Database | undefined;
    get(key: "KV"): KVNamespace | undefined;
    get(key: "IMAGES"): ImagesBinding | undefined;
    get(key: "R2"): R2Bucket | undefined;
  }
}
