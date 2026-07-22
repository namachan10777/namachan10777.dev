import { afterEach, describe, expect, it, vi } from "vitest";
import { RouterContextProvider, type LoaderFunctionArgs } from "react-router";
import { cloudflareContext } from "~/lib/context";
import { action as submitComment } from "~/routes/post/[...id]/index";
import { loader as getComments } from "./comments/[...id]/index";
import { action as addLike } from "./like/[...id]/index";
import { loader as serveImage } from "../image/[...id]/index";
import { loader as serveRss } from "../rss.xml/index";

function contextWith(env: Partial<Env>) {
  const context = new RouterContextProvider();
  context.set(cloudflareContext, {
    env: env as Env,
    ctx: {} as ExecutionContext,
  });
  return context;
}

function loaderArgs(
  request: Request,
  context: RouterContextProvider,
  params: Record<string, string> = {},
) {
  return {
    request,
    url: new URL(request.url),
    params,
    context,
    pattern: "",
  } as LoaderFunctionArgs;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("comment routes", () => {
  it("returns comments from D1", async () => {
    const comment = {
      post_id: "2026/test",
      id: "comment-id",
      created_at: "2026-07-22T00:00:00.000Z",
      name: "tester",
      content: "hello",
    };
    const all = vi.fn().mockResolvedValue({ results: [comment] });
    const bind = vi.fn().mockReturnValue({ all });
    const prepare = vi.fn().mockReturnValue({ bind });
    const context = contextWith({ DB: { prepare } as unknown as D1Database });

    const result = await getComments(
      loaderArgs(
        new Request("https://example.com/api/comments/2026/test"),
        context,
        { "*": "2026/test" },
      ),
    );

    expect(result.data).toEqual({ comments: [comment] });
    expect(bind).toHaveBeenCalledWith("2026/test");
  });

  it("validates Turnstile and inserts a comment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ success: true })),
    );
    const run = vi.fn().mockResolvedValue({ success: true });
    const bind = vi.fn().mockReturnValue({ run });
    const prepare = vi.fn().mockReturnValue({ bind });
    const context = contextWith({
      DB: { prepare } as unknown as D1Database,
      TURNSTILE_SECRET_KEY: "secret" as Env["TURNSTILE_SECRET_KEY"],
    });
    const form = new FormData();
    form.set("name", "tester");
    form.set("content", "hello");
    form.set("turnstileToken", "token");
    const request = new Request("https://example.com/post/2026/test", {
      method: "POST",
      body: form,
    });

    const result = await submitComment(
      loaderArgs(request, context, { "*": "2026/test" }),
    );

    expect(result.data).toMatchObject({
      comment: {
        post_id: "2026/test",
        name: "tester",
        content: "hello",
      },
    });
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("resource routes", () => {
  it("increments likes and preserves the response shape", async () => {
    const first = vi.fn().mockResolvedValue({ count: 4 });
    const bind = vi.fn().mockReturnValue({ first });
    const prepare = vi.fn().mockReturnValue({ bind });
    const context = contextWith({ DB: { prepare } as unknown as D1Database });
    const request = new Request("https://example.com/api/like/2026/test", {
      method: "POST",
    });

    const result = await addLike(
      loaderArgs(request, context, { "*": "2026/test" }),
    );

    expect(result.data).toEqual({ count: 4 });
  });

  it("validates image parameters and applies immutable caching", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("image", { status: 200 })),
    );
    const context = contextWith({});
    const response = await serveImage(
      loaderArgs(
        new Request(
          "https://example.com/image/pictures/test?width=800&format=webp",
        ),
        context,
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("renders RSS from published post rows", async () => {
    const post = {
      id: "2026/test",
      body: JSON.stringify({
        hash: "hash",
        size: 1,
        content_type: "application/json",
        meta: null,
        pointer: { type: "kv", namespace: "posts", key: "2026/test" },
      }),
      title: "Test post",
      description: "Description",
      date: "2026-07-22",
      publish: 1,
      hash: "hash",
      og_image: null,
      tags: JSON.stringify(["tech"]),
    };
    const run = vi.fn().mockResolvedValue({ results: [post] });
    const prepare = vi.fn().mockReturnValue({ run });
    const context = contextWith({ DB: { prepare } as unknown as D1Database });
    const response = await serveRss(
      loaderArgs(new Request("https://example.com/rss.xml"), context),
    );
    const xml = await response.text();

    expect(response.headers.get("Content-Type")).toContain(
      "application/rss+xml",
    );
    expect(xml).toContain("Test post");
    expect(xml).toContain("https://example.com/post/2026/test/");
  });
});
