import '@testing-library/jest-dom/vitest';
// jsdom has no layout or scrolling implementation; app navigation and the assistant use these browser APIs.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
HTMLCanvasElement.prototype.getContext = () => null;
