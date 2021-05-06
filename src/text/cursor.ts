import {Position} from "../core/position"
import {Range} from "../core/range"

/**
 * 不要考虑事件的处理和边界控制
 */
export class Cursor {
  get lastColumn(): number {
    return this._lastColumn;
  }
  private _anchor: Position;
  private _position: Position;
  private _lastColumn: number;

  public constructor(){
    this._position = new Position(0, 0);
    this._anchor   = this._position.with();
    this._lastColumn = 0;
  }

  public get hasSelection(): boolean{
    return !this._anchor.equals(this._position);
  }

  public get direction(): string {
    return this._anchor.isBeforeOrEqual(this._position) ? "forward" : "backward";
  }

  public get selectionStart(): Position{
    return this._anchor.isBefore(this._position) ? this._anchor : this._position;
  }
  public get selectionEnd(): Position{
    return this._anchor.isBefore(this._position) ? this._position : this._anchor;
  }

  public get position(): Position{
    return this._position;
  }
  public get anchor(): Position{
    return this._anchor;
  }
  public get selection(): Range{
    return Range.fromPositions(this._anchor, this._position);
  }

  public locate(p: Position, keepLastColumn = false): void{
    this._position = p;
    this._anchor   = p.with();
    if(!keepLastColumn){
      this._lastColumn = p.column;
    }
  }
  public select(start: Position, end: Position): void{
    this._anchor   = start;
    this._position = end;
  }
}