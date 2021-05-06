import {TextChange} from "../text/textChange";
import {EditModel} from "../text/editModel";
import {Range} from "../core/range";
import {isSingleLetter, isWord} from "../utils/char";
import {EditOperation} from "../text/operation";

export interface IUndoable {
  undo(): void;
  redo(): void;
}

export class EditUndoOperation implements IUndoable{

  private cursor: EditModel;

  private undoRange: Range;
  private undoText: string;

  private redoRange: Range;
  private redoText: string;

  private isSingleLetter: boolean;
  /**
   没有必要考虑在提交undo时进行判断是否合并命令
   而是考虑在进行撤销时，向前搜索是否能够合并
   每个操作如何判断是否是插入单个单词呢？
   redoRange.isEmpty() && redoText != ""
   向前合并的结束符是什么？
   - 到达列表的头部
   - 遇到第一个分割符号的插入
   - 如果是替换而且redoText不是单个字符
   - 如果是删除操作
   */

  constructor(model: EditModel, change: TextChange) {
    this.cursor = model;
    this.undoRange = change.newRange;
    this.undoText = change.oldText;
    this.redoRange = change.oldRange;
    this.redoText = change.newText;

    this.isSingleLetter = isSingleLetter(this.redoText);
  }

  undo(): void {
    this.cursor.applyEdit(
      new EditOperation(this.undoRange, this.undoText), "undo");
  }
  redo(): void {
    this.cursor.applyEdit(new EditOperation(this.redoRange, this.redoText), "redo" );
  }

  public static tryMerge(
    ua: EditUndoOperation,
    ub: EditUndoOperation
  ): EditUndoOperation | undefined {
    if (!isWord(ua.redoText)) {
      return undefined;
    }
    if (!ub.isSingleLetter || !ub.redoRange.isEmpty()) {
      return undefined;
    }
    if (
      !ua.undoRange.getEndPosition().equals(ub.redoRange.getStartPosition())
    ) {
      return undefined;
    }
    return new EditUndoOperation(
      ua.cursor,
      new TextChange(
        Range.fromPositions(
          ua.undoRange.getStartPosition(),
          ub.undoRange.getEndPosition()
        ),
        ua.redoText + ub.redoText,
        ua.redoRange.spansMultipleLines()
          ? ua.redoRange
          : ua.redoRange.collapseToStart(),
        ua.undoText
      )
    );
  }
}