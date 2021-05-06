/**
 * 对于整个textarea, 我们需要控制哪些行为, 或者说编辑器想要怎样的输入过程?
 *
 */
import {e_stop, IEventListener} from "../utils/event";
import {CommandKeyHandler} from "./commandKeyHandler";
/*
* Ctrl-c : "copy"
* Ctrl-v : "paste"
* Ctrl-x : "cut"
* Ctrl-z : "undo"
* Ctrl-y : "redo"
* Ctrl-a : "selectAll"
* Left   : "moveLeft"
* Right  : "moveRight"
* Down   : "moveDown"
* Up     : "moveUp"
* Home   : "moveLineStart"
* End    : "moveLineEnd"
* Backspace : "deleteLeft"
* Delete  : "deleteRight"
*/
export const defaultKeymap = new Map<string, string>(
  [
    ["ctrl-z", "undo"],
    ["ctrl-y", "redo"],
    ["ctrl-c", "copy"],
    // ["ctrl-v", "paste"],
    ["ctrl-x", "cut"],
    ["ctrl-a", "selectAll"],
    ["ArrowLeft", "moveLeft"],
    ["ArrowRight", "moveRight"],
    ["ArrowDown", "moveDown"],
    ["ArrowUp", "moveUp"],
    ["Home", "moveLineStart"],
    ["End", "moveLineEnd"],
    ["Backspace", "deleteLeft"],
    ["Delete", "deleteRight"],
    ["Enter", "addNewLine"]
  ],
)

export class TextInput extends IEventListener {
  constructor(
    private textarea: HTMLTextAreaElement,
    private commandKeyHandler: CommandKeyHandler
  ) {
    super();

    this.textarea.addEventListener('focus', ev => {
      if (!this._ignoreFocusEvents) {
        this._isFocused = true;
        this.signal("focus");
        this.resetSelection();
      }
    })
    this.textarea.addEventListener('blur', ev => {
      if (!this._ignoreFocusEvents) {
        this._isFocused = false;
        this.signal("blur");
      }
    })

    this.textarea.addEventListener('keydown', this._handleKeydown.bind(this));
    this.textarea.addEventListener('paste', (e) => {
      this.textarea.value = "";
      // console.log(e.clipboardData!!.getData("text/plain"));
      this.signal("paste", e.clipboardData!!.getData("text/plain"));
    })
  }

  private _isFocused = false;

  get isFocused(): boolean {
    return this._isFocused;
  }

  // tempStyle = "";
  private _ignoreFocusEvents = false;


  get ignoreFocusEvents(): boolean {
    return this._ignoreFocusEvents;
  }


  set ignoreFocusEvents(value: boolean) {
    this._ignoreFocusEvents = value;
  }

  public allowedInput(key: string): boolean {
    let lowerLetters = "abcdefghijklmnopqrstuvwxyz";
    let upperLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let letters = lowerLetters + upperLetters;
    let numbers = "1234567890";
    let separators = "/~`!@#$%^&*()_+[]\\.,<>?;:'\"|{}=- ";

    return key.length == 1 &&
      (letters.indexOf(key) != -1
        || numbers.indexOf(key) != -1
        || separators.indexOf(key) != -1);
  }

  private focus() {
    this.textarea.focus();
  }

  private blur() {
    this.textarea.blur();
  }

  private resetSelection() {
    console.log("reset selection");
  }

  private isSingleKey(key: string){
    let set = new Set(
      [
        "Enter", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "Escape"
      ]
    );
    // console.log(set);
    return set.has(key);
  }

  private _handleKeydown(ev: KeyboardEvent): void {
    // e_stop(ev);
    // console.log(ev);

    let ret = this.commandKeyHandler.normalizeKeyName(ev);

    // 通过textarea获取剪切板的数据, 因此需要特殊处理, 而且也无法修改按键绑定
    // chrome不支持使用document.execCommand("paste")获取剪切板数据
    if(ret.keyname === "ctrl-v"){
      return;
    }
    if(ev.key === "Tab"){
      e_stop(ev);
      return;
    }

    if(ret.hasModifier || this.isSingleKey(ret.keyname)){
      // console.log("command key");
      let name = ret.keyname;
      // console.log(`name = ${name}`);
      if(this.commandKeyHandler.hasKeyBind(name)){
        // console.log("has bind");
        e_stop(ev);
        this.commandKeyHandler.callCommandKeyHandler(name);
        return;
      }
    }

    if(this.allowedInput(ev.key)){
      this.signal("input", {type: "insert", text: ev.key});
      return;
    }

    console.log("keydown: " + ev.key);
    // this.signal("keydown", ev);
  }
}