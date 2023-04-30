import * as CodeRepo from "./code-repo.mjs";

console.log("Hello WOrld!");

const copy_buttons = document.getElementsByClassName("code-copy");
for (let index = 0; index < copy_buttons.length; ++index) {
  const button = copy_buttons[index];
  button.addEventListener("click", function() {
    const type = "text/plain";
    const blob = new Blob([CodeRepo.codes[button.id]], { type });
    navigator.clipboard.write([new ClipboardItem({
      [type]: blob
    })]);
  });
}
