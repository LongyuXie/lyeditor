import {TextBuffer} from "../text/textBuffer";
import {Cursor} from "../text/cursor";
import {EditorLayout} from "./editorLayout";
import {ViewState} from "./viewState";
import {CursorView} from "./cursorView";
import {SelectionView} from "./selectionView";
import {TextView} from "./textView";
import {Scrollbar} from "../scrollbar";
import {Point} from "../core/point";
import {Position} from "../core/position";
import {Rectangle} from "../core/rectangle";
import {rmChild, setDomPos, setDomPosAndSize, ViewPort} from "../utils/dom";
import {IEventListener} from "../utils/event";
import {ViewModel} from "./viewModel";
import {normalize} from "../utils/number";

export interface UpdateOpts{
  cursor: boolean;
  text: boolean;
  selection: boolean;
}

/**
 * 用于绘制编辑器视图, 包括四个部分
 * - 光标
 * - 文本视图
 * - 滚动条
 * - 选择区域
 */
export class EditorView extends IEventListener{
  get viewModel(): ViewModel {
    return this._viewModel;
  }
  get state(): ViewState {
    return this._state;
  }
  get layout(): EditorLayout {
    return this._layout;
  }
  private readonly _layout: EditorLayout;
  private readonly buffer: TextBuffer;
  private readonly cursor: Cursor;
  private readonly _state: ViewState;

  private cursorView: CursorView;
  private selectionView: SelectionView;
  private textView: TextView;

  private vscrollbar!: Scrollbar;
  private hscrollbar!: Scrollbar;


  get paddingLeft(): number {
    return this.state.paddingLeft;
  }
  get paddingTop(): number {
    return this.state.paddingTop;
  }

  get scrollLeft(): number{
    return 0;
  }
  get scrollTop(): number{
    return this.vscrollbar.scrollTop;
  }

  get scrollHeight(): number{
    return this.vscrollbar.scrollHeight;
  }

  /**
   * 滚动的高度要求: 视图区域内至少有一行显示
   */
  public ensureScrollHeight(): number{
    return (this.buffer.lines-1) * this.state.lineH + this.height;
  }

  private readonly container: HTMLDivElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly _viewModel: ViewModel;

  constructor(container: HTMLDivElement, buffer: TextBuffer, cursor: Cursor, opts: any) {
    super();
    this.container = container;
    this._layout = new EditorLayout();
    rmChild(this.container);
    this.container.appendChild(this._layout.root);
    this._layout.resize(opts.canvasWidth, opts.canvasHeight);
    this.context = this._layout.canvas.getContext('2d')!!;
    this.context.font = `${opts.fontsize}px ${opts.fontFamily}`;

    this._state = new ViewState(this.context, opts);
    this.buffer = buffer;
    this.cursor = cursor;

    this._viewModel = new ViewModel(this.buffer, this);

    this.textView = new TextView(this.buffer);
    this.cursorView = new CursorView(this, this.cursor);
    this.selectionView = new SelectionView(this, this.cursor);

    this.initScrollbar();

    this.registerEvents();
  }

  public scrollToView(){
    let ln = this.cursor.position.lineNumber;
    this.scrollTo(ln);
  }


  private initScrollbar() {
    this.vscrollbar = new Scrollbar();
    this.hscrollbar = new Scrollbar();
    this.layout.root.appendChild(this.vscrollbar.dom());

    this.vscrollbar.setScrollbarPos(this._state.cWidth, 0);
    this.vscrollbar.init(15, this._state.cHeight, this._state.cHeight, this.scrollHeight)

    this.addListener(this.vscrollbar, 'scroll', (top: number) => {
      this.update();
      this.updateCursor();
      this.updateSelection();
    })
  }

  public update(){
    this.context.beginPath();
    this.context.clearRect(0, 0, this._state.cWidth, this._state.cHeight);
    this.drawText();
  }
  public updateCursor(){
    this.cursorView.update();
  }

  private drawText(): void{
    let sl = Math.floor(this.scrollTop / this._state.lineH);
    let sc = Math.floor(this.scrollLeft / this._state.fontW);
    let top = sl * this._state.lineH - this.scrollTop + this._state.paddingTop + this._state.lineH * 0.8;
    let left = this._state.paddingLeft;
    let el = Math.ceil((this.scrollTop + this._state.cHeight) / this._state.lineH);
    let vp: ViewPort = new ViewPort(sl, el, sc, sc + this._state.columns);
    // console.log(vp);
    this.textView.drawText(this.context, new Point(left, top), this._state.lineH, vp);
  }

  public scrollToLine(ln: number): void{
    // if(this.buffer.isValidLineNumber(ln)){
    //   console.log("scroll to line");
      this.scrollTo(ln*this.lineH);
    // }
  }

  public updateScrollbar(){
    this.vscrollbar.updateScrollbar(this.scrollTop, this.ensureScrollHeight());
  }

  scrollTo(top: number) {
    this.vscrollbar.updateScrollbar(top, this.ensureScrollHeight());
  }

  private registerEvents() {

  }

  public get lineH(): number { return this.state.lineH; }
  public get fontW(): number { return this.state.fontW; }
  public get width(): number { return this.state.eWidth; }
  public get height(): number { return this.state.eHeight;}


  positionToCanvasPoint(p: Position): Point{
    // console.log(p);
    return this.viewModel.bufferPositionToCanvasPoint(p);
  }

  clientRect(): Rectangle{
    return new Rectangle(this.state.paddingLeft, this.state.paddingTop, this.width, this.height);
  }

  blur() {
    this.state.focused = false;
    this.cursorView.update();
  }

  focus() {
    this.state.focused = true;
    this.moveTextAreaToCursor();
    this.cursorView.update();
  }

  updateSelection() {
    this.selectionView.update();
  }

  get firstFullyVisibleLine(): number{
    let l = this.firstVisibleLine;
    if(l * this.lineH < this.scrollTop){
      return l+1;
    }
    return l;
  }
  get firstVisibleLine(): number{
    return Math.floor(this.scrollTop / this.lineH);
  }
  get lastVisibleLine(): number{
    return Math.floor((this.scrollTop + this.height) / this.lineH);
  }
  get lastFullyVisibleLine(): number{
    let l = this.lastVisibleLine;
    if((l+1) * this.lineH > this.scrollTop + this.height){
      return l-1;
    }
    return l;
  }
  moveTextAreaToCursor(){
    let position = this.cursor.position;
    let point = this.viewModel.bufferPositionToCanvasPoint(position).transform(0, this.lineH);
    setDomPos(this.layout.textarea, point.x, point.y);
  }

  /**
   * 滚动视图, 使得最后一行是目标行, 而且完全显示
   * @param ln
   */
  scrollToLastLine(ln: number){
    // 计算scrollTop坐标, 如果ln作为最后一行时, top超过了指定的范围则无法进行滚动
    let top = (ln + 1) * this.lineH - this.height;
    if(top < 0 || top > (this.buffer.lines-1) * this.lineH){
      return;
    }
    this.scrollTo(top);

  }

  scrollToCursor(){
    let p = this.cursor.position;
    if(p.lineNumber < this.firstFullyVisibleLine){
      this.scrollToLine(p.lineNumber);
    }else if(p.lineNumber > this.lastFullyVisibleLine){
      this.scrollToLastLine(p.lineNumber);
    }
  }

  canScrollDown(){
    return this.scrollTop < this.scrollHeight - this.height;
  }
  canScrollUp(){
    return this.scrollTop > 0;
  }

  /**
   * 向上或者向下滚动1一行
   * @param direction
   */
  scrollOneLine(direction: string){
    let l = this.firstFullyVisibleLine;
    if(direction === "up"){
      if(!this.canScrollUp()){
        return;
      }
      this.scrollToLine(l-1);

    } else if(direction === "down"){
      if(!this.canScrollDown()){
        return;
      }
      this.scrollToLine(l+1);
    }
  }

}