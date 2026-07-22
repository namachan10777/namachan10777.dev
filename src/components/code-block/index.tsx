import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Check from "~icons/iconoir/check";
import Copy from "~icons/iconoir/copy";
import * as styles from "./styles.css";

function Lines({ lines }: { lines: number }) {
  return (
    <ol aria-hidden="true" className={styles.lines}>
      {Array.from({ length: lines }).map((_, index) => (
        <li key={index}>{index + 1}</li>
      ))}
    </ol>
  );
}

function CopyButton({
  preRef,
}: {
  preRef: React.RefObject<HTMLElement | null>;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleClick = async () => {
    const text = preRef.current?.textContent;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      className={styles.copyButton}
      onClick={() => void handleClick()}
      aria-label="コードをコピー"
    >
      {copied ? (
        <>
          <span>Copied</span>
          <Check />
        </>
      ) : (
        <>
          <span>Copy</span>
          <Copy />
        </>
      )}
    </button>
  );
}

export function CodeBlock({
  lines,
  title,
  children,
}: {
  lines: number;
  title: string;
  children: ReactNode;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  return (
    <div className={styles.root}>
      {title && (
        <header className={styles.header}>
          <span className={styles.headerTitle}>{title}</span>
          <CopyButton preRef={preRef} />
        </header>
      )}
      <div className={styles.codeBody}>
        <Lines lines={lines} />
        <div className={styles.scrollBox}>
          <pre ref={preRef} className={styles.pre}>
            {children}
          </pre>
        </div>
      </div>
    </div>
  );
}
