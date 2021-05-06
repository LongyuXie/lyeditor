
import {isFunction} from "./utils/type";
import {logd} from "./utils/log";

/**
 * 首先对于快捷键来说存在映射: "Ctrl-C" -> "copy"
 * 这样不需要直接将快捷键绑定到功能上, 而是建立一个字符串映射
 * 当需要将修改快捷键时功能, 只需要修改映射的字符串, 处理函数保存在命令集合中实现解耦
 * 如果使用快捷键调用命令, 那么该命令无法接收到参数, 或者说只能使用预定义的参数
 * 特别要注意this指针的指向问题.
 */
export class CommandService{
  private commandMap: Map<string, any> = new Map();

  /**
   * 向命令集合中添加一个命令
   * @param name
   * @param handler
   * @param overwrite 是否覆盖原有的命令
   */
  public add(name: string, handler: any, overwrite = false){
    if(!isFunction(handler)){
      logd("commandService", "add", "argument handler is not a function");
      return;
    }
    if(name == ""){
      return;
    }
    if(this.commandMap.has(name) && !overwrite){
      return;
    }
    this.commandMap.set(name, handler);
  }

  /**
   * 移除一个命令
   * @param name
   * @return 返回原来的命令
   */
  public remove(name: string): any{
    let handler = this.commandMap.get(name);
    this.commandMap.delete(name)
    return handler;
  }
  public execCommand(name: string, ...args: any){
    let handler = this.commandMap.get(name);
    // console.log(handler);
    // console.log(name);
    // console.log(args);
    if(name == ""){
      return;
    }
    if(handler == undefined){
      logd("CommandService", "execCommand", "no command find by name " + name);
      return;
    }
    if(args.length > 0){
      handler.apply(null, args);
    }else{
      handler.apply(null);
    }
  }
}