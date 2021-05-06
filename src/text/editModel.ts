import {TextBuffer} from "./textBuffer";
import {Cursor} from "./cursor";
import {EditOperation} from "./operation";
import {Range} from "../core/range";
import {TextChange} from "./textChange";
import {Position} from "../core/position";
import {logd} from "../utils/log";
import {IEventListener} from "../utils/event";
import {isSingleLetter} from "../utils/char";


export enum Direction {
  Up,
  Down,
  Left,
  Right
}

export interface IBufferPositionUtils {

  atBufferEnd(position: Position): boolean
  atBufferStart(position: Position): boolean
  atLineStart(position: Position): boolean
  atLineEnd(position: Position): boolean

  offsetAt(p: Position): number
  positionAt(offset: number): Position | undefined
  isValidPosition(p: Position): boolean
  isValidRange(r: Range): boolean

  validatePosition(p: Position): Position
}


/**
 * 不需要考虑视图的变化, 在buffer和cursor上进行逻辑操作
 */
export class EditModel extends IEventListener{
  private readonly buffer: TextBuffer;
  private readonly cursor: Cursor;

  public constructor(buffer: TextBuffer, cursor: Cursor) {
    super();
    this.buffer = buffer;
    this.cursor = cursor;
  }

  /**
   * 无论有无选择区域都可以直接使用selection进行插入, 两种情况的操作参数是一样的.
   * @param text
   */
  public insert(text: string) {
    let change = this.buffer.applyEdit(new EditOperation(this.cursor.selection, text));
    if (change) {
      this.locate(change.newRange.getEndPosition());
      this.signal('textChange', change);
    }
  }

  public applyEdit(op: EditOperation, source: string): void{
    let change = this.buffer.applyEdit(op);
    if(change){
      if(change.newText == ""){
        this.locate(change.newRange.getStartPosition());
      }else{
        this.locate(change.newRange.getEndPosition());
      }
      this.signal('textChange', change, source);
    }
  }

  public delete(direction: string = 'backward') {
    let change: TextChange | undefined;
    let r: Range | undefined = this.cursor.selection;
    if (r.isEmpty()) {
      r = direction === "backward" ? this.prevCharRange() : this.nextCharRange();
    }
    if (r != undefined) {
      let change = this.buffer.applyEdit(new EditOperation(r, ""));
      if (change) {
        this.locate(change.newRange.getStartPosition())
        this.signal('textChange', change);
      }
    }
  }

  // 操作和insert一致, 为了语义化
  public replace(text: string) {
    this.insert(text);
  }

  public append(text: string) {
    this.locate(this.buffer.range.getEndPosition());
    this.insert(text);
  }

  public appendLine(text: string, checkEnd = false) {
    if(!checkEnd){
      this.append(text + this.buffer.eof);
      return;
    }
    if (!text.endsWith(this.buffer.eof)) {
      text += this.buffer.eof;
    }
    this.append(text);
  }


  public get selectText(): string{
    if(!this.cursor.hasSelection){
      return "";
    }
    return this.buffer.rangeText(this.cursor.selection);
  }
  /**
   * 光标的定位, 当进行了编辑操作或者点击编辑区域时进行
   * 如果之前没有选择区域, 发送cursorLocate事件
   * 如果之前有选择区域, 发送selectionChange事件
   * @param p
   * @param keepLastColumn 在移动光标时是否需要保持列不变(上下移动光标时, 尽量保持相同的位置)
   */
  locate(p: Position, keepLastColumn = false): boolean {
    if (!this.buffer.isValidPosition(p)) {
      return false;
    }
    let prevSel = this.cursor.selection;
    this.cursor.locate(p, keepLastColumn);
    if (!prevSel.isEmpty()) {
      this.signal("selectionChange", prevSel, this.cursor.selection, true);
    }else{
      this.signal("cursorLocate", prevSel.getStartPosition(), this.cursor.position);
    }
    return true;
  }

  selectRange(r: Range){
    this.select(r.getStartPosition(), r.getEndPosition());
  }
  select(st: Position, ed: Position) {
    if (st.equals(ed)) {
      logd("editModel", "select", "no range between two same position");
      return;
    }
    if (this.buffer.isValidPosition(st) && this.buffer.isValidPosition(ed)) {
      let prevSel = this.cursor.selection;
      this.cursor.select(st, ed);
      this.signal("selectionChange", prevSel, this.cursor.selection, true);
    }
  }
  /**
   * 当进行全选时不需要滚动到光标的位置, 如何来处理这个行为?
   */
  public selectAll(): void {
    let r = this.buffer.range;
    if(r.isEmpty()){
      return;
    }
    let prevSel = this.cursor.selection;
    this.cursor.select(r.getStartPosition(), r.getEndPosition());
    this.signal("selectionChange", prevSel, r, false);
  }


  selectTo(p: Position) {
    this.select(this.cursor.anchor, p);
  }

  // 获取前一个字符的位置, 用于delete函数
  private prevCharRange(): Range | undefined {
    let p = this.cursor.position;
    if (this.buffer.atBufferStart(p)) {
      return undefined;
    }
    let [nl, nc] = p.tuple();
    let bl = nc == 0 ? nl - 1 : nl;
    let bc = nc == 0 ? this.buffer.lineLength(bl) : nc - 1;
    return Range.fromPositions(p, p.with(bl, bc));
  }

  private nextCharRange(): Range | undefined {
    let p = this.cursor.position;
    if (this.buffer.atBufferEnd(p) || this.buffer.atLineEnd(p)) {
      return undefined;
    }
    return Range.fromPositions(p, p.with(p.lineNumber, p.column + 1));
  }


  public getLeftPos(ignoreEol = false): Position | undefined {
    let p = this.cursor.position;
    let [ln, col] = this.cursor.position.tuple();
    if (this.buffer.atBufferStart(p)) {
      return undefined;
    }
    if (!this.buffer.atLineStart(p)) {
      col--;
    } else {
      if (!ignoreEol) {
        return;
      }
      ln--;
      col = this.buffer.lineLength(ln);
    }
    return p.with(ln, col);
  }

  public getRightPos(ignoreEol = false): Position | undefined {
    let p = this.cursor.position;
    let [ln, col] = p.tuple();
    if (this.buffer.atBufferEnd(p)) {
      return undefined;
    }
    if (!this.buffer.atLineEnd(p)) {
      col++;
    } else {
      if (!ignoreEol) {
        return undefined;
      }
      ln++;
      col = -1;
    }
    return p.with(ln, col);
  }

  public getUpPos(): Position | undefined {
    let p = this.cursor.position;
    let [ln, col] = p.tuple();
    ln--;
    if (ln < 0) {
      return undefined;
    }
    let maxColumn = this.buffer.lineLength(ln);
    col = maxColumn > this.cursor.lastColumn ? this.cursor.lastColumn : maxColumn;
    return p.with(ln, col);
  }

  public getDownPos(): Position | undefined {
    let p = this.cursor.position;
    let [ln, col] = p.tuple();
    ln++;
    if (ln > this.buffer.lines - 1) {
      return;
    }
    let maxColumn = this.buffer.lineLength(ln);
    col = maxColumn > this.cursor.lastColumn ? this.cursor.lastColumn : maxColumn;
    return p.with(ln, col);
  }

  public getMovePosition(direction: Direction, ignoreEol = false): Position | undefined {
    let funcMap = [this.getUpPos, this.getDownPos, this.getLeftPos, this.getRightPos];
    return direction >= Direction.Left ? funcMap[direction].call(this, ignoreEol) : funcMap[direction].call(this);
  }

  public moveCursor(direction: Direction){
    let np = this.getMovePosition(direction);
    if(np){
      this.locate(np);
    }
  }

  /**
   * 选择光标附近的一个单词: [a-zA-z]*
   */
  selectWord() {
    let p = this.cursor.position;
    let line = this.buffer.lineString(p.lineNumber);
    if(line == ""){
      return;
    }
    let idx = p.column-1;
    while (idx >= 0){
      if(!isSingleLetter(line[idx])){
        break;
      }
      idx--;
    }
    let j = p.column;
    while (j < line.length){
      if(!isSingleLetter(line[j])){
        break;
      }
      j++;
    }
    this.select(p.with(p.lineNumber, j), p.with(p.lineNumber, idx+1))
  }

  selectCurrentLine() {
    let ln = this.cursor.position.lineNumber;
    let st = new Position(ln, 0);
    let ed = ln == this.buffer.lines - 1 ? st.with(ln, this.buffer.lineLength(ln)) : st.with(ln + 1);
    this.select(st, ed);
  }

  /**
   * 如果没有选择区域, 那么复制当前的行
   * 否则复制选择区域的内容
   */
  getCopyText(): string{
    if(this.cursor.hasSelection){
      return this.selectText;
    }else{
      return this.buffer.lineString(this.cursor.position.lineNumber) + this.buffer.eof;
    }

  }
}