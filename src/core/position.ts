/**
 * @desc 文档中的位置信息
 * @member lineNumber: [0, ~)
 * @member column: [0, line.length]，列的数量比一行中的字符数目多1
 */


export interface IPosition {
  readonly lineNumber: number;
  readonly column: number;
}

export class Position implements IPosition{
  public readonly lineNumber: number;
  public readonly column: number;

  constructor(lineNumber: number, column: number) {
    this.lineNumber = lineNumber;
    this.column = column;
  }

  tuple(): [number, number]{
    return [this.lineNumber, this.column];
  }

  /**
   * Create a new position from this position.
   *
   * @param newLineNumber new line number
   * @param newColumn new column
   */
  with(newLineNumber: number = this.lineNumber, newColumn: number = this.column): Position {
    if (newLineNumber === this.lineNumber && newColumn === this.column) {
      return this;
    } else {
      return new Position(newLineNumber, newColumn);
    }
  }

  /**
   * 平移变换
   */
  transform(deltaLineNumber: number = 0, deltaColumn: number = 0): Position {
    return this.with(this.lineNumber + deltaLineNumber, this.column + deltaColumn);
  }


  public equals(other: IPosition): boolean {
    return Position.equals(this, other);
  }

  /**
   * Test if position `a` equals position `b`
   */
  public static equals(a: IPosition | null, b: IPosition | null): boolean {
    if (!a && !b) {
      return true;
    }
    return (
      !!a &&
      !!b &&
      a.lineNumber === b.lineNumber &&
      a.column === b.column
    );
  }

  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be false.
   */
  public isBefore(other: IPosition): boolean {
    return Position.isBefore(this, other);
  }

  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be false.
   */
  public static isBefore(a: IPosition, b: IPosition): boolean {
    if (a.lineNumber < b.lineNumber) {
      return true;
    }
    if (b.lineNumber < a.lineNumber) {
      return false;
    }
    return a.column < b.column;
  }

  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be true.
   */
  public isBeforeOrEqual(other: IPosition): boolean {
    return Position.isBeforeOrEqual(this, other);
  }

  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be true.
   */
  public static isBeforeOrEqual(a: IPosition, b: IPosition): boolean {
    if (a.lineNumber < b.lineNumber) {
      return true;
    }
    if (b.lineNumber < a.lineNumber) {
      return false;
    }
    return a.column <= b.column;
  }

  /**
   * A function that compares positions, useful for sorting
   */
  public static compare(a: IPosition, b: IPosition): number {
    let aLineNumber = a.lineNumber | 0;
    let bLineNumber = b.lineNumber | 0;

    if (aLineNumber === bLineNumber) {
      let aColumn = a.column | 0;
      let bColumn = b.column | 0;
      return aColumn - bColumn;
    }

    return aLineNumber - bLineNumber;
  }

  public toString(): string {
    return '(' + this.lineNumber + ',' + this.column + ')';
  }

  /**
   * Create a `Position` from an `IPosition`.
   */
  public static lift(pos: IPosition): Position {
    return new Position(pos.lineNumber, pos.column);
  }

  /**
   * Test if `obj` is an `IPosition`.
   */
  public static isIPosition(obj: any): obj is IPosition {
    return (
      obj
      && (typeof obj.lineNumber === 'number')
      && (typeof obj.column === 'number')
    );
  }
}

