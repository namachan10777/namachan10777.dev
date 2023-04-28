function search_plaintext(node: ParentNode): string | null {
  for (let index = 0; index < node.children.length; ++index) {
    const plaintext_node = node.children[index].getElementsByClassName("plaintext-code");
    if (plaintext_node.length > 0) {
      return plaintext_node[0].textContent;
    }
  }
  return null;
}

const copy_buttons = document.getElementsByClassName("code-copy");
for (let index = 0; index < copy_buttons.length; ++index) {
  const button = copy_buttons[index];
  const container_root = button.parentNode;
  if (container_root) {
    const text = search_plaintext(container_root);
    if (text) {
      button.addEventListener("click", function() {
        console.log(text);
        navigator.clipboard.writeText(text);
      });
    }
  }
}
