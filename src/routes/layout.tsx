import {
  component$,
  Slot,
  useSignal,
  useStylesScoped$,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import Header from "~/components/layout-parts/header";
import MobileSidePane from "~/components/layout-parts/mobile-side-pane";
import style from "./layout.css?inline";
import DesktopSidePane from "~/components/layout-parts/desktop-side-pane";
import Footer from "~/components/layout-parts/footer";
import SearchDialog from "~/components/layout-parts/search-dialog";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: new Date().toISOString(),
  };
});

export default component$(() => {
  const sidePaneOpen = useSignal(false);
  const showSearchDialog = useSignal(false);
  const scrollY = useSignal(0);
  useStylesScoped$(style);
  const freezeMainContent = sidePaneOpen.value || showSearchDialog.value;
  useTask$(({ track }) => {
    track(() => sidePaneOpen.value);
    track(() => showSearchDialog.value);
    if (typeof window !== "undefined") {
      if (sidePaneOpen.value || showSearchDialog.value) {
        scrollY.value = window.scrollY;
      }
    }
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => sidePaneOpen.value);
    track(() => showSearchDialog.value);
    if (typeof window !== "undefined") {
      if (!sidePaneOpen.value && !showSearchDialog.value) {
        window.scroll({ behavior: "instant", top: scrollY.value });
        console.log(`scrolled: ${scrollY.value}`);
      }
    }
  });
  return (
    <div class="root">
      <div class="header-wrapper">
        <Header sidePaneOpen={sidePaneOpen} />
      </div>
      <div
        class={["mobile-sidepane-wrapper"].concat(
          sidePaneOpen.value ? ["mobile-sidepane-open"] : [],
        )}
      >
        <MobileSidePane />
      </div>
      <SearchDialog show={showSearchDialog} />
      <div class="two-column-wrapper">
        <div class="desktop-sidepane-wrapper">
          <DesktopSidePane showSearchDialog={showSearchDialog} />
        </div>
        <div
          class={freezeMainContent ? ["freeze-scrollable"] : []}
          style={{
            transform: freezeMainContent
              ? `translateY(-${scrollY.value}px)`
              : "unset",
          }}
        >
          <main class="main-content">
            <div class="inner-container">
              <Slot />
            </div>
          </main>
          <div class="footer-wrapper">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
});
