/**
 * 用于计算不同坐标系中的位置信息
 */
import {TextBuffer} from "../text/textBuffer";
import {ViewState} from "./viewState";
import {Position} from "../core/position";
import {Point} from "../core/point";
import {EditorView} from "./editorView";

export class ViewModel {

  constructor(
    private buffer: TextBuffer,
    private view: EditorView
  ) {
  }

  /**
   * 从缓冲区的二维坐标, 转换为缓冲区的显示坐标
   * 显示坐标意为: 每个字符都有高度和宽度信息, 考虑了这些信息后, 计算每个字符应该显示的矩形左上角位置
   * 由于行存在高度, 而点坐标不能够保存这个信息, 因此只显示左上角的坐标
   * position(0, 0) -> point(0, 0)
   * position(1, 1) -> point(lineH, measure(buffer[1][0-1]))
   * 如果每个字符不再等宽, 那么只需要扩展该方法即可, 可能需要缓存字符尺寸信息
   * @param p
   * @private
   */
  public bufferPositionToScreenPoint(p: Position): Point {
    return new Point(p.column * this.view.fontW, p.lineNumber* this.view.lineH);
  }

  /**
   * 从缓冲区的显示坐标, 转换为缓冲区二维坐标
   * @param p
   * @private
   */
  public screenPointToBufferPosition(p: Point): Position {
    let lineNumber = Math.floor(p.y / this.view.lineH);
    let column = Math.round(p.x / this.view.fontW);
    return new Position(lineNumber, column);
  }

  /**
   * 显示坐标转换为相对坐标
   * @param p
   */
  public screenPointToRelativePoint(p: Point): Point{
    return p.originTransform(this.view.scrollLeft, this.view.scrollTop);
  }

  /**
   * 相对坐标转换为滚动坐标
   * @param p
   */
  public relativePointScreenPoint(p: Point): Point{
    return p.originTransform(-this.view.scrollLeft, -this.view.scrollTop);
  }

  /**
   * 相对坐标转换为画布坐标
   * @param p
   */
  public relativePointToCanvasPoint(p: Point): Point{
    return p.originTransform(-this.view.paddingLeft, -this.view.paddingTop);
  }

  /**
   * 画布坐标转换为相对坐标
   * @param p
   */
  public canvasPointToRelativePoint(p: Point): Point{
    return p.originTransform(this.view.paddingLeft, this.view.paddingTop);
  }

  public canvasPointToValidatePosition(p: Point): Position{
    p = this.canvasPointToRelativePoint(p);
    p = this.relativePointScreenPoint(p);
    let pos = this.screenPointToBufferPosition(p);
    return this.buffer.validatePosition(pos);
  }

  /**
   * 需要注意的是: 每一个字符构成一个矩形, 这里的位置实际上是矩形的左上角坐标
   * @param pos
   */
  public bufferPositionToCanvasPoint(pos: Position): Point{
    let p = this.bufferPositionToScreenPoint(pos);
    p = this.screenPointToRelativePoint(p);
    p = this.relativePointToCanvasPoint(p);
    return p;
  }

}