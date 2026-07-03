// Sprite-sheet image imports that flow in from @worldkit/sprite-actor's
// source (resolved via the @org/source condition).
declare module '*.png' {
  const src: string;
  export default src;
}
