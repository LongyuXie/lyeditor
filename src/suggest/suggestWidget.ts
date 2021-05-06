import {createFastDomNode, DIV, emptyElement, FastDomNode,} from "../core/fastDomNode";

export class SuggestItem {
  public data: string;
  public domNode: HTMLElement;

  constructor(data: string, index: number) {
    this.data = data;
    this.domNode = DIV();
    this.domNode.classList.add("suggest-item");
    this.domNode.setAttribute("data-index", index.toString());
    this.domNode.textContent = this.data;
  }
}

export class SuggestWidget {
  private lastChecked: number = 0;
  private suggestItems: SuggestItem[] = [];
  private lineHeight = 20;
  private checkedClassName = "suggest-checked";

  public constructor() {
    this._domNode = createFastDomNode(DIV());
    this._domNode.setClassName("suggest-widget");
    this._domNode.setPosition("absolute");
    this._domNode.setWidth(200);
    this._domNode.setHeight(100);
    this._domNode.setVisibility("hidden");
    this._domNode.domNode.style.overflow = "auto";
    this.setCoordinate(0, 0);
  }

  private _domNode: FastDomNode<HTMLElement>;

  public get domNode(): FastDomNode<HTMLElement> {
    return this._domNode;
  }

  public getCurrentText(): string {
    return this.suggestItems[this.lastChecked].data;
  }

  public updateView(items: string[]) {
    emptyElement(this._domNode.domNode);
    this.suggestItems = this.createSuggestListBox(items);
    this.suggestItems.forEach((value) => {
      this.domNode.domNode.appendChild(value.domNode);
    });
    this.lastChecked = 0;
    this.suggestItems[0].domNode.classList.toggle(this.checkedClassName);
  }

  public setCheck(index: number) {
    if (index < 0 || index >= this.suggestItems.length) {
      return;
    }
    if ((index + 1) * this.lineHeight > 100) {
      this.domNode.domNode.scrollTop += this.lineHeight;
    } else if ((index + 1) * this.lineHeight < this.domNode.domNode.scrollTop) {
      this.domNode.domNode.scrollTop -= this.lineHeight;
    }
    if (index === 0) {
      this._domNode.domNode.scrollTop = 0;
    } else if (index === this.suggestItems.length - 1) {
      this._domNode.domNode.scrollTop = 9999;
    }
    this.suggestItems[index].domNode.classList.toggle(this.checkedClassName);
    this.suggestItems[this.lastChecked].domNode.classList.toggle(
      this.checkedClassName
    );
    this.lastChecked = index;
  }

  public selectPrevious(): void {
    if (this.lastChecked === 0) {
      this.setCheck(this.suggestItems.length - 1);
    } else {
      this.setCheck(this.lastChecked - 1);
    }
  }

  public selectNext(): void {
    this.setCheck(
      this.lastChecked === this.suggestItems.length - 1
        ? 0
        : this.lastChecked + 1
    );
  }

  public setCoordinate(left: number, top: number): void {
    this._domNode.setTop(top);
    this._domNode.setLeft(left);
  }

  public show(): void {
    this._domNode.domNode.scrollTop = 0;
    this._domNode.setVisibility("visible");
  }

  public hide(): void {
    this._domNode.setVisibility("hidden");
  }

  private createSuggestListBox(items: string[]): SuggestItem[] {
    let ret: SuggestItem[] = [];
    items.forEach((value, index, array) => {
      ret.push(new SuggestItem(value, index));
    });
    return ret;
  }
}
