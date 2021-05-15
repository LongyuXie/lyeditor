export class ViewHolder{

}

export class Adapter<T>{
  buildDom(){
  }
  createDom(){
  }
}

/**
 * 只考虑字符串的渲染
 * 每一行字符串使用一个div进行渲染，假定行的高度一致
 * 初步的设想是给定容器高度，当内容超过容器高度后就可以进行滚动了
 */
export class ListView{
  private itemHeight: number;
}
// export class ListView{
//   private container: HTMLElement;
//   private render: (d: any, el: HTMLElement) => HTMLElement;
//   private containerHeight: number;
//   private data: any[] = [];
//
//   constructor(
//     container: HTMLElement,
//     itemHeight: number,
//     containerHeight: number,
//     data: any[],
//     render: (d: any, el: HTMLElement) => HTMLElement
//   ) {
//     this.data = data;
//     this.render = render;
//     this.containerHeight = containerHeight;
//     this.container = container;
//     this.itemHeight = itemHeight;
//   }
// }

/**
 * 在HTML中所谓的View是指什么呢？HTMLElement
 * 可以是单个的dom，也可以是一个dom的根节点。
 * 这些元素的特征：高度相同
 * 1. 抽象的行为（滚动）
 * 2. 数据
 * 3. 渲染的方式(通过数据来构建dom)
 * 4. dom回收机制
 */