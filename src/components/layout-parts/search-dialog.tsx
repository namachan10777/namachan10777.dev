import { type Signal, component$, useStylesScoped$ } from "@builder.io/qwik";
import { Modal, ModalContent } from "@qwik-ui/headless";
import styles from "./search-dialog.css?inline";

export type Props = {
  show: Signal<boolean>;
};

export default component$((props: Props) => {
  const { scopeId } = useStylesScoped$(styles);
  return (
    <Modal bind:show={props.show} class={["root", scopeId]}>
      <ModalContent>Search Window</ModalContent>
    </Modal>
  );
});
