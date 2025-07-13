export function h(
  tag: string,
  props: Record<string, string>,
  children: HTMLElement[] | string | { dangerouslyHtml: string }
): HTMLElement {
  const element = document.createElement(tag);
  if (typeof children === 'string') {
    element.textContent = children;
  } else if ('dangerouslyHtml' in children) {
    element.innerHTML = children.dangerouslyHtml;
  } else {
    element.append(...children);
  }
  for (const [key, value] of Object.entries(props)) {
    element.setAttribute(key, value);
  }
  return element;
}
