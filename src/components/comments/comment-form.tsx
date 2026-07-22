import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { CommentSubmitValue } from "~/lib/comments";
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

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function getSubmitError(value: CommentSubmitValue | undefined) {
  if (!value || !("failed" in value)) return undefined;
  return "message" in value ? value.message : "コメントの投稿に失敗しました";
}

export function CommentForm({
  turnstileSiteKey,
  onSubmitted,
}: {
  turnstileSiteKey: string;
  onSubmitted: () => void | Promise<void>;
}) {
  const fetcher = useFetcher<CommentSubmitValue>();
  const formRef = useRef<HTMLFormElement>(null);
  const widgetId = useRef("");
  const loadingTurnstile = useRef(false);
  const lastSubmittedComment = useRef("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");

  const renderTurnstile = useCallback(() => {
    const container = document.getElementById("turnstile-container");
    if (!container || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container, {
      sitekey: turnstileSiteKey,
      callback: (token) => {
        setTurnstileToken(token);
        setError("");
      },
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setError("Turnstile の読み込みに失敗しました"),
    });
  }, [turnstileSiteKey]);

  const ensureTurnstileLoaded = useCallback(async () => {
    if (widgetId.current) return;
    if (window.turnstile) {
      renderTurnstile();
      return;
    }
    if (loadingTurnstile.current) return;
    loadingTurnstile.current = true;

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT}"]`,
    );
    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    try {
      if (!window.turnstile) {
        await new Promise<void>((resolve, reject) => {
          script.addEventListener("load", () => resolve(), { once: true });
          script.addEventListener(
            "error",
            () => reject(new Error("Turnstile の読み込みに失敗しました")),
            { once: true },
          );
        });
      }
      renderTurnstile();
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Turnstile の読み込みに失敗しました",
      );
    } finally {
      loadingTurnstile.current = false;
    }
  }, [renderTurnstile]);

  useEffect(() => {
    const data = fetcher.data;
    if (!data || !("comment" in data)) return;
    if (lastSubmittedComment.current === data.comment.id) return;
    lastSubmittedComment.current = data.comment.id;
    setTurnstileToken("");
    formRef.current?.reset();
    if (window.turnstile && widgetId.current) {
      window.turnstile.reset(widgetId.current);
    }
    void onSubmitted();
  }, [fetcher.data, onSubmitted]);

  useEffect(
    () => () => {
      if (window.turnstile && widgetId.current) {
        window.turnstile.remove(widgetId.current);
      }
    },
    [],
  );

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      className={styles.commentForm}
      onSubmit={(event) => {
        if (turnstileToken) {
          setError("");
          return;
        }
        event.preventDefault();
        setError("認証を完了してください");
        void ensureTurnstileLoaded();
      }}
    >
      <label className={styles.formLabel}>
        名前
        <input
          type="text"
          className={styles.formInput}
          name="name"
          onFocus={() => void ensureTurnstileLoaded()}
          maxLength={100}
          required
        />
      </label>
      <label className={styles.formLabel}>
        コメント
        <textarea
          className={styles.formTextarea}
          name="content"
          onFocus={() => void ensureTurnstileLoaded()}
          maxLength={10000}
          required
        />
      </label>
      <div className={styles.formActions}>
        <div id="turnstile-container" className={styles.turnstileContainer} />
        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        {error && <p className={styles.errorMessage}>{error}</p>}
        {getSubmitError(fetcher.data) && (
          <p className={styles.errorMessage}>{getSubmitError(fetcher.data)}</p>
        )}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={fetcher.state !== "idle" || !turnstileToken}
        >
          {fetcher.state !== "idle" ? "送信中..." : "投稿"}
        </button>
      </div>
    </fetcher.Form>
  );
}
