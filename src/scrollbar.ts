/**
 * sliderHeight = visbileHeight * scrollbarHeight / scrollHeight
 * // 滑块区域与内容区域的比例
 * sliderRatio = (scrollHeight - visibleHeight) / (scrollbarHeight - sliderHeight)
 * sliderTop = scrollTop * sliderRatio
 */
import {upperBound} from "./utils/number";
import {e_stop, IEventListener} from "./utils/event";

/**
 * 一些场景的需求
 * 1. 鼠标拖动滑块(点击滚动条中的位置)
 * 此时容器内容没有发生改变, 而是视图发生改变, 首先修改的是sliderTop, 滑块的位置发生改变
 * 然后根据公式修改scrollTop, 更新容器窗口内的视图
 * 2. 容器中的访问越界
 * 使用光标在容器内移动时, 此时容器和滚动条的属性不需要发生改变, 根据移动的逻辑位置来计算视图中应该
 * 移动的距离, 然后计算sliderTop, 也就是: 计算scrollTop -> 计算并修改sliderTop -> 修改scrollTop -> 更新视图
 * 如果需要考虑每次光标改变时要更新可视区域的范围, 规定好更新的规则.
 * 比如说从显示区域的边缘向外移动一个列, 那么应该更新的视图区域是什么呢?
 * 如果光标直接从可视区域跳转到一个位置, 那么光标应该显示在哪里呢? 是不是和原来在窗口显示的位置一致, 还是在底部显示...
 * 3. 鼠标的滚轮
 * 鼠标滚轮在容器内部滚动时, 需要更新scrollTop, 但是光标的显示可以不做要求
 * 首先需要完成的是通过鼠标滚轮计算出应该滚动的像素, 然后通过公式计算实际的sliderTop和scrollTop
 * 4. 输入文本
 * 当输入文本时, 此时会修改内容的高度: scrollHeight, 对应地需要修改sliderHeight, sliderTop, scrollTop
 * 仔细考虑这个过程, 增加一行scrollHeight += scrollFactor, 然后计算sliderHeight也就是滑块的长度, 最后更新的是滑块的位置
 */

export class Scrollbar extends IEventListener{
  private get sliderTop(): number {
    return this._sliderTop;
  }
  private get sliderHeight(): number {
    return this._sliderHeight;
  }
  // 滚动条的长度
  private scrollbarHeight!: number;
  // 容器高度
  private visibleHeight!: number;

  private scrollFactor!: number;
  // 外观属性
  private scrollbar: HTMLDivElement; /* 滚动条元素 */
  private sliderDom: HTMLDivElement; /* 滑块元素 */

  /// 滚动条的滚动规则
  /// 需要考虑清楚的是容器的大小计算
  /// 当容器的内容高度小于可视区域的高度或者某个具体的高度, 我们不希望显示滚动条
  /// 当容器内容超过可视区域时, 对于内容的最下面的一些行, 不需要总是显示在可视区域的最后一行, 可以设置定这个高度
  /// 一个最简单的想法是: 即使容器内部只有两行也可以进行滚动, 每一行都滚动到可视区域的第一行
  /// scrollHeight计算规则: (lines-1) * lineH + clientH
  constructor() {
    super();
    this.scrollbar = document.createElement('div');
    this.sliderDom = document.createElement('div');

    this.scrollbar.appendChild(this.sliderDom);

    this.setStyle();
    // 必须!不然会有拖拽效果导致无法拖动滑块
    this.sliderDom.ondragstart = (e) => {
      e_stop(e);
      return false;
    }

    let pageY = 0;

    this.scrollbar.onmousedown = (e) => {
      e_stop(e);
    }

    // 滑块随着鼠标的拖动而滑动
    // 需要处理输入焦点的变化
    this.sliderDom.addEventListener('mousedown', (e) => {
      e_stop(e);
      let sliderCapture = true;
      pageY = e.pageY;
      let time = Date.now();
      let cnt = 0;
      let handleMouseMove = (e: MouseEvent) => {
        if (!sliderCapture) {
          return;
        }
        let ctime = Date.now();
        if (ctime - time < 40) {
          return;
        }
        time = ctime;

        let moveDelta = e.pageY - pageY;
        pageY = e.pageY;

        if (this.sliderTop == this.scrollbarHeight - this._sliderHeight && moveDelta > 0) {
          return;
        }
        if (this.sliderTop == 0 && moveDelta < 0) {
          return;
        }

        let top = this.sliderTop + moveDelta;
        console.log(`top = ${top}`);

        if (top > this.scrollbarHeight - this._sliderHeight) {
          this.sliderTop = this.scrollbarHeight - this._sliderHeight;
        } else if (top < 0) {
          this.sliderTop = 0;
        } else{
          this.sliderTop = top;
        }
        let sliderRatio = (this.scrollbarHeight - this._sliderHeight) / (this.scrollHeight - this.visibleHeight);
        this._scrollTop = this.sliderTop / sliderRatio;
        this.signal("scroll", this._scrollTop);
      }
      let handleMouseUp = (e: MouseEvent) => {
        if (sliderCapture) {
          sliderCapture = false;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }
      }
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    })
  }

  // 内容的高度
  private _scrollHeight!: number;

  get scrollHeight(): number {
    return this._scrollHeight;
  }

  set scrollHeight(value: number) {
    this._scrollHeight = value;
    // this.updateSliderHeight();
  }

  // 容器滚动的距离
  private _scrollTop!: number;

  get scrollTop(): number {
    return this._scrollTop;
  }

  set scrollTop(value: number) {
    this._scrollTop = value;
    // this.updateSliderPosition();
  }

  // 滑块的长度
  private _sliderHeight!: number;

  private set sliderHeight(value: number) {
    this._sliderHeight = value;
    this.sliderDom.style.height = value + "px";
  }

  // 滑块在滚动条中的位置
  private _sliderTop!: number;

  private set sliderTop(value: number) {
    this._sliderTop = value;
    this.sliderDom.style.top = value + "px";
  }

  public dom(): HTMLElement {
    return this.scrollbar;
  }

  public updateScrollbar(scrollTop: number, scrollHeight: number = this.scrollHeight) {
    // console.log(this);
    this.scrollHeight = scrollHeight;
    this.updateSliderHeight();
    if(this.scrollTop == scrollTop){
      return;
    }
    this.scrollTop = scrollTop;
    this.updateSliderPosition();
    this.signal("scroll", this.scrollTop);
  }

  setScrollbarPos(left: number, top: number) {
    this.scrollbar.style.top = `${top}px`;
    this.scrollbar.style.left = `${left}px`;
  }

  // 考虑方向将会变成一件复杂的事情
  init(scrollbarWidth: number, scrollbarHeight: number, visibleHeight: number, scrollHeight: number, scrollFactor: number = 1) {
    this.scrollbar.style.width = scrollbarWidth + "px";
    this.scrollbar.style.height = scrollbarHeight + "px";
    this.sliderDom.style.width = scrollbarWidth + "px";
    this.scrollbarHeight = scrollbarHeight;

    this.sliderTop = 0;
    this.scrollFactor = scrollFactor;
    this.visibleHeight = visibleHeight;
    this.scrollHeight = scrollHeight;
  }

  private setStyle() {
    this._scrollTop = 1;
    this._sliderTop = 1;
    this._scrollHeight = 1;
    this.scrollbarHeight = 1;
    this.visibleHeight = 1;
    this._sliderHeight = 1;
    this.scrollbar.style.border = "1px solid";
    this.scrollbar.style.background = "#ffff00";

    this.sliderDom.style.position = "absolute";
    this.scrollbar.style.position = "absolute";
    this.sliderDom.style.background = "#55557f";
  }

  private updateSliderHeight() {
    this.sliderHeight = this.visibleHeight * this.scrollbarHeight / this.scrollHeight;
    this.sliderTop = upperBound(this.sliderTop, this.scrollbarHeight-this.sliderHeight);
  }

  private updateSliderPosition() {
    let sliderRatio = (this.scrollbarHeight - this.sliderHeight) / (this.scrollHeight - this.visibleHeight);
    this.sliderTop = this.scrollTop * sliderRatio;
  }
}