import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("post", "routes/post/index.ts"),
  route("post/page/:page", "routes/post/page/[page]/index.tsx"),
  route("post/tag/:tag/:page", "routes/post/tag/[tag]/[page]/index.tsx"),
  route("post/*", "routes/post/[...id]/index.tsx"),
  route("rss.xml", "routes/rss.xml/index.ts"),
  route("image/*", "routes/image/[...id]/index.ts"),
  route("api/comments/*", "routes/api/comments/[...id]/index.ts"),
  route("api/like/*", "routes/api/like/[...id]/index.ts"),
] satisfies RouteConfig;
