import {KeyBind} from "./keymap";
import {CommandService} from "../CommandService";
import {e_stop} from "../utils/event";

export class CommandKeyHandler{
  constructor(
    readonly keybind: KeyBind,
    readonly commandService: CommandService
  ) {
  }
  callCommandKeyHandler(keyname: string, ...args: any){
    let cm = this.keybind.getCommandName(keyname);
    // console.log(cm);
    // @ts-ignore
    this.commandService.execCommand.apply(this.commandService, [cm].concat(args));
  }

  hasKeyBind(keyname: string): boolean{
    return this.keybind.getCommandName(keyname) != "";
  }

  private modifiersMap = new Map<string, string>(
    [
      ["Control", "ctrl"], ["Alt", "alt"],
      ["Meta", "meta"], ["shift", "shift"]
    ]
  );
  normalizeKeyName(e: KeyboardEvent): any{
    if(this.modifiersMap.has(e.key)){
      return {
        isModifier: true,
        hasModifier: true,
        keyname: this.modifiersMap.get(e.key)
      }
    }
    let name = "";

    if(e.ctrlKey){
      name += "ctrl-";
    }
    if(e.shiftKey){
      name += "shift-";
    }
    if(e.altKey){
      name += "alt-";
    }
    if(e.metaKey){
      name += "meta-";
    }
    // console.log(e.key);
    return {
      isModifier: false,
      hasModifier: name != "",
      keyname: name += e.key
    }
  }
}