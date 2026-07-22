import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { NotFound } from "~/components/not-found";
import { SiteLayout } from "~/routes/layout";
import "./global.css";

export function loader({ request }: LoaderFunctionArgs) {
  return { origin: new URL(request.url).origin };
}

export const links = () => [
  { rel: "icon", type: "image/vnd.microsoft.icon", href: "/favicon.ico" },
  { rel: "stylesheet", href: "/katex.min.css", crossOrigin: "anonymous" },
  ...(import.meta.env.PROD
    ? [{ rel: "manifest", href: "/manifest.json" }]
    : []),
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const rootData = useRouteLoaderData<typeof loader>("root");
  const canonical = rootData
    ? `${rootData.origin}${location.pathname}${location.search}`
    : location.pathname;

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"
        />
        <link rel="canonical" href={canonical} />
        <Meta />
        <Links />
      </head>
      <body lang="en">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (!isRouteErrorResponse(error) || error.status !== 404) {
    console.error(error);
  }

  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  );
}
