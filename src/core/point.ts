/**
 * 点坐标
 * 在html中坐标原点在左上角
 * 向右为x坐标
 * 向下为y坐标
 */
export class Point {

  public readonly x: number;
  public readonly y: number;
  static base: Point = new Point(0, 0);

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public equals(point: Point): boolean {
    return ((this.x === point.x) && (this.y === point.y));
  }

  public toString(): string{
    return `Point(${this.x}, ${this.y})`;
  }

  /**
   * 平移变换
   * @param dx
   * @param dy
   */
  public transform(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  /**
   * 如果以(newx, newy)作为新的坐标原点，计算新的坐标
   * @param newx
   * @param newy
   */
  public originTransform(newx: number, newy: number): Point{
    return new Point(this.x-newx, this.y-newy);
  }

  public tuple(): [number, number]{
    return [this.x, this.y];
  }
}