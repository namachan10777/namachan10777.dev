import { $, component$, type QRL, useSignal } from "@qwik.dev/core";
import { Form, type ActionStore } from "@qwik.dev/router";
import type { CommentPostInput, CommentSubmitValue } from "~/lib/comments";
import styles from "./styles.module.css";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface Props {
  turnstileSiteKey: string;
  submitAction: ActionStore<CommentSubmitValue, CommentPostInput, false>;
  onSubmit$: QRL<() => void>;
}

const getFormString = (formData: FormData | undefined, name: string) => {
  const value = formData?.get(name);
  return typeof value === "string" ? value : undefined;
};

const getSubmitError = (value: CommentSubmitValue | undefined) => {
  if (!value || !("failed" in value)) {
    return undefined;
  }

  if ("message" in value) {
    return value.message;
  }

  return "コメントの投稿に失敗しました";
};

export const CommentForm = component$<Props>(
  ({ turnstileSiteKey, submitAction, onSubmit$ }) => {
    const turnstileToken = useSignal("");
    const isLoadingTurnstile = useSignal(false);
    const error = useSignal("");
    const widgetId = useSignal<string>("");

    const renderTurnstile = $(() => {
      const container = document.getElementById("turnstile-container");
      if (!container || !window.turnstile || widgetId.value) return;

      widgetId.value = window.turnstile.render(container, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => {
          turnstileToken.value = token;
        },
        "expired-callback": () => {
          turnstileToken.value = "";
        },
        "error-callback": () => {
          error.value = "Turnstile の読み込みに失敗しました";
        },
      });
    });

    const ensureTurnstileLoaded = $(async () => {
      if (widgetId.value) return;

      if (window.turnstile) {
        await renderTurnstile();
        return;
      }

      if (isLoadingTurnstile.value) return;

      isLoadingTurnstile.value = true;

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]',
      );

      if (existingScript) {
        await new Promise<void>((resolve, reject) => {
          existingScript.addEventListener("load", () => resolve(), {
            once: true,
          });
          existingScript.addEventListener(
            "error",
            () => reject(new Error("Turnstile の読み込みに失敗しました")),
            { once: true },
          );
        }).catch((e) => {
          error.value =
            e instanceof Error
              ? e.message
              : "Turnstile の読み込みに失敗しました";
        });
      } else {
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;

        await new Promise<void>((resolve, reject) => {
          script.addEventListener("load", () => resolve(), { once: true });
          script.addEventListener(
            "error",
            () => reject(new Error("Turnstile の読み込みに失敗しました")),
            { once: true },
          );
          document.head.appendChild(script);
        }).catch((e) => {
          error.value =
            e instanceof Error
              ? e.message
              : "Turnstile の読み込みに失敗しました";
        });
      }

      isLoadingTurnstile.value = false;

      if (window.turnstile) {
        await renderTurnstile();
      }
    });

    const handleSubmit = $(() => {
      if (!turnstileToken.value) {
        error.value = "認証を完了してください";
        void ensureTurnstileLoaded();
        return;
      }

      error.value = "";
    });

    const handleSubmitCompleted = $(async () => {
      turnstileToken.value = "";

      if (window.turnstile && widgetId.value) {
        window.turnstile.reset(widgetId.value);
      }

      await onSubmit$();
    });

    return (
      <Form
        action={submitAction}
        onSubmit$={handleSubmit}
        onSubmitCompleted$={handleSubmitCompleted}
        spaReset
        class={styles.commentForm}
      >
        <label class={styles.formLabel}>
          名前
          <input
            type="text"
            class={styles.formInput}
            name="name"
            value={getFormString(submitAction.formData, "name")}
            onFocus$={ensureTurnstileLoaded}
            maxLength={100}
            required
          />
        </label>
        <label class={styles.formLabel}>
          コメント
          <textarea
            class={styles.formTextarea}
            name="content"
            value={getFormString(submitAction.formData, "content")}
            onFocus$={ensureTurnstileLoaded}
            maxLength={10000}
            required
          />
        </label>
        <div class={styles.formActions}>
          <div id="turnstile-container" class={styles.turnstileContainer} />
          <input
            type="hidden"
            name="turnstileToken"
            value={turnstileToken.value}
          />
          {error.value && <p class={styles.errorMessage}>{error.value}</p>}
          {getSubmitError(submitAction.value) && (
            <p class={styles.errorMessage}>
              {getSubmitError(submitAction.value)}
            </p>
          )}
          <button
            type="submit"
            class={styles.submitButton}
            disabled={submitAction.isRunning || !turnstileToken.value}
          >
            {submitAction.isRunning ? "送信中..." : "投稿"}
          </button>
        </div>
      </Form>
    );
  },
);
