import { Stack } from "../core/stack";

export interface ITrie {
  add(word: string): void;
  contains(word: string): boolean;
  containsPrefix(prefix: string): boolean;
  startWith(prefix: string): string[] | undefined;
  delete(word: string): void;
  size(): number;
}

interface TrieNodePair {
  node: TrieNode;
  char: string;
}

//@internal
class TrieNode {
  public set isWord(value: boolean) {
    this._isWord = value;
  }
  public get isWord(): boolean {
    return this._isWord;
  }
  public get word(): string {
    return this.isWord ? this._word : "";
  }
  public set word(value: string) {
    this._word = value;
  }
  private _isWord: boolean;
  private _next: Map<string, TrieNode>;
  private _word: string = "";
  constructor(isword?: boolean) {
    this._next = new Map<string, TrieNode>();
    this._isWord = isword || false;
  }
  put(char: string, node: TrieNode): void {
    this._next.set(char, node);
  }
  get(char: string): TrieNode | undefined {
    return this._next.get(char);
  }
  has(char: string): boolean {
    return this._next.has(char);
  }
  childCount(): number {
    return this._next.size;
  }
  delete(char: string): TrieNode | undefined {
    if (this._next.has(char)) {
      let node = this._next.get(char);
      this._next.delete(char);
      return node;
    }
    return undefined;
  }
  children(): TrieNodePair[] {
    let ret: TrieNodePair[] = [];
    for (let [char, child] of this._next) {
      ret.push({
        char: char,
        node: child,
      });
    }
    return ret;
  }
}

export class Trie implements ITrie {
  private _root: TrieNode;
  private _size: number = 0;

  public size(): number {
    return this._size;
  }

  public constructor() {
    this._root = new TrieNode();
  }

  public add(word: string): void {
    let current = this._root;
    for (let i = 0; i < word.length; i++) {
      let char = word.charAt(i);
      let node = current.get(char);
      let newNode: TrieNode | undefined = undefined;
      if (node == undefined) {
        newNode = new TrieNode();
        current.put(char, newNode);
      }
      current = node || newNode!;
    }
    if (!current.isWord) {
      this._size++;
      current.word = word;
      current.isWord = true;
    }
  }
  contains(word: string): boolean {
    let current = this._root;
    for (let i = 0; i < word.length; i++) {
      let c = word.charAt(i);
      let node = current.get(c);
      if (node === undefined) {
        return false;
      }
      current = node;
    }
    return current.isWord;
  }
  containsPrefix(prefix: string): boolean {
    let current = this._root;
    for (let i = 0; i < prefix.length; i++) {
      let char = prefix.charAt(i);
      let node = current.get(char);
      if (node === undefined) {
        return false;
      }
      current = node;
    }
    return true;
  }
  startWith(prefix: string): string[] | undefined {
    let current = this._root;
    for (let i = 0; i < prefix.length; i++) {
      let char = prefix.charAt(i);
      let node = current.get(char);
      if (node === undefined) {
        return undefined;
      }
      current = node;
    }
    let ret: string[] = [];
    // 此时current为前缀中的最后一个节点

    let stack = new Stack<TrieNode>();
    stack.push(current);
    while (!stack.isEmpty()) {
      let node = stack.pop()!;
      if (node.isWord) {
        ret.push(node.word);
      }
      for (let pair of node.children()) {
        stack.push(pair.node);
      }
    }
    return ret;
  }
  delete(word: string): boolean {
    let multiChildNode!: TrieNode;
    let multiChildNodeIndex = -1;
    let current = this._root;
    for (let i = 0; i < word.length; i++) {
      let node = current.get(word.charAt(i));
      //如果Trie中没有这个单词
      if (node === undefined) {
        return false;
      }
      //当前节点的子节点大于1个
      if (node.childCount() > 1) {
        multiChildNodeIndex = i;
        multiChildNode = node;
      }
      current = node;
    }
    //如果单词后面还有子节点
    if (current.childCount() > 0) {
      if (current.isWord) {
        current.isWord = false;
        this._size--;
        return true;
      }
      //不存在该单词，该单词只是前缀
      return false;
    }
    //如果单词的所有字母的都没有多个分支，删除整个单词
    if (multiChildNodeIndex == -1) {
      this._root.delete(word.charAt(0));
      this._size--;
      return true;
    }
    //如果单词的除了最后一个字母，其他的字母有分支
    if (multiChildNodeIndex != word.length - 1) {
      multiChildNode.delete(word.charAt(multiChildNodeIndex + 1));
      this._size--;
      return true;
    }
    return false;
  }
}

export function createTrieFromStringList(list: string[]): Trie {
  let trie: Trie = new Trie();
  for (let i = 0; i < list.length; i++) {
    trie.add(list[i]);
  }
  return trie;
}
