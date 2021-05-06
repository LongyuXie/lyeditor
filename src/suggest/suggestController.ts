import { SuggestWidget} from "./suggestWidget";
import { createTrieFromStringList, Trie } from "./trie";
import {LyEditor} from "../lyeditor";
import {IEventListener} from "../utils/event";

export const keywords = [
  "this",
  "while",
  "export",
  "function",
  "class",
  "let",
  "var",
  "if",
  "else",
  "switch",
  "throw",
  "case",
  "catch",
  "break",
  "continue",
  "default",
  "boolean",
  "string",
  "private",
  "public",
  "interface",
  "protected",
  "abstract",
  "constructor",
  "enum",
  "extends",
  "implements",
  "static",
  "for",
];

// 当出现了suggestwidget时，我们需要重新绑定按键映射？
// TextAreaHnadler与commandService的关系太过紧密了
// 所有的按键映射是硬编码，这样的话只能在命令里面修改了！！！
// 需要对按键的绑定进行重构
// 上箭头选择上一个
// 下箭头选择下一个
// Tab键表示选中
export class SuggestController extends IEventListener{
  private widget: SuggestWidget;
  private trie: Trie;

  private _isActive: boolean = false;
  public get isActive(): boolean {
    return this._isActive;
  }
  private _prefix = "";

  private editor: LyEditor;

  public constructor(widget: SuggestWidget, editor: LyEditor) {
    super();
    this.widget = widget;
    this.editor = editor;
    this.trie = createTrieFromStringList(keywords);

    this.registerCommands();

  }
  public inactive() {
    if (this.isActive) {
      this.widget.hide();
      this._isActive = false;
      this.editor.unbind("Esc");
      this.editor.unbind("ArrowUp");
      this.editor.unbind("ArrowDown");
      this.editor.unbind("Enter" );
    }
  }
  public setCoordinate(left: number, top: number) {
    this.widget.setCoordinate(left, top);
  }
  public active(prefix: string) {


    this._prefix = prefix;
    console.log(this.trie.containsPrefix(this._prefix));
    let items = this.trie.startWith(prefix);

    if (!items) {
      return;
    }
    console.log(items);
    if(items.length == 0){
      return;
    }

    let [left, top] = this.editor.getCursorPoint(false).tuple();
    this.widget.setCoordinate(left, top);
    this.widget.updateView(items);
    this.widget.show();
    this._isActive = true;

    this.editor.bind("Escape", "suggest-inactive");
    this.editor.bind("ArrowUp", "suggest-selectPrev");
    this.editor.bind("ArrowDown", "suggest-selectNext");
    this.editor.bind("Enter", "suggest-complete");
  }

  onPrefixChange(prefix: string){
    if(prefix == ""){
      this.inactive();
    }
    let items = this.trie.startWith(prefix);
    console.log(items);
    if (!items || items.length === 0) {
      return;
    }

  }

  public complete(): void {
    if (this.isActive) {
      let text = this.widget.getCurrentText();
      text = text.slice(this._prefix.length);
      this.signal("suggest", text);
      console.log("suggest: ", `suffix = ${this._prefix}`);
      console.log("suggest: ", `text = ${text}`)
      this.inactive();
    }
  }

  private registerCommands() {
    this.editor.commandService.add("suggest-selectNext", () => {
      if(this.isActive){
        this.widget.selectNext();
      }

    })
    this.editor.commandService.add("suggest-selectPrev", () => {
      if(this.isActive){
        this.widget.selectPrevious();
      }
    })
    this.editor.commandService.add("suggest-inactive", () => {
      console.log("esc");
      if(this.isActive){
        this.inactive();
      }
    })
    this.addListener(this, "suggest", (text: string) => {
      this.editor.insert(text);
    })
    this.addListener(this.editor, "cursorLocate", () => {
      this.inactive();
    })
    this.editor.commandService.add("suggest-active", () => {
      console.log("hello");
      console.log(this.isActive);
      if(this.isActive){
        return;
      }
      let text = this.editor.getPrefixText();
      console.log(text);
      this.active(text);
    })
    this.editor.commandService.add("suggest-complete", () => {
      console.log("complete");
      this.complete();
    })
    this.editor.bind("ctrl-k", "suggest-active");

  }

  updateLocalSource(insert: string[], removed: string[]) {
    removed.forEach(value =>
      {
        this.trie.delete(value);
      }
    )
    insert.forEach(value => {
      this.trie.add(value);
    })

  }
}
