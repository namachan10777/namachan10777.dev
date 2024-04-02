import { createSignal } from "solid-js";
import "./hamburget.css";
import { EventBus } from "@components/event-bus/event-bus-client";

const HamburgerButton = () => {
  const [opened, setOpened] = createSignal(false);
  const bus = new EventBus("main-bus");
  bus.subscribe("nav-close", () => {
    setOpened(false);
  });
  bus.subscribe("nav-open", () => {
    setOpened(true);
  });
  bus.subscribe("nav-toggle", () => {
    if (opened()) {
      bus.emit({ type: "nav-close" });
    } else {
      bus.emit({ type: "nav-open" });
    }
  });
  return (
    <div className="flex h-full w-full items-center justify-center">
      <button
        className={`root ${opened() ? "open" : ""}`}
        onClick={() => bus.emit({ type: "nav-toggle" })}
        aria-label={
          opened()
            ? "グローバルナビゲーションを閉じる"
            : "グローバルナビゲーションを開く"
        }
      >
        <div className="bar top"></div>
        <div className="bar center"></div>
        <div className="bar bottom"></div>
      </button>
    </div>
  );
};

export default HamburgerButton;
