export interface SearchDialog {
  showModal(): void;
  close(): void;
}

export interface SearchBox {
  addCloseListener(listener: () => void): void;
}
