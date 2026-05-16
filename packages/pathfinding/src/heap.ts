export type Heap<T> = {
  items: T[];
  compare: (a: T, b: T) => number;
};

export function createHeap<T>(compare: (a: T, b: T) => number): Heap<T> {
  return { items: [], compare };
}

export function heapSize<T>(heap: Heap<T>): number {
  return heap.items.length;
}

export function heapPush<T>(heap: Heap<T>, item: T): void {
  const { items, compare } = heap;
  items.push(item);
  let i = items.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (compare(items[i]!, items[parent]!) < 0) {
      const tmp = items[i]!;
      items[i] = items[parent]!;
      items[parent] = tmp;
      i = parent;
    } else {
      break;
    }
  }
}

export function heapPop<T>(heap: Heap<T>): T | undefined {
  const { items, compare } = heap;
  if (items.length === 0) {
    return undefined;
  }
  const top = items[0]!;
  const last = items.pop()!;
  if (items.length === 0) {
    return top;
  }
  items[0] = last;
  const n = items.length;
  let i = 0;
  while (true) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    let smallest = i;
    if (left < n && compare(items[left]!, items[smallest]!) < 0) {
      smallest = left;
    }
    if (right < n && compare(items[right]!, items[smallest]!) < 0) {
      smallest = right;
    }
    if (smallest === i) {
      break;
    }
    const tmp = items[i]!;
    items[i] = items[smallest]!;
    items[smallest] = tmp;
    i = smallest;
  }
  return top;
}
