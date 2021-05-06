import {createDom} from "../utils/dom";

export class EditorLayout {
  constructor() {
    this._createDom();
    this._buildDom();
  }

  private _root!: HTMLDivElement;

  get root(): HTMLDivElement {
    return this._root;
  }

  private _canvas!: HTMLCanvasElement;

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  private _textarea!: HTMLTextAreaElement;

  get textarea(): HTMLTextAreaElement {
    return this._textarea;
  }

  private _background!: HTMLDivElement;

  get background(): HTMLDivElement {
    return this._background;
  }

  private _cursor!: HTMLDivElement;

  get cursor(): HTMLDivElement {
    return this._cursor;
  }

  private _selroot!: HTMLDivElement;

  get selroot(): HTMLElement {
    return this._selroot;
  }

  public resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.background.style.width = `${w}px`;
    this.background.style.height = `${h}px`;
    this._selroot.style.width = `${w}px`;
    this._selroot.style.height = `${h}px`;
  }

  private _createDom() {
    this._root = createDom('div', "lyeditor-root");
    this._canvas = createDom('canvas', "lyeditor-canvas");
    this._cursor = createDom("div", "lyeditor-cursor");
    this._selroot = createDom("div", "lyeditor-selroot");
    this._textarea = createDom('textarea', "lyeditor-textarea");
    this._background = createDom("div", "lyeditor-background");
  }

  private _buildDom() {
    this._root.appendChild(this._canvas);
    this._root.appendChild(this._background);
    this._root.appendChild(this._cursor);
    this._root.appendChild(this._selroot);
    this._background.appendChild(this._textarea);
  }
}