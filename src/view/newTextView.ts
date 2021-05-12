import { EasyDomNode } from "../core/easyDomNode";

/**
 * 用于渲染编辑器中的文本行
 * 最多容纳的文本行数量（窗口大小）
 * 我觉得首先需要解决的是程序中的配置管理，编辑器的各个组件是如何获取编辑器的各种配置项
 * 窗口大小，最大的行的数量，字体大小...
 * 编辑器中的状态信息（）
 * 状态包括什么：视图的状态
 * 编辑器中的配置信息（）
 * 配置又是什么
 * dom集合
 * 1. 首先将一定数量的文本行显示出来
 */
export class NewTextView {
  private lines: EasyDomNode<HTMLElement>[];
  // private

  constructor() {
    this.lines = [];
  }
}