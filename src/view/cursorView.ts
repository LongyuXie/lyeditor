/**
 * 控制光标的显示
 */

import {Cursor} from "../text/cursor";
import {EditorView} from "./editorView";
import {Rectangle} from "../core/rectangle";
import {lowerBound, normalize} from "../utils/number";
import {addClass, rmClass, switchNext} from "../utils/dom";

// private updateCursor() {
//   let pos = this._cursor.position();
//   let left = this._fontWidth * pos.column;
//   let top = this._lineHeight * pos.lineNumber;
//   let p = new Point(left, top);
//   p = p.originTransform(-this._paddingLeft, -this._paddingTop);
//   p = p.originTransform(+this.scrollLeft, +this.scrollTop);
//
//   let c = this.layout.cursor;
//   if(p.x < 0 || p.x >= this._canvasWidth || p.y < 0 || p.y >= this._canvasHeight){
//     c.style.display = "none";
//     return;
//   }
//   if(c.style.top === `${p.y}px` && c.style.left === `${p.x}px`){
//     return;
//   }
//   c.style.display = "";
//   c.style.top = p.y + "px";
//   c.style.left = p.x + "px";
// }
/**
 * 光标的显示控制, 主要是控制光标的大小, 是否显示, 闪烁间隔,
 * - 光标的显示
 * - 光标并不是由画布进行绘制，而是通过一个div进行模拟
 * - 光标显示为一条竖线，高度为行间距，宽度为1px，颜色可以配置（默认为黑色）
 * - 当进行滚动时，光标的逻辑位置不发生改变，但是显示的位置会发生改变
 * - 当光标处于边界时，可能显示不完全，需要根据实际的位置计算光标的高度
 * - 如果光标处于不可显示的区域时，需要修改光标的状态使其不可见
 * - 如果光标处于不可见的位置时，如果进行了编辑操作需要进行一定的滚动，使光标所在的行移动到可视区域的第一行或者最后一行
 *　- 如果光标处于边界位置（删除一行，增加一行的位置），那么在操作后光标需要移动到编辑后的行位置
 ＊　- 使用方向键移动光标时，如果处于可视区域的第一行（向上）或者最后一行（向下），需要进行一次滚动以便显示光标
 ＊　- 对于插入和替换操作，光标将定位到插入或者替换的文本之后，如果是删除操作，则会定位到被删除的文本开始处
 */
export class CursorView {
  dom: HTMLDivElement;
  cursor: Cursor;
  width: number;
  height: number;
  // 闪烁的时间, 使用css属性来控制光标闪烁
  blink: number;

  private view: EditorView;

  private static animation: string[] = ["cursor-blink1", "cursor-blink2"];

  /// 光标的绘制规则
  /// 1. 有焦点的情况下
  /// 如果光标处于可视区域, 那么绘制光标
  /// 否则光标不显示
  /// 2. 无焦点的情况下
  /// 无论如何都不在显示光标
  /// 什么时候重新绘制光标呢?
  /// scroll position改变的情况需要更新光标(只在有焦点的情况下)
  /// cursor locate后需要更新光标
  /// 失去和获取焦点都需要更新光标的状态

  /// TODO: 焦点的切换问题
  /// 在获取到编辑器的光标后, 如果将鼠标定位到Edge浏览器的网址导航栏, 再点击编辑器以外的地方, 光标将先出现后消失
  /// 也就是说切换到导航栏焦点时, 会保存之前的焦点位置
  /// textarea的状态如下, 会有一个获取焦点又失去焦点的状态
  /// 切换到导航       离开导航并点击其他位置
  // focus -> blur -> focus -> blur
  constructor(view: EditorView, cursor: Cursor) {
    this.dom = view.layout.cursor;
    this.cursor = cursor;
    this.width = 1;
    this.height = view.state.lineH;
    this.blink = 100;
    this.view = view;

    /// TODO: 改善光标闪烁逻辑(fixed)
    /// 闪烁光标存在的问题, 当进行编辑操作时, 我希望每次编辑完后显示的光标都是实线, 之后进行闪烁
    /// 如果只是使用一个动画效果的话, 光标闪烁只和时间有关
    /// 通过使用两个css类来控制动画效果, 这两个类的行为是一样的
    /// 但是在切换的时候光标透明度为0, 也就是显示实线, 每次更新光标的时候切换类
    addClass(this.dom, "cursor-blink1");
  }

  update() {
    if(!this.view.state.focused){
      if(this.dom.style.display != "none"){
        this.hide();
      }
      return;
    }
    let display = this.isDisplay();
    this.dom.style.display = !display ? "none" : "";
    if (!display) {
      console.log("not display");
      return;
    }

    this.dom.className = this.dom.className.indexOf(CursorView.animation[0]) > 0 ? "lyeditor-cursor cursor-blink2" : "lyeditor-cursor cursor-blink1";

    let p = this.view.positionToCanvasPoint(this.cursor.position);
    // console.log("cursor");
    // console.log(p);
    let h = this.evalCursorHeight();
    let top = lowerBound(p.y, 0);
    this.dom.style.top = top + "px";
    this.dom.style.left = p.x + "px";
    this.dom.style.height = this.evalCursorHeight() + "px";
    this.dom.style.width = this.width + "px";
  }


  /**
   * 判断是否显示光标, 规则为: 如果光标所在的矩形完全不在可编辑区域内的时, 不显示光标
   */
  public isDisplay(): boolean {
    // 从光标的逻辑位置计算在文档中的左上角坐标
    let pos = this.cursor.position;

    // 将文档的逻辑位置转换为画布的坐标
    let p = this.view.positionToCanvasPoint(pos);
    // console.log(p);
    let r1 = new Rectangle(p.x, p.y, this.width, this.view.lineH);
    // 可编辑区域的矩形
    let r2 = this.view.clientRect();

    // 计算两个矩形是否交叉
    return r2.areIntersecting(r1);
  }

  public hide(){
    this.dom.style.display = "none";
  }
  public show(){
    this.dom.style.display = "";
  }

  /**
   * 计算光标的可视区域内应该显示的高度,
   * 可以延续上面的想法使用交叉矩形的高度, 而不是if-else
   */
  public evalCursorHeight(): number {
    let pos = this.cursor.position;
    let top = pos.lineNumber * this.view.lineH - this.view.scrollTop;
    if (top <= -this.view.lineH) {
      return 0;
    } else if (top < 0) {
      return Math.abs(this.view.lineH+top);
    } else if (top < this.view.height - this.view.lineH) {
      return this.view.lineH
    } else if (top < this.view.height) {
      return this.view.height - top;
    } else {
      return 0;
    }
  }
}