import {TextBuffer} from "../text/textBuffer";

let letterReg = /[a-zA-Z]/

export let splitRegex = /[^a-zA-Z_0-9]+/;

export function getWordsByLine(buffer: TextBuffer, lineNumber: number): string[]{
  return buffer.lineString(lineNumber).split(splitRegex);
}



export function isSingleLetter(char: string): boolean {
  if (char.length !== 1) {
    return false;
  }
  return letterReg.test(char);
}
export function isWord(word: string): boolean {
  return word.match(/^[a-zA-Z]+$/) != null;
}