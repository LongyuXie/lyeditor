/**
 * 两种事件处理的模型
 * - 继承事件处理接口, 事件处理函数存储在发送事件的对象上.
 * - 使用事件分发, 事件处理函数存放在Dispatcher中.
 * 当然也可以对上述的两者进行混用, 对象继承了事件处理接口, 意味着能够调用Dispatcher的接口
 * 
 * Dispatcher中的数据结构
 * {
 *   emitter: {
 *     type: [];
 *   }
 * }
 */

import {logd} from "./log";
import {isFunction} from "./type";

/**
 * {
 *   "typename": [handler1, handler2, handler3],
 *   "change" : [],
 * }
 */

class EventDispatcher{

  private registered: Map<any, any> = new Map();

  private constructor() {
  }

  private getHandlers(o: any, type: string): any[]{
    if(!this.registered.has(o)) return [];
    let list = this.registered.get(o)!![type];
    return (list == undefined) ? [] : list;
  }

  public addListener(emitter: any, type: string, handler: any){
    // console.log("add listener");
    if(!isFunction(handler)){
      logd("EventDispatcher", "addListener", "argument \'handler\' must be a function");
    }
    if(!this.registered.has(emitter)) this.registered.set(emitter, {});
    let eventMap = this.registered.get(emitter)!!;
    if(eventMap[type] == undefined) eventMap[type] = [];
    eventMap[type].push(handler);
    // console.log(this.registered);
  }

  public removeListener(emitter: any, type: string, handler: any){
    let map = this.registered.get(emitter);
    if(map == undefined) return;
    let handlers = map[type];
    if(handlers){
      let index = handlers.indexOf(handlers)
      if (index > -1)
        map[type] = handlers.slice(0, index).concat(handlers.slice(index + 1))
    }
  }

  public signal(emitter: any, type: string, ...args: any[]){
    let handlers = this.getHandlers(emitter, type);
    // console.log(handlers);

    for (let i = 0; i < handlers.length; ++i) {
      if(args.length > 0){
        // console.log("apply 1");
        handlers[i].apply(null, args)
      }else{
        // console.log("apply 2");
        handlers[i].apply(null)
      }
    }
  }

  public removeAll(emitter: any, type: string){
    if(this.registered.has(emitter)){
      let map = this.registered.get(emitter);
      if(map[type] != undefined){
        map[type] = [];
      }
    }
  }

  public destroy(){
    this.registered.clear();
  }
  static dispatcher = new EventDispatcher();

}

export abstract class IEventListener{
  private dispatcher = EventDispatcher.dispatcher;
  protected addListener(el: any, type: string, handler: any){
    this.dispatcher.addListener(el, type, handler);
  }
  protected removeListener(el: any, type: string, handler: any){
    this.dispatcher.removeListener(el, type, handler);
  }
  protected signal(type: string, ...args: any[]){
    // console.log(this);
    // console.log(`args = ${args}`);
    // console.log(args);
    // this.dispatcher.signal.call(this, this, type, args);
    // 如果直接调用this.dispatcher.signal(this, type, args)
    // typescript会将args作为一个真正的数组来处理, 传递到dispatcher中
    // 即使参数也是...args, 也只是一个参数, 不会把参数分开
    // 举个例子:
    // a.signal("input", "hello", "world);
    // 实际上在dispatcher中处理时接收到的参数
    // dispatcher.signal("input", ["hello", "world"]);
    // 进行函数调用时,总是handlers[i](["hello", "world"])
    // 而我预想中的是: handlers[i]("hello", "world");
    // 所以下面需要将所有的参数合并为数组, 使用apply调用
    // 但这样会造成类型不兼容, 因此需要使ts检查忽略下面的语句
    // @ts-ignore
    this.dispatcher.signal.apply(this.dispatcher, [this, type].concat(args));
  }
}

/**
 * 事件的具体形式:
 * 事件的触发者 -> 发送事件的对象, 通过调用emit函数触发事件
 * 事件类型    -> 一个触发者可以触发多个事件类型
 * 事件的接受者 -> 函数对象, 当触发了某个事件后, 调用该函数进行处理
 */


export function e_preventDefault(e: Event) {
  if (e.preventDefault) e.preventDefault()
  else e.returnValue = false
}

export function e_stopPropagation(e: Event) {
  if (e.stopPropagation) e.stopPropagation()
  else e.cancelBubble = true
}

export function e_defaultPrevented(e: Event) {
  return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue = false
}

export function e_stop(e: Event) {
  e_preventDefault(e);
  e_stopPropagation(e)
}

export function e_target(e: Event) {
  return e.target
}