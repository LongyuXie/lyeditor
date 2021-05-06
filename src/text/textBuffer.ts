import {Range} from "../core/range";
import {Position} from "../core/position";
import {EditOperation, ValidEditOperation} from "./operation";
import {TextChange} from "./textChange";
import {Text} from "./text";
import {lowerBound, normalize, upperBound} from "../utils/number";

/**
 * 文档模型, 使用二维坐标
 * 行的范围：[0, lines.length-1)
 * 列的范围：[0, lines[i].length]
 * 行是左闭右开，列是左闭右闭
 */
export class TextBuffer {
  public string = this.text;
  private doc: Text = Text.empty;

  /**
   * 用户的输入是不可信的，在字符串数组中各个字符串不是最小的分量，其中可能包含换行符
   * 在构造函数中需要处理这些意外的情况
   * @param text
   * @constructor
   */
  public constructor(text?: string | string[]) {
    this.setText(text);
  }

  private _eof = "\n";

  public get eof(): string {
    return this._eof;
  }

  public get range(): Range {
    let endLineNumber = this.lines - 1;
    return new Range(0, 0, endLineNumber, this.lineLength(endLineNumber));
  }

  public get lines(): number {
    return this.doc.lines;
  }

  public get charsCount(): number {
    return this.doc.length;
  }

  public get text(): string {
    return this.doc.toString();
  }

  public get array(): string[] {
    return this.doc.toJSON();
  }

  public setText(text: string | string[] | undefined) {
    if (text == undefined) {
      return;
    }
    if (typeof text == "string") {
      this.doc = Text.of([text]);
    } else {
      // TODO：可能还需要处理\r\n这样的换行符号
      this.doc = Text.of(text);
    }
  }

  public rangeText(range: Range): string {
    let [from, to] = this.rangeToOffsetRange(range);
    return this.doc.sliceString(from, to, this.eof);
  }

  // 左闭右开的区间
  public slice(start: number, end: number): string[] {
    start = lowerBound(start, 0);
    end = upperBound(end, this.lines);
    let iter = this.doc.iter().next();
    let idx = 0;
    let array: string[] = [];
    while (!iter.done && idx <= end) {
      if (idx >= start && !iter.lineBreak) {
        array.push(iter.value);
      }
      if (iter.lineBreak) {
        idx++;
      }
      iter.next();
    }
    return array;
  }

  public lineString(line: number): string {
    return this.doc.line(line + 1).text;
  }

  public lineLength(line: number): number {
    return this.doc.line(line + 1).length;
  }

  public applyEdit(op: EditOperation): TextChange | undefined {
    if (!this.isValidRange(op.range)) {
      return undefined;
    }
    let text = "";
    if (op.text != undefined) {
      text = op.text;
    }
    if (op.range.isEmpty() && text == "") {
      return undefined;
    }
    return this._applyEdit(new ValidEditOperation(op.range, text));
  }

  /**
   * 一个合法的区间定义，区间的开始和结束位置都在文档中
   * @param range
   */
  public isValidRange(range: Range): boolean {
    if (range.isEmpty()) {
      return true;
    }
    if (range.startLineNumber < 0
      || range.endLineNumber >= this.lines
    ) {
      return false;
    }
    return !(range.startColumn < 0
      || range.startColumn > this.lineLength(range.startLineNumber)
      || range.endColumn < 0
      || range.endColumn > this.lineLength(range.endLineNumber));
  }

  public isValidPosition(p: Position): boolean {
    let [l, c] = p.tuple();
    if (l < 0 || l >= this.lines) {
      return false;
    }
    return c >= 0 && c <= this.lineLength(l);
  }

  // 辅助函数
  public atBufferEnd(position: Position): boolean {
    return (
      position.lineNumber == this.lines - 1 &&
      position.column === this.lineLength(position.lineNumber)
    );
  }

  public atLineEnd(position: Position): boolean {
    return position.column == this.lineLength(position.lineNumber);
  }

  public atBufferStart(position: Position): boolean {
    return position.lineNumber == 0 && position.column == 0;
  }

  public atLineStart(position: Position): boolean {
    return position.column == 0;
  }

  public offsetAt(p: Position): number {
    if (this.isValidPosition(p)) {
      return this._offsetAt(p);
    }
    return -1;
  }

  public positionAt(offset: number): Position | undefined {
    if (offset >= 0 && offset <= this.charsCount) {
      return this._positionAt(offset);
    }
    return undefined;
  }

  /**
   * 对光标的位置进行越界修正
   * @param p
   * @private
   */
  public validatePosition(p: Position): Position {
    let [l, c] = p.tuple();
    l = normalize(l, 0, this.lines - 1);
    c = normalize(c, 0, this.lineLength(l));
    return p.with(l, c);
  }

  private rangeToOffsetRange(r: Range): [number, number] {
    return [
      this._offsetAt(r.getStartPosition()),
      this.offsetAt(r.getEndPosition())
    ]
  }

  private _offsetAt(pos: Position): number {
    return this.doc.offsetAt(pos.lineNumber + 1, pos.column);
  }

  private _positionAt(offset: number): Position {
    let [l, c] = this.doc.positionAt(offset);
    return new Position(l - 1, c);
  }

  private _applyEdit(op: ValidEditOperation): TextChange {
    const oldText = this.rangeText(op.range);
    const lines = op.text.split(this.eof);
    const lastLine: number = lines.length - 1;
    let endColumn =
      lines[lastLine].length + (lines.length == 1 ? op.range.startColumn : 0);
    const newRange = new Range(
      op.range.startLineNumber,
      op.range.startColumn,
      op.range.startLineNumber + lastLine,
      endColumn
    );
    let from = this._offsetAt(op.range.getStartPosition());
    let to = this._offsetAt(op.range.getEndPosition());
    // console.log(from);
    // console.log(to);
    this.doc = this.doc.replace(from, to, Text.of(lines));
    // console.log(this.doc);
    return new TextChange(newRange, op.text, op.range, oldText);
  }

}