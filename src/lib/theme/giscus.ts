import type { Theme, ThemeAdapter } from "./index";

const giscusTheme: { [key in Theme]: string } = {
  light: "light",
  dark: "dark",
};

type State =
  | {
      type: "created";
      giscus: HTMLIFrameElement;
    }
  | {
      type: "uninitialized";
    }
  | {
      type: "initialized";
      giscus: HTMLIFrameElement;
    };

export class GiscusAdapter implements ThemeAdapter {
  #state: State = { type: "uninitialized" };
  #theme: Theme | null = null;

  #sendThemeToGiscus() {
    switch (this.#state.type) {
      case "uninitialized":
        return;
      case "created":
      case "initialized":
        if (this.#state.giscus.contentWindow && this.#theme) {
          console.log(this.#state, this.#theme);
          this.#state.giscus.contentWindow.postMessage(
            { giscus: { setConfig: { theme: giscusTheme[this.#theme] } } },
            "https://giscus.app",
          );
          this.#state = { ...this.#state, type: "initialized" };
        }
    }
  }

  init(theme: Theme): void {
    this.#theme = theme;
    this.#state = { type: "uninitialized" };

    window.addEventListener("message", (event) => {
      if (event.origin !== "https://giscus.app") return;
      console.log(event);
      if (this.#state.type === "uninitialized") {
        this.#state = {
          type: "created",
          giscus: document.querySelector("iframe.giscus-frame")!,
        };
        this.#sendThemeToGiscus();
      }
    });
  }

  apply(theme: Theme): void {
    this.#theme = theme;
    this.#sendThemeToGiscus();
  }
}
