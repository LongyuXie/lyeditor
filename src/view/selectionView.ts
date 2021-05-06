import {Cursor} from "../text/cursor";
import {EditorView} from "./editorView";
import {upperBound} from "../utils/number";
import {rmChild, setDomPosAndSize} from "../utils/dom";


export class SelectionView {
  private cursor: Cursor;
  private view: EditorView;
  private selroot: HTMLElement;
  private selrect: HTMLElement[];

  private selectionColor: string = "#0000ff";

  // private head:

  public constructor(view: EditorView, cursor: Cursor) {
    this.view = view;
    this.cursor = cursor;
    this.selrect = this.createDom();
    this.selroot = view.layout.selroot;
  }

  update() {
    if (!this.cursor.hasSelection) {
      rmChild(this.selroot);
      return;
    }
    let sel = this.cursor.selection;
    /// 选择区域内的行的数量
    let lines = sel.endLineNumber - sel.startLineNumber + 1;
    let frag = this.ensureChildCount(lines);


    let top = this.view.lineH * sel.startLineNumber - this.view.scrollTop;
    if (lines == 1) {
      let w = (sel.endColumn - sel.startColumn) * this.view.fontW;
      let left = sel.startColumn * this.view.fontW - this.view.scrollLeft + this.view.state.paddingLeft;
      setDomPosAndSize(this.selrect[0], left, top, w, this.view.lineH);
    } else if (lines >= 2) {
      let w1 = this.view.width - sel.startColumn * this.view.fontW;
      let w2 = sel.endColumn * this.view.fontW - this.view.scrollLeft;
      let left1 = sel.startColumn * this.view.fontW - this.view.scrollLeft + this.view.state.paddingLeft;
      let left2 = this.view.state.paddingLeft;

      let h = (lines - 2) * this.view.lineH;

      setDomPosAndSize(this.selrect[0], left1, top, w1, this.view.lineH);
      if(lines == 2){
        setDomPosAndSize(this.selrect[1], left2, top + h + this.view.lineH, w2, this.view.lineH);
      }else{
        setDomPosAndSize(this.selrect[1], left2, top + this.view.lineH, this.view.width, h);
        setDomPosAndSize(this.selrect[2], left2, top + h + this.view.lineH, w2, this.view.lineH);
      }
    }

    this.selroot.appendChild(frag);
  }

  public createDom(): HTMLElement[] {
    let e: HTMLElement[] = [];
    for (let i = 0; i < 3; i++) {
      e.push(document.createElement('div'));
      e[i].className = "lyeditor-sel-background";
      e[i].style.background = this.selectionColor;
      e[i].style.position = "absolute";
    }
    return e;
  }

  /**
   * 为了减少对dom节点的插入删除
   * @param lines
   * @private
   */
  private ensureChildCount(lines: number): DocumentFragment {
    rmChild(this.selroot);
    lines = upperBound(lines, 3);
    let frag = document.createDocumentFragment();
    for (let i = 1; i <= lines; i++) {
      frag.appendChild(this.selrect[i-1]);
      // frag.append(this.selrect[i-1]);
    }
    return frag;
  }
}