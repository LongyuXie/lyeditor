import {keyNames} from "./Keyname";
import get = Reflect.get;

export function isModifierKey(value: any) {
  // @ts-ignore
  let name = typeof value == "string" ? value : keyNames[value.keyCode]
  return name === "Ctrl" || name === "Alt" || name === "Shift" || name === "Mod"
}

/**
 * 编辑器中默认的按键绑定?
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
 *
 */
export class KeyBind{
  /// 按键映射 keyName -> commandName, 并不是直接和函数进行绑定
  private defaultKeyBind: Map<string, string> = new Map<string, string>();
  private keybind: Map<string, string> = new Map<string, string>();

  constructor(defaultKeyBind: Map<string, string>) {
    this.defaultKeyBind = defaultKeyBind;
    this.restore();
  }

  bind(keyName: string, commandName: string){
    this.keybind.set(keyName, commandName);
  }
  unBind(keyName: string, restore = true){

    this.keybind.delete(keyName);
    if(restore){
      this.reset(keyName);
    }
  }
  reset(keyName: string){
    let defaultCm = this.defaultKeyBind.get(keyName);
    if(defaultCm == undefined){
      return;
    }
    this.keybind.set(keyName, defaultCm);
  }
  restore(){
    this.keybind.clear();
    this.defaultKeyBind.forEach((value, key) => {
      this.keybind.set(key, value);
    })
  }
  getCommandName(keyName: string): string{
    let cm = this.keybind.get(keyName);
    return cm == undefined ? "" : cm;
  }
}