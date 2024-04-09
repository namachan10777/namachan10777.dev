import {
  type Signal,
  component$,
  useStylesScoped$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Modal, ModalContent } from "@qwik-ui/headless";
import styles from "./search-dialog.css?inline";
import { loadPagefind } from "~/misc/pagefind";

export type Props = {
  show: Signal<boolean>;
};

export default component$((props: Props) => {
  const { scopeId } = useStylesScoped$(styles);
  const query = useSignal("");
  useVisibleTask$(async () => {
    const api = await loadPagefind();
    await api.init();
    console.log(api.search("Qwik"));
  });
  return (
    <Modal bind:show={props.show} class={["root", scopeId]}>
      <ModalContent>
        <input type="text" placeholder="Search" bind:value={query} />
      </ModalContent>
    </Modal>
  );
});
