import {Point} from "../core/point";

export function rmChild(e: HTMLElement): HTMLElement {
  while (e.firstChild != null) {
    e.removeChild(e.firstChild);
  }
  return e;
}

export function fontWidth(ctx: CanvasRenderingContext2D): number {
  const testStr = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm";
  return ctx.measureText(testStr).width / testStr.length;
}

export class ViewPort {
  public constructor(
    readonly sl: number, readonly el: number,
    readonly sc: number, readonly ec: number
  ) {
  }
}

export function evalCanvasLeftTopPoint(dom: HTMLElement): Point {
  let offsetY = 0;
  let offsetX = 0;
  let node: HTMLElement = dom;
  while (node != null) {
    offsetY += node.offsetTop;
    offsetX += node.offsetLeft;
    node = node.offsetParent as HTMLElement;
  }
  return new Point(offsetX, offsetY);
}

export function classTest(cls: string) {
  return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*")
}

export function addClass(node: HTMLElement, cls: string) {
  let current = node.className
  if (!classTest(cls).test(current)) node.className += (current ? " " : "") + cls
}

export let rmClass = function (node: HTMLElement, cls: string) {
  let current = node.className
  let match = classTest(cls).exec(current)
  if (match) {
    let after = current.slice(match.index + match[0].length)
    node.className = current.slice(0, match.index) + (after ? match[1] + after : "")
  }
}

/// 切换到下一个状态
export function switchNext(curr: any, opts: any[]): any {
  if (opts && opts.length > 0) {
    let idx = opts.indexOf(curr);
    return idx > 0 ? opts[(idx + 1) % opts.length] : curr;
  } else {
    return curr;
  }
}

export function setDomPos(dom: HTMLElement, left: number, top: number) {
  dom.style.left = `${left}px`;
  dom.style.top = `${top}px`;
}

export function setDomSize(dom: HTMLElement, w: number, h: number) {
  dom.style.width = `${w}px`;
  dom.style.height = `${h}px`;
}

export function setDomPosAndSize(dom: HTMLElement, left: number, top: number, w: number, h: number) {
  setDomPos(dom, left, top);
  setDomSize(dom, w, h);
}

export function createDom(tag: string, cls: string): any{
  let el = document.createElement(tag);
  el.className = cls;
  return el;
}