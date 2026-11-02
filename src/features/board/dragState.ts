// The browser fires a click right after a pointer drag ends; cards ignore it.
let lastDragEnd = 0;

export const markDragEnd = (): void => {
  lastDragEnd = Date.now();
};

export const justDragged = (): boolean => Date.now() - lastDragEnd < 250;
