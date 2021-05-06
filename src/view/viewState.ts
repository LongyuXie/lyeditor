import {fontWidth} from "../utils/dom";

export interface EditorOptions {
  canvasWidth: number;
  canvasHeight: number;
  fontFamily: string;
  fontsize: number;
  paddingLeft: number;
  paddingTop: number;
}
/**
 * 保存了视图的状态信息
 */
export class ViewState {
  get focused(): boolean {
    return this._focused;
  }

  set focused(value: boolean) {
    this._focused = value;
  }
  get eWidth(): number {
    return this._eWidth;
  }
  get eHeight(): number {
    return this._eHeight;
  }
  get cWidth(): number {
    return this._cWidth;
  }
  get cHeight(): number {
    return this._cHeight;
  }
  get paddingLeft(): number {
    return this._paddingLeft;
  }
  get paddingTop(): number {
    return this._paddingTop;
  }
  private _paddingLeft: number;
  private _paddingTop: number;

  // 编辑器中可编辑部分的实际宽高
  private _eHeight: number;
  private _eWidth: number;

  // 画布的大小
  private _cHeight: number;
  private _cWidth: number;


  private context: CanvasRenderingContext2D;

  private _focused: boolean = false;

  public constructor(context: CanvasRenderingContext2D, opt: any) {
    this.context = context;
    this._lineH = Math.floor(opt.fontsize * 1.3);
    this._fontW = fontWidth(context);

    this._cHeight = opt.canvasHeight;
    this._cWidth = opt.canvasWidth;

    this._paddingTop = opt.paddingTop;
    this._paddingLeft = opt.paddingLeft;

    this._eHeight = this._cHeight - this._paddingTop;
    this._eWidth = this._cWidth - this._paddingLeft;
  }

  private _lineH: number;

  get lineH(): number {
    return this._lineH;
  }

  private _fontW: number;

  get fontW(): number {
    return this._fontW;
  }

  get lines(): number {
    return Math.floor(this._eHeight / this._lineH);
  }

  get columns(): number {
    return Math.floor(this._eWidth / this._fontW);
  }

}