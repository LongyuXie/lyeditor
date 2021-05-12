export class EasyDomNode<T extends HTMLElement> {

  public readonly domNode: T;
  private _maxWidth: number;
  private _width: number;
  private _height: number;
  private _top: number;
  private _left: number;

  private _className: string;

  constructor(domNode: T) {
    this.domNode = domNode;
    this._maxWidth = -1;
    this._width = -1;
    this._height = -1;
    this._top = -1;
    this._left = -1;

    this._className = '';
  }

  public setMaxWidth(maxWidth: number): void {
    if (this._maxWidth === maxWidth) {
      return;
    }
    this._maxWidth = maxWidth;
    this.domNode.style.maxWidth = this._maxWidth + 'px';
  }

  public setWidth(width: number): void {
    if (this._width === width) {
      return;
    }
    this._width = width;
    this.domNode.style.width = this._width + 'px';
  }

  public setHeight(height: number): void {
    if (this._height === height) {
      return;
    }
    this._height = height;
    this.domNode.style.height = this._height + 'px';
  }

  public setTop(top: number): void {
    if (this._top === top) {
      return;
    }
    this._top = top;
    this.domNode.style.top = this._top + 'px';
  }

  public unsetTop(): void {
    if (this._top === -1) {
      return;
    }
    this._top = -1;
    this.domNode.style.top = '';
  }

  public setLeft(left: number): void {
    if (this._left === left) {
      return;
    }
    this._left = left;
    this.domNode.style.left = this._left + 'px';
  }

  public setClassName(className: string): void {
    if (this._className === className) {
      return;
    }
    this._className = className;
    this.domNode.className = this._className;
  }

  public toggleClassName(className: string, shouldHaveIt?: boolean): void {
    this.domNode.classList.toggle(className, shouldHaveIt);
    this._className = this.domNode.className;
  }

  public setAttribute(name: string, value: string): void {
    this.domNode.setAttribute(name, value);
  }

  public removeAttribute(name: string): void {
    this.domNode.removeAttribute(name);
  }

  public appendChild(child: EasyDomNode<T>): void {
    this.domNode.appendChild(child.domNode);
  }

  public removeChild(child: EasyDomNode<T>): void {
    this.domNode.removeChild(child.domNode);
  }
}