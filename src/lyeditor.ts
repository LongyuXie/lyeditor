import {TextBuffer} from "./text/textBuffer";
import {Position} from "./core/position";
import {Point} from "./core/point";
import {EditorLayout} from "./view/editorLayout";
import {Direction, EditModel} from "./text/editModel";
import {Cursor} from "./text/cursor";
import {TextChange} from "./text/textChange";
import {EditorOptions, ViewState} from "./view/viewState";
import {EditorView} from "./view/editorView";
import {Range} from "./core/range";
import {IEventListener} from "./utils/event";
import {defaultKeymap, TextInput} from "./input/TextInput";
import {MouseHandler} from "./input/MouseHandler";
import {CommandService} from "./CommandService";
import {KeyBind} from "./input/keymap";
import {CommandKeyHandler} from "./input/commandKeyHandler";
import {UndoService} from "./history/UndoService";
import {SuggestController} from "./suggest/suggestController";
import {SuggestWidget} from "./suggest/suggestWidget";
import {isSingleLetter, splitRegex} from "./utils/char";


export class LyEditor extends IEventListener {
  private commandKeyHandler: CommandKeyHandler;
  private readonly _buffer: TextBuffer;
  private readonly _cursor: Cursor;
  //
  private state: ViewState;
  //
  private readonly cm: EditModel;

  // 需要明确的问题是: 什么时候重绘编辑窗口?
  // 1. 缓冲区改变
  // 2. 光标或者选择区域改变
  // 3. 通过滚动条改变显示窗口
  private _opts!: EditorOptions;
  // 完成一个简单的需求: 当行的数量超过边界时, 显示滚动条(确定位置和长度)
  /**
   * 滚动条的位置
   * scrollLeft表示横向滚动条移动的距离（像素）
   * scrollTop表示纵向滚动条移动的距离（像素）
   * 需要考虑的两个问题
   * （1）什么时候出现滚动条
   * 一个简单的回答是当最长行的文本长度超过了编辑器窗口宽度时
   * 这里就存在一个问题，如何计算最长行的文本长度？每一次编辑都需要重新计算，是否会存在资源的浪费
   * 当然在实现的初期，可以使用比较简单的算法：在每一个textchange事件后更新最长行
   * （2）使用滚动条后如何计算坐标位置
   * 这里的滚动条位置是原始坐标系，也就是编辑窗口左上角为原点的坐标系中的位置
   * 我们需要计算的是，以滚动条位置作为新的原点建立坐标系，要填满整个窗口需要输出哪些行和列
   * 在输出的时候使用的是新的坐标系
   * 此时光标的位置计算需要考虑这个滚动条的位置
   *
   *
   * 滚动条移动的像素不总是与窗口的行列大小成正比的，而是可能存在间隙，我们需要绘制这些间隙
   * 也就是不完整的一行，和不完整的列
   * 首先可以不考虑列的长度，对于列我们总是从坐标为0的点开始绘制
   *
   *
   *
   * 但是对于行，我们需要考虑的是等待绘制的第一行的标号
   */

  private view: EditorView;
  // private ignoreEol: boolean = true;
  private layout: EditorLayout;
  private input: TextInput;
  private mouseHandler: MouseHandler;
  private _keybind: KeyBind;
  private history: UndoService;
  private suggestController: SuggestController;

  /**
   * 创建编辑器并且将对应的dom挂载到目标下
   * @param id 需要挂载编辑器的容器id
   * @param opts
   */
  constructor(id: string, opts?: {}) {
    super();
    console.log("ly editor constructor");
    const container = document.getElementById(id) as HTMLDivElement;
    if (container == undefined) {
      throw new Error(`could not get element by id: ${id}`);
    }
    this._updateOptions(opts);
    //
    //
    this._buffer = new TextBuffer();
    this._cursor = new Cursor();

    this.view = new EditorView(container, this._buffer, this._cursor, this._opts);
    this.layout = this.view.layout;
    this.cm = new EditModel(this._buffer, this._cursor);
    this.state = this.view.state;

    this._commandService = new CommandService();
    this._keybind = new KeyBind(defaultKeymap);
    this.commandKeyHandler = new CommandKeyHandler(this._keybind, this.commandService);
    this.input = new TextInput(this.layout.textarea, this.commandKeyHandler);
    this.mouseHandler = new MouseHandler(this.view, this.cm);

    this.history = new UndoService(this.cm);
    let suggestWidget = new SuggestWidget();
    this.layout.root.appendChild(suggestWidget.domNode.domNode);
    this.suggestController = new SuggestController(suggestWidget, this);


    this.registerDefaultCommands();
    this.registerEvents();
    this.test01();
  }

  private _commandService: CommandService;

  get commandService(): CommandService {
    return this._commandService;
  }

  // 不支持直接操作buffer, 必须通过cursor进行定位, 然后编辑
  public insert(text: string) {
    this.cm.insert(text);
  }

  public replace(text: string) {
    this.cm.replace(text);
  }

  public delete() {
    this.cm.delete();
  }

  public append(text: string) {
    this.cm.append(text);
  }

  public appendLine(text: string) {
    this.cm.appendLine(text);
  }

  focus(): void {
    this.layout.textarea.focus();
  }

  blur(): void {
    this.layout.textarea.blur();
  }

  bind(key: string, cm: string) {
    this._keybind.bind(key, cm);
  }

  unbind(key: string, restore = true) {
    this._keybind.unBind(key, restore);
  }

  getPrefixText(): string {
    let pos = this._cursor.position;
    if (this._buffer.atLineStart(pos)) {
      return "";
    }
    let line = this._buffer.lineString(pos.lineNumber);
    let idx = pos.column - 1;
    while (idx >= 0) {
      if (!isSingleLetter(line[idx])) {
        break;
      }
      idx--;
    }
    let prefix = line.slice(idx + 1, pos.column);
    console.log(`prefix = ${prefix}`);
    return prefix;
  }

  getCursorPoint(top = true): Point {
    let p = this.view.viewModel.bufferPositionToCanvasPoint(this._cursor.position);
    if (top) return p;
    return p.transform(0, this.view.lineH);
  }

  private _updateOptions(opts?: {}) {
    this._useDefault();
  }

  private _useDefault() {
    this._opts = {
      canvasWidth: 600,
      canvasHeight: 400,
      fontFamily: "Source Code Pro",
      fontsize: 16,
      paddingLeft: 4,
      paddingTop: 0,
    }
  }

  private test01() {
    // 测试用，首先输出这段文本
    for (let i = 0; i < 10; i++) {
      this.cm.appendLine(`number ${i}: hello, world! xielongyu.`);
    }
  }

  private onTextChange = (change: TextChange, source: string = "type") => {
    // console.log("source: " + source);
    if (source == "redo") {
      // console.log("undoService: ", "undoing");
    } else if (source == "undo") {
      // console.log("undoService: ", "redoing");
    } else {
      this.history.commit(change);
    }

    this.updateTokens(change);

    /// 需要考虑更加仔细的更新策略, 而不是简单修改滑块的高度
    if (change.newRange.spansMultipleLines() || change.oldRange.spansMultipleLines()) {
      this.view.updateScrollbar();
    }
    this.view.update();
  }

  private onCursorLocate = (prev: Point, p: Position) => {
    this.view.scrollToCursor();
    this.view.updateCursor();
    this.signal("cursorLocate", prev, p);
  }

  private onSelectionChange = (prev: Range, curr: Range, scrollToView: boolean) => {
    if (scrollToView) {
      this.view.scrollToCursor();
    }
    this.view.updateCursor();
    this.view.updateSelection();
  }

  private onFocus = () => {
    this.view.focus();
  }

  private onBlur = () => {
    this.view.blur();
  }

  private onInput = (data: any) => {
    if (data.type === "insert") {
      // console.log(`text: ${data.text}`);
      this.cm.insert(data.text);
    }
    // }else if(data.type === "deleteBack"){
    //   this.cm.delete();
    // }else if(data.type === "deleteForward"){
    //   this.cm.delete('forward');
    // }
  }

  private registerEvents() {

    this.addListener(this.cm, "textChange", this.onTextChange);
    this.addListener(this.cm, "cursorLocate", this.onCursorLocate);

    this.addListener(this.cm, 'selectionChange', this.onSelectionChange);
    this.addListener(this.input, "focus", this.onFocus);
    this.addListener(this.input, "blur", this.onFocus);
    this.addListener(this.input, "input", this.onInput);
    this.addListener(this.input, "paste", this.onPaste);


  }

  private registerDefaultCommands() {
    this.commandService.add("redo", this.redo.bind(this));
    this.commandService.add("undo", this.undo.bind(this));
    this.commandService.add("copy", this.copy.bind(this));
    this.commandService.add("cut", this.cut.bind(this));
    // this.commandService.add("paste", this.paste.bind(this));
    this.commandService.add("selectAll", this.cm.selectAll.bind(this.cm));
    this.commandService.add("moveLeft", this.cm.moveCursor.bind(this.cm, Direction.Left));
    this.commandService.add("moveRight", this.cm.moveCursor.bind(this.cm, Direction.Right));
    this.commandService.add("moveDown", this.cm.moveCursor.bind(this.cm, Direction.Down));
    this.commandService.add("moveUp", this.cm.moveCursor.bind(this.cm, Direction.Up));
    this.commandService.add("moveLineStart", () => {
      let ln = this._cursor.position.lineNumber;
      this.cm.locate(new Position(ln, 0));
    });
    this.commandService.add("moveLineEnd", () => {
      let ln = this._cursor.position.lineNumber;
      this.cm.locate(new Position(ln, this._buffer.lineLength(ln)));
    });
    this.commandService.add("addNewLine", () => {
      console.log("add new line");
      this.insert(this._buffer.eof)
    })
    this.commandService.add("deleteLeft", this.cm.delete.bind(this.cm));
    this.commandService.add("deleteRight", this.cm.delete.bind(this.cm, "forward"))

  }

  private redo() {
    console.log("redo");
    this.history.redo();

  }

  private undo() {
    console.log("undo");
    this.history.undo();
  }

  private copy() {
    let handler = (event: any) => {
      let text = this.cm.getCopyText();
      // console.log(text);
      if (text.length == 0) {
        return;
      }
      event.clipboardData.setData("text/plain", text);
      event.preventDefault();
    };
    window.addEventListener("copy", handler);
    document.execCommand("copy");
    window.removeEventListener("copy", handler);
  }

  private cut() {
    let handler = (event: any) => {
      let text = this.cm.getCopyText();
      // console.log(text);
      if (text.length == 0) {
        return;
      }
      event.clipboardData.setData("text/plain", text);
      this.cm.selectCurrentLine();
      this.cm.delete();
      event.preventDefault();
    };
    window.addEventListener("cut", handler);
    document.execCommand("cut");
    window.removeEventListener("cut", handler);
  }

  /**
   * 网页不支持直接获取剪切板的数据, 除非用户确定使用
   * Ctrl-V快捷键获取或者使用上下文菜单, 那么就只能检测textarea的paste事件
   */
  private onPaste = (text: string) => {
    this.cm.insert(text);
  }

  /**
   * 从键盘输入一个单词的情况下, 可以考虑发送一个消息
   * 如果修改一个已经存在的单词,
   * 无论如何都需要都是需要插入分隔符, 比如空格, 引号...其他的符号
   * 当输入一个这样的符号时就考虑, 在分隔符之前或者之后的单词
   * 一个问题在于如何删除已经存在的单词.
   * 如果我删除一片缓冲区域的文本, 那么这片区域内的所有单词都需要从词库中删除
   * 而且可能存在残缺的单词, 残缺的单词只需要考虑边界处是否存在单词即可.
   * 同样地对于插入部分, 可以从整行考虑, 不需要考虑残缺的单词.
   * 从键盘输入的部分, 可能需要通过分隔符来判断
   */
  /**
   * 一个最笨的方法是删除所有的缓冲区内的单词, 然后重新分析整个文档
   * @param change
   * @private
   */
  private updateTokens(change: TextChange) {
    /**
     * 对于插入单个字符的情况
     * - 如果输入分隔符, 那么考虑分隔符之前是否存在单词
     * - 如果没有输入新的字符, 光标移动到另一个位置的情况, 也许要将输入的单词插入到字典中
     * - 如果在单词中插入分隔符时, 一个单词会变成两个单词
     * 对于删除单个字符的情况
     * - 如果删除的是单词的构成部分: 字母, 数字, 那么检查当前位置是否存在单词
     * - 删除单词中的分隔符时, 两个单词会合并成一个单词
     *
     * 如果是多个字符或者多行文本时, 应该如何处理呢?
     * 那么首先获取受到影响的行的文本, 然后分析出删除的单词, 和需要添加的单词
     *
     * 而是考虑行的状态
     * 对于单纯的插入操作, oldRange必然为空
     * 对于单纯的删除操作, oldRange必然不为空
     *
     */
    // console.log("hello, world");

    return;
    console.log(change);
    let st = change.newRange.getStartPosition();
    let ed = change.newRange.getEndPosition();
    let firstLine = this._buffer.lineString(st.lineNumber).slice(0, st.column);
    let lastLine = this._buffer.lineString(ed.lineNumber).slice(ed.column);
    let text = firstLine + change.newText + lastLine;
    let oldText = firstLine + change.oldText + lastLine;
    console.log("text = " + text);
    console.log("old text = " + oldText);
    /**
     * TODO: 当前输入的不完整的单词也会作为补全资源显示在补全列表中.
     * TODO: 由于是实时检测缓冲区的变化, 消耗的资源比较多, 存在严重的性能问题.
     * TODO: 也许并不需要完全处理行, 而是考虑前后两个分界处是否存在单词.
     */
    let s1 = getWordByLine(text);
    let s2 = getWordByLine(oldText);
    s1.forEach((value) => {
      if (s2.has(value)) {
        s2.delete(value)
        s1.delete(value);
      }
    })
    console.log(s1);
    console.log(s2);
    /**
     * TODO: 删除单词时, 在其他没有被编辑操作影响的行中可能存在该单词
     * 如果只是移除之前的写入的部分单词, 那么还需要考虑已经在缓冲区中的单词.
     * 并不是说, 我编辑时删除了这个单词, 就在字典树中删除这个单词, 因为该单词可能在其他的区域出现
     */
    this.suggestController.updateLocalSource(Array.from(s1), Array.from(s2));
  }

}


export function getWordByLine(text: string): Set<string> {
  return new Set(text.split(splitRegex).filter(value => {
    return value.length >= 2
  }));
}