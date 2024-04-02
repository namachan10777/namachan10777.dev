/* @jsxImportSource solid-js */
import { EventBus } from "@components/event-bus/event-bus-client";
import { IoSearchOutline } from "solid-icons/io";

const SearchOn = () => {
  const bus = new EventBus("main-bus");
  return (
    <button
      class="w-full rounded-md bg-gray-800 px-2 transition-colors hover:bg-gray-600"
      aria-label="検索ウィンドウを開く"
      onClick={() => bus.emit({ type: "search-on" })}
    >
      <div class="flex w-full flex-row items-center gap-2 py-2">
        <IoSearchOutline />
        <span>search...</span>
      </div>
    </button>
  );
};

export default SearchOn;
