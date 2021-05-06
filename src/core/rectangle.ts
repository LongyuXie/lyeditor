/**
 *  矩形类
 *  坐标系为
 *  0 --------- x
 *  |
 *  |
 *  |
 *  y
 */
import {Point} from "./point";

export interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Rectangle {
  public static readonly EmptyRect = new Rectangle(0, 0, 0, 0);
  public readonly left: number;
  public readonly top: number;
  public readonly width: number;
  public readonly height: number;

  constructor(left: number, top: number, width: number, height: number) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }

  public static merge(r1: Rectangle, r2: Rectangle): Rectangle {
    const x1 = Math.min(r1.left, r2.left);
    const y1 = Math.min(r1.top, r2.top);
    const x2 = Math.max(r1.left + r1.width, r1.left + r2.width);
    const y2 = Math.max(r1.top + r1.height, r2.top + r2.height);
    return new Rectangle(x1, y1, x2 - x1, y2 - y1);
  }

  public static equal(r1: Rectangle, r2: Rectangle) {
    return r1.left == r2.left
      && r1.top == r2.top
      && r1.width == r2.width
      && r2.height == r2.height
  }

  // TODO: quick merge
  public static mergeRects(rects: Rectangle[]): Rectangle {
    if (rects.length == 0) {
      return Rectangle.EmptyRect;
    }
    let clipRect = rects[0];
    for (let i = 1; i < rects.length; i++) {
      clipRect = clipRect.merge(rects[i]);
    }
    return clipRect;
  }

  public static isEmpty(rect: Rectangle): boolean {
    return rect.width == 0 || rect.height == 0;
  }

  public topLeft(): Point {
    return new Point(this.left, this.top);
  }

  public rightBottom(): Point {
    return new Point(this.left + this.width, this.top + this.height);
  }

  public containsPoint(p: Point): boolean {
    return p.x >= this.left && p.x <= this.width + this.left
        && p.y >= this.top && p.y <= this.height + this.top;
  }

  static readonly empty: Rectangle = new Rectangle(0, 0, 0, 0);

  /**
   * 合并两个矩形，规则
   * 返回的矩形的坐标为
   * 左上角的交叉点
   * 右下角的交叉点
   * @param rectangle
   */
  public merge(rectangle: Rectangle): Rectangle {
    return Rectangle.merge(this, rectangle);
  }

  public equal(rect: Rectangle): boolean {
    return Rectangle.equal(this, rect);
  }

  public isEmpty(): boolean {
    return Rectangle.isEmpty(this);
  }

  public toString(): string {
    return `Rectangle(${this.left}, ${this.top}, ${this.width}, ${this.height})`;
  }

  /**
   * 两个边平行于坐标轴的矩形是否相交
   * 如果两个矩形相交，那么矩形A, B的中心点和矩形的边长是有一定关系的。
   * @param r1
   */
  areIntersecting(r1: Rectangle) {
    return Rectangle.areIntersecting(this, r1);
  }
  public static areIntersecting(r1: Rectangle, r2: Rectangle): boolean{
    if(r1.isEmpty() || r2.isEmpty()){
      return true;
    }
    let x = r1.width + r2.width;
    let y = r1.height + r2.height;
    let zx = Math.abs(r1.left + r1.rightBottom().x - r2.left - r2.rightBottom().x);
    let zy = Math.abs(r1.top + r1.rightBottom().y - r2.top - r2.rightBottom().y);
    return zx <= x && zy <= y;
  }
}
