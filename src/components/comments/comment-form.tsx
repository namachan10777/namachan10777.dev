import {
  $,
  component$,
  type PropFunction,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
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
  postId: string;
  turnstileSiteKey: string;
  onSubmit$: PropFunction<() => void>;
}

export const CommentForm = component$<Props>(
  ({ postId, turnstileSiteKey, onSubmit$ }) => {
    const name = useSignal("");
    const content = useSignal("");
    const turnstileToken = useSignal("");
    const isSubmitting = useSignal(false);
    const error = useSignal("");
    const widgetId = useSignal<string>("");

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const container = document.getElementById("turnstile-container");
      if (!container) return;

      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.turnstile) {
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
        }
      };

      document.head.appendChild(script);

      cleanup(() => {
        if (window.turnstile && widgetId.value) {
          window.turnstile.remove(widgetId.value);
        }
        script.remove();
      });
    });

    const handleSubmit = $(async () => {
      if (!turnstileToken.value) {
        error.value = "認証を完了してください";
        return;
      }

      if (!name.value.trim()) {
        error.value = "名前を入力してください";
        return;
      }

      if (!content.value.trim()) {
        error.value = "コメントを入力してください";
        return;
      }

      isSubmitting.value = true;
      error.value = "";

      try {
        const response = await fetch(`/api/comments/${postId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.value.trim(),
            content: content.value.trim(),
            turnstileToken: turnstileToken.value,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "コメントの投稿に失敗しました");
        }

        name.value = "";
        content.value = "";
        turnstileToken.value = "";

        if (window.turnstile && widgetId.value) {
          window.turnstile.reset(widgetId.value);
        }

        await onSubmit$();
      } catch (e) {
        error.value = e instanceof Error ? e.message : "エラーが発生しました";
      } finally {
        isSubmitting.value = false;
      }
    });

    return (
      <form
        preventdefault:submit
        onSubmit$={handleSubmit}
        class={styles.commentForm}
      >
        <label class={styles.formLabel}>
          名前
          <input
            type="text"
            class={styles.formInput}
            value={name.value}
            onInput$={(e) => {
              name.value = (e.target as HTMLInputElement).value;
            }}
            maxLength={100}
            required
          />
        </label>
        <label class={styles.formLabel}>
          コメント
          <textarea
            class={styles.formTextarea}
            value={content.value}
            onInput$={(e) => {
              content.value = (e.target as HTMLTextAreaElement).value;
            }}
            maxLength={10000}
            required
          />
        </label>
        <div class={styles.formActions}>
          <div id="turnstile-container" class={styles.turnstileContainer} />
          {error.value && <p class={styles.errorMessage}>{error.value}</p>}
          <button
            type="submit"
            class={styles.submitButton}
            disabled={isSubmitting.value}
          >
            {isSubmitting.value ? "送信中..." : "コメントを投稿"}
          </button>
        </div>
      </form>
    );
  },
);
