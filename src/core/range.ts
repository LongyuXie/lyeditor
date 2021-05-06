import {IPosition, Position} from "./position";

export interface IRange {
    readonly startLineNumber: number;
    readonly startColumn: number;
    readonly endLineNumber: number;
    readonly endColumn: number;
}

export class Range implements IRange{
    public readonly startLineNumber: number;
    public readonly startColumn: number;
    public readonly endLineNumber: number;
    public readonly endColumn: number;

    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) {
        if ((startLineNumber > endLineNumber) || (startLineNumber === endLineNumber && startColumn > endColumn)) {
            this.startLineNumber = endLineNumber;
            this.startColumn = endColumn;
            this.endLineNumber = startLineNumber;
            this.endColumn = startColumn;
        } else {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
        }
    }

    /**
     * Test if start position == end position
     */
    public isEmpty(): boolean {
        return Range.isEmpty(this);
    }
    public static isEmpty(range: IRange): boolean {
        return (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn);
    }

    public transform(lineNumber: number, column: number): Range{
        return new Range(this.startLineNumber + lineNumber,
            this.startColumn + column,
            this.endLineNumber + lineNumber,
            this.endColumn + column);
    }

    /**
     * Test if position is in this range.
     * If position is the edge, return true
     */
    public containsPosition(position: IPosition): boolean {
        return Range.containsPosition(this, position);
    }
    public static containsPosition(range: IRange, position: IPosition): boolean {
        if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
            return false;
        }
        if (position.lineNumber === range.startLineNumber && position.column < range.startColumn) {
            return false;
        }
        return !(position.lineNumber === range.endLineNumber && position.column > range.endColumn);

    }

    /**
     * Test if range is in this range.
     * If the range is equal to this range, will return true.
     */
    public containsRange(range: IRange): boolean {
        return Range.containsRange(this, range);
    }

    /**
     * Test if `range` contains `otherRange`
     * @param range
     * @param otherRange
     */
    public static containsRange(range: IRange, otherRange: IRange): boolean {
        if (otherRange.startLineNumber < range.startLineNumber || otherRange.endLineNumber < range.startLineNumber) {
            return false;
        }
        if (otherRange.startLineNumber > range.endLineNumber || otherRange.endLineNumber > range.endLineNumber) {
            return false;
        }
        if (otherRange.startLineNumber === range.startLineNumber && otherRange.startColumn < range.startColumn) {
            return false;
        }
        return !(otherRange.endLineNumber === range.endLineNumber && otherRange.endColumn > range.endColumn);

    }

    /**
     * Test if `range` is strictly in this range.
     * `range` must start after and end before this range for the result to be true.
     */
    public strictContainsRange(range: IRange): boolean {
        return Range.strictContainsRange(this, range);
    }

    /**
     * Test if `otherRange` is strinctly in `range` (must start after, and end before).
     * If the ranges are equal, will return false.
     */
    public static strictContainsRange(range: IRange, otherRange: IRange): boolean {
        if (otherRange.startLineNumber < range.startLineNumber || otherRange.endLineNumber < range.startLineNumber) {
            return false;
        }
        if (otherRange.startLineNumber > range.endLineNumber || otherRange.endLineNumber > range.endLineNumber) {
            return false;
        }
        if (otherRange.startLineNumber === range.startLineNumber && otherRange.startColumn <= range.startColumn) {
            return false;
        }
        return !(otherRange.endLineNumber === range.endLineNumber && otherRange.endColumn >= range.endColumn);

    }

    /**
     * A reunion of the two ranges.
     * The smallest position will be used as the start point, and the largest one as the end point.
     */
    public plusRange(range: IRange): Range {
        return Range.plusRange(this, range);
    }

    /**
     * A reunion of the two ranges.
     * The smallest position will be used as the start point, and the largest one as the end point.
     */
    public static plusRange(a: IRange, b: IRange): Range {
        let startLineNumber: number;
        let startColumn: number;
        let endLineNumber: number;
        let endColumn: number;

        if (b.startLineNumber < a.startLineNumber) {
            startLineNumber = b.startLineNumber;
            startColumn = b.startColumn;
        } else if (b.startLineNumber === a.startLineNumber) {
            startLineNumber = b.startLineNumber;
            startColumn = Math.min(b.startColumn, a.startColumn);
        } else {
            startLineNumber = a.startLineNumber;
            startColumn = a.startColumn;
        }

        if (b.endLineNumber > a.endLineNumber) {
            endLineNumber = b.endLineNumber;
            endColumn = b.endColumn;
        } else if (b.endLineNumber === a.endLineNumber) {
            endLineNumber = b.endLineNumber;
            endColumn = Math.max(b.endColumn, a.endColumn);
        } else {
            endLineNumber = a.endLineNumber;
            endColumn = a.endColumn;
        }

        return new Range(startLineNumber, startColumn, endLineNumber, endColumn);
    }

    /**
     * A intersection of the two ranges.
     */
    public intersectRanges(range: IRange): Range | null {
        return Range.intersectRanges(this, range);
    }

    /**
     * 计算交叉的range
     */
    public static intersectRanges(a: IRange, b: IRange): Range | null {
        let resultStartLineNumber = a.startLineNumber;
        let resultStartColumn = a.startColumn;
        let resultEndLineNumber = a.endLineNumber;
        let resultEndColumn = a.endColumn;
        let otherStartLineNumber = b.startLineNumber;
        let otherStartColumn = b.startColumn;
        let otherEndLineNumber = b.endLineNumber;
        let otherEndColumn = b.endColumn;

        if (resultStartLineNumber < otherStartLineNumber) {
            resultStartLineNumber = otherStartLineNumber;
            resultStartColumn = otherStartColumn;
        } else if (resultStartLineNumber === otherStartLineNumber) {
            resultStartColumn = Math.max(resultStartColumn, otherStartColumn);
        }

        if (resultEndLineNumber > otherEndLineNumber) {
            resultEndLineNumber = otherEndLineNumber;
            resultEndColumn = otherEndColumn;
        } else if (resultEndLineNumber === otherEndLineNumber) {
            resultEndColumn = Math.min(resultEndColumn, otherEndColumn);
        }

        // Check if selection is now empty
        if (resultStartLineNumber > resultEndLineNumber) {
            return null;
        }
        if (resultStartLineNumber === resultEndLineNumber && resultStartColumn > resultEndColumn) {
            return null;
        }
        return new Range(resultStartLineNumber, resultStartColumn, resultEndLineNumber, resultEndColumn);
    }


    public equalsRange(other: IRange | null): boolean {
        return Range.equalsRange(this, other);
    }

    public static equalsRange(a: IRange | null, b: IRange | null): boolean {
        return (
            !!a &&
            !!b &&
            a.startLineNumber === b.startLineNumber &&
            a.startColumn === b.startColumn &&
            a.endLineNumber === b.endLineNumber &&
            a.endColumn === b.endColumn
        );
    }


    public getEndPosition(): Position {
        return Range.getEndPosition(this);
    }

    public static getEndPosition(range: IRange): Position {
        return new Position(range.endLineNumber, range.endColumn);
    }

    public getStartPosition(): Position {
        return Range.getStartPosition(this);
    }

    public static getStartPosition(range: IRange): Position {
        return new Position(range.startLineNumber, range.startColumn);
    }


    public toString(): string {
        return '[' + this.startLineNumber + ',' + this.startColumn + ' -> ' + this.endLineNumber + ',' + this.endColumn + ']';
    }

    /**
     * Create a new range using this range's start position, and using endLineNumber and endColumn as the end position.
     */
    public setEndPosition(endLineNumber: number, endColumn: number): Range {
        return new Range(this.startLineNumber, this.startColumn, endLineNumber, endColumn);
    }

    /**
     * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
     */
    public setStartPosition(startLineNumber: number, startColumn: number): Range {
        return new Range(startLineNumber, startColumn, this.endLineNumber, this.endColumn);
    }

    /**
     * Create a new empty range using this range's start position.
     */
    public collapseToStart(): Range {
        return Range.collapseToStart(this);
    }

    /**
     * Create a new empty range using this range's start position.
     */
    public static collapseToStart(range: IRange): Range {
        return new Range(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn);
    }

    /**
     * Create a new Range with start position and end position
     */

    public static fromPositions(start: IPosition, end: IPosition = start): Range {
        return new Range(start.lineNumber, start.column, end.lineNumber, end.column);
    }

    /**
     * Create a `Range` from an `IRange`.
     */
    public static lift(range: undefined | null): null;
    public static lift(range: IRange): Range;
    public static lift(range: IRange | undefined | null): Range | null {
        if (!range) {
            return null;
        }
        return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    }

    /**
     * Test if `obj` is an `IRange`.
     */
    public static isIRange(obj: any): obj is IRange {
        return (
            obj
            && (typeof obj.startLineNumber === 'number')
            && (typeof obj.startColumn === 'number')
            && (typeof obj.endLineNumber === 'number')
            && (typeof obj.endColumn === 'number')
        );
    }

    /**
     * Test if the two ranges are touching in any way.
     */
    public static areIntersectingOrTouching(a: IRange, b: IRange): boolean {
        // Check if `a` is before `b`
        if (a.endLineNumber < b.startLineNumber || (a.endLineNumber === b.startLineNumber && a.endColumn < b.startColumn)) {
            return false;
        }

        // Check if `b` is before `a`
        if (b.endLineNumber < a.startLineNumber || (b.endLineNumber === a.startLineNumber && b.endColumn < a.startColumn)) {
            return false;
        }

        // These ranges must intersect
        return true;
    }

    /**
     * Test if the two ranges are intersecting. If the ranges are touching it returns true.
     */
    public static areIntersecting(a: IRange, b: IRange): boolean {
        // Check if `a` is before `b`
        if (a.endLineNumber < b.startLineNumber || (a.endLineNumber === b.startLineNumber && a.endColumn <= b.startColumn)) {
            return false;
        }

        // Check if `b` is before `a`
        if (b.endLineNumber < a.startLineNumber || (b.endLineNumber === a.startLineNumber && b.endColumn <= a.startColumn)) {
            return false;
        }

        // These ranges must intersect
        return true;
    }

    /**
     * A function that compares ranges, useful for sorting ranges
     * It will first compare ranges on the startPosition and then on the endPosition
     */
    public static compareRangesUsingStarts(a: IRange | null | undefined, b: IRange | null | undefined): number {
        if (a && b) {
            const aStartLineNumber = a.startLineNumber | 0;
            const bStartLineNumber = b.startLineNumber | 0;

            if (aStartLineNumber === bStartLineNumber) {
                const aStartColumn = a.startColumn | 0;
                const bStartColumn = b.startColumn | 0;

                if (aStartColumn === bStartColumn) {
                    const aEndLineNumber = a.endLineNumber | 0;
                    const bEndLineNumber = b.endLineNumber | 0;

                    if (aEndLineNumber === bEndLineNumber) {
                        const aEndColumn = a.endColumn | 0;
                        const bEndColumn = b.endColumn | 0;
                        return aEndColumn - bEndColumn;
                    }
                    return aEndLineNumber - bEndLineNumber;
                }
                return aStartColumn - bStartColumn;
            }
            return aStartLineNumber - bStartLineNumber;
        }
        const aExists = (a ? 1 : 0);
        const bExists = (b ? 1 : 0);
        return aExists - bExists;
    }

    /**
     * A function that compares ranges, useful for sorting ranges
     * It will first compare ranges on the endPosition and then on the startPosition
     */
    public static compareRangesUsingEnds(a: IRange, b: IRange): number {
        if (a.endLineNumber === b.endLineNumber) {
            if (a.endColumn === b.endColumn) {
                if (a.startLineNumber === b.startLineNumber) {
                    return a.startColumn - b.startColumn;
                }
                return a.startLineNumber - b.startLineNumber;
            }
            return a.endColumn - b.endColumn;
        }
        return a.endLineNumber - b.endLineNumber;
    }


    public spansMultipleLines(): boolean{
        return Range.spansMultipleLines(this);
    }
    /**
     * Test if the range spans multiple lines.
     */
    public static spansMultipleLines(range: IRange): boolean {
        return range.endLineNumber > range.startLineNumber;
    }
}