/* @jsxImportSource solid-js */

import { EventBus } from "@components/event-bus/event-bus-client";
import { IoSearchOutline, IoCloseCircleOutline } from "solid-icons/io";
import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { Pagefind, type Data } from "./pagefind";

const SearchDialog = () => {
  const bus = new EventBus("main-bus");
  const [open, setOpen] = createSignal(false);
  const pagefind = new Pagefind();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();
  const [items, setItems] = createSignal<Data[]>([]);
  const [word, setWord] = createSignal("");
  createEffect(() => {
    const rawInput = inputRef();
    if (rawInput && open()) {
      rawInput.focus();
    }
  });

  bus.subscribe("search-on", () => {
    setOpen(true);
    bus.emit({ type: "background-fix" });
  });
  if (!isServer) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setWord("");
        setItems([]);
        bus.emit({ type: "background-release" });
      }
    });
  }
  return (
    <dialog open={open()}>
      <div class="fixed left-0 top-0 z-30 flex h-full w-full flex-col items-center">
        <div
          class="fixed left-0 top-0 h-full w-full backdrop-blur-sm"
          onClick={() => {
            setItems([]);
            setOpen(false);
            setWord("");
            bus.emit({ type: "background-release" });
          }}
        ></div>
        <div class="z-50 md:mt-24 flex w-full items-center justify-center p-4">
          <div class="z-50 grid w-full grid-cols-[2rem_1fr_2rem] gap-4 rounded border bg-white p-4 md:w-4/6">
            <div class="contents">
              <div class="flex justify-center items-center h-full w-full">
                <IoSearchOutline class="w-10 text-2xl" />
              </div>
              <input
                type="text"
                class="w-full focus:outline-none"
                aria-label="検索ワードを入力"
                value={word()}
                ref={setInputRef}
                onInput={(e) => {
                  setWord(e.target.value);
                  pagefind.debouncedSearch(async (response) => {
                    const items = await Promise.all(
                      response.results.map((result) => result.data()),
                    );
                    setItems(items);
                  }, word());
                }}
              />
              <button
                onClick={() => {
                  setOpen(false);
                  setItems([]);
                  setWord("");
                  bus.emit({ type: "background-release" });
                }}
                aria-label="検索ウィンドウを閉じる"
                class="flex justify-center items-center h-full w-full"
              >
                <IoCloseCircleOutline class="text-2xl" />
              </button>
            </div>
            <ol class=" col-span-3 md:col-span-1 md:col-start-2 flex max-h-96 flex-col gap-4 overflow-x-clip overflow-y-scroll">
              {items().map((item) => (
                <li>
                  <a href={item.url}>
                    <h3 class="text-lg font-bold">{item.meta.title}</h3>
                    <p innerHTML={item.excerpt} class="text-sm text-gray-600" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default SearchDialog;
