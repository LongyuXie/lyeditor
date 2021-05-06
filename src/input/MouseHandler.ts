/**
 * 鼠标在编辑器中的行为
 * - 点击行为(无论是哪个按键) -> 光标定位
 * - 左键点击两次 -> 选中光标附近的单词
 * - 左键点击三次 -> 选中光标所在的行
 * - 右键点击 -> 弹出上下文菜单
 * - 按下左键后移动鼠标 -> 选中文本区域
 * - 其他按键无法选择文本
 * - 中键滚动 -> 视图滚动
 */
import {EditorView} from "../view/editorView";
import {EditModel} from "../text/editModel";
import {Point} from "../core/point";
import {ViewModel} from "../view/viewModel";
import {evalCanvasLeftTopPoint} from "../utils/dom";
import {e_stop} from "../utils/event";

export class MouseHandler{

  private dom: HTMLElement;
  private viewModel: ViewModel;

  constructor(
    private view: EditorView,
    private cm: EditModel
  ) {
    this.dom = view.layout.background;
    this.viewModel = view.viewModel;

    this.dom.ondragstart = (e) => { e_stop(e); }
    this.dom.addEventListener("wheel", this.onWheel);
    this.dom.addEventListener("mousedown", this.onMouseDown);
    this.dom.addEventListener("click", this.onClick);
  }

  onWheel = (ev: any) => {
    let dir = ev.wheelDelta > 0 ? "up" : "down";
    this.view.scrollOneLine(dir);
  }

  private locateNearPoint(p: Point){
    let pos = this.viewModel.canvasPointToValidatePosition(p);
    this.cm.locate(pos);
  }

  private canvasPoint!: Point;

  private onClick = (ev: MouseEvent) => {
    if(ev.button != 0){
      return;
    }
    if(ev.detail == 2){
      this.cm.selectWord();
    }else if(ev.detail == 3){
      this.cm.selectCurrentLine()
    }
  }


  private onMouseDown = (ev: MouseEvent) => {
    // 当我们点击div时会切换输入焦点，如果直接focus
    // 在处理完mousedown事件时将会失去焦点
    setTimeout(() => {
      // 在获取输入焦点后，需要对textarea重新定位，而且在移动光标后textarea也要跟着移动
      this.view.layout.textarea.focus();
    })

    let p = new Point(ev.offsetX, ev.offsetY);
    this.locateNearPoint(p);
    let selCapture = true;
    this.canvasPoint = evalCanvasLeftTopPoint(this.view.layout.canvas);

    if(ev.button != 0){
      return;
    }

    let handleMouseMove = (e: MouseEvent) => {
      if(selCapture){
        let p = new Point(e.pageX-this.canvasPoint.x, e.pageY-this.canvasPoint.y);
        let pos = this.view.viewModel.canvasPointToValidatePosition(p);
        this.cm.selectTo(pos);
      }
    }
    let handleMouseUp = (e: MouseEvent) => {
      if(selCapture){
        selCapture = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

}