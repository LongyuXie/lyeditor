export class Stack<T> {
  private _topNode: Node<T> | undefined = undefined;
  private _count: number = 0;

  constructor() {
  }

  public count(): number {
    return this._count;
  }

  public isEmpty(): boolean {
    return this._count === 0;
  }

  public push(value: T): void {
    if (this.isEmpty()) {
      this._topNode = new Node(value);
    } else {
      let node = new Node<T>(value, this._topNode);
      this._topNode = node;
    }
    this._count++;
  }

  public pop(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    let poppedNode = this._topNode!;
    this._topNode = poppedNode.previous;
    this._count--;
    return poppedNode.data;
  }

  public peek(): T | undefined {
    return this._topNode === undefined ? undefined : this._topNode.data;
  }
}

class Node<T> {
  previous: Node<T> | undefined;
  data: T;

  constructor(data: T, previous?: Node<T>) {
    this.previous = previous;
    this.data = data;
  }
}
