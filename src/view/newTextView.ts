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
  // // 行的高度
  // private lineH: number;
  // // 左上角的坐标
  // private left: number;
  // private top: number;

  // 每次只显示渲染视窗中的行
  // 视窗的概念：[start, end]
  // 更加抽象地看，这就是一个优化后的ListView（Android）
  // 文档中的文本行可以非常多，但是只有可视区域中的行会被渲染。
  // 将这个过程抽象成一个抽象类。
  // 更新的概念

  constructor() {
    this.lines = [];
  }
}