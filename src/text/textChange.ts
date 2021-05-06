import {Range} from "../core/range"
/**
 * 和EditOperation的关系
 * EditOperation.text -> newText
 * EditOperation.range -> oldRange
 *
 * newRange：在编辑操作后，text的位置区间
 * oldText：需要操作的文本
 */
 export class TextChange{
  constructor(
    public readonly newRange: Range,
    public readonly newText: string,
    public readonly oldRange: Range,
    public readonly oldText: string
  ) {
  }

  /**
   * 交换编辑的区间和文本
   */
  reverse(): TextChange{
    return new TextChange(this.oldRange, this.oldText, this.newRange, this.newText);
  }
}