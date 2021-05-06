/**
 * Undo中存储的是什么？并不是所有的编辑操作都会从选择区域中来
 * 如果直接操作文本，而不是通过鼠标，那么就不会产生选择区域！
 */
import {EditUndoOperation} from "./Undoable";
import {TextChange} from "../text/textChange";
import {EditModel} from "../text/editModel";

export class UndoService {
  public clear(): void {
    this.undoList = [];
    this.redoList = [];
    this._isUndoing = false;
    this._isUndoing = false;
  }
  // getOperations(): IEditUndoOperation[] {
  //   let ret: IEditUndoOperation[] = [];
  //   for(let idx = this.undoList.length-1; idx >= 0; idx--) {
  //     ret.push(this.undoList[idx].toIEditOperation());
  //   }
  //   return ret;
  // }
  public get isUndoing(): boolean {
    return this._isUndoing;
  }
  public get isRedoing(): boolean {
    return this._isRedoing;
  }
  private _isRedoing: boolean = false;
  private _isUndoing = false;
  private readonly cursor: EditModel;

  private undoList: EditUndoOperation[] = [];
  private redoList: EditUndoOperation[] = [];

  constructor(model: EditModel) {
    this.cursor = model;
  }
  canUndo(): boolean {
    return this.undoList.length > 0;
  }
  canRedo(): boolean {
    return this.redoList.length > 0;
  }
  commit(change: TextChange): void {
    if (this.canRedo()) {
      this.redoList = [];
    }
    let undoUnit = new EditUndoOperation(this.cursor, change);
    let top = this.undoList.pop();
    if(top){
      let merged = EditUndoOperation.tryMerge(top, undoUnit);
      if(merged){
        undoUnit = merged;
      }else{
        this.undoList.push(top);
      }
    }
    this.undoList.push(undoUnit);
    return;
  }

  undo(): void {
    this._isUndoing = true;
    let undoUnit = this.undoList.pop();
    if (undoUnit) {
      undoUnit.undo();
      this.redoList.push(undoUnit);
    }
    this._isUndoing = false;
  }
  redo(): void {
    this._isRedoing = true;
    if (this.canRedo()) {
      let redoUnit = this.redoList.pop()!;
      redoUnit.redo();
      this.undoList.push(redoUnit);
    }
    this._isRedoing = false;
  }
}
