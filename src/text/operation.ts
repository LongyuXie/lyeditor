import {Range} from "../core/range";

export class EditOperation{
  constructor(
    public readonly range: Range,
    public readonly text: string | undefined,
  ) {

  }
}

/**
 * 合法的编辑操作参数，两者不同时为空
 */
 export class ValidEditOperation{
  constructor(
    public readonly range: Range,
    public readonly text: string,
  ) {
  }
}