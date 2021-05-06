import {TextBuffer} from "../text/textBuffer";
import {Point} from "../core/point";
import {Position} from "../core/position";
import {ViewPort} from "../utils/dom";


/**
 * 我希望使用一个类来控制缓冲区内的文本在窗口的显示
 * 更确切地说:
 * 1. 对于当前窗口的scrollTop和scrollLeft, 计算出应该输出的行和列的范围
 * 2. 光标的逻辑位置移动一行, 文本不变时, 滚动条的位置
 * 3. 文本内容增加一行, 滚动条的位置和高度
 * 3. 删除一行, 滚动条的位置和高度
 */
export class TextView {
  private buffer: TextBuffer;

  constructor(buffer: TextBuffer) {
    this.buffer = buffer;
  }
  /**
   * 绘制一行文本
   * @param context
   * @param ln 绘制的行号
   * @param sc 绘制开始的位置
   * @param p  绘制的位置
   * @param ec
   */
  drawLine(context: CanvasRenderingContext2D, p: Point, ln: number, sc: number, ec: number): void {
    let content = this.buffer.lineString(ln);
    content = content.slice(sc, ec);
    context.fillText(content, p.x, p.y);
  }

  drawText(context: CanvasRenderingContext2D, p: Point, lineH: number, vp: ViewPort){
    let top = p.y;
    let left = p.x;
    let idx = vp.sl;
    while (idx <= Math.min(this.buffer.lines-1, vp.el)) {
      this.drawLine(context, new Point(left, top), idx, vp.sc, vp.ec);
      idx++;
      top += lineH;
    }
  }
}