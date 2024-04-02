import { EventBus } from "@components/event-bus/event-bus";
import { createSignal } from "solid-js";
import "./hamburget.css";

const HamburgerButton = () => {
  const bus = new EventBus("main-bus");
  const [opened, setOpened] = createSignal(false);

  bus.subscribe("nav-close", () => {
    setOpened(() => false);
    bus.emit({ type: "background-release" });
  });

  bus.subscribe("nav-open", () => {
    setOpened(() => true);
    bus.emit({ type: "background-fix" });
  });

  bus.subscribe("nav-toggle", () => {
    if (opened()) {
      bus.emit({ type: "nav-close" });
    } else {
      bus.emit({ type: "nav-open" });
    }
  });

  return (
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
  );
};

export default HamburgerButton;
