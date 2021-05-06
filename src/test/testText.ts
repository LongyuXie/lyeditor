import {Text} from "../text/text";
import {Position} from "../core/position";

let t = Text.of(["hello, world", "xielongyu", "hello, world"]);

// let iter = t.iter();
//
// for(;!iter.done;){
//   iter.next();
//   console.log(iter.value);
//   console.log(iter);
// }
// console.log(t.length);
// console.log(t.line(1));
// console.log(t.toString());
//
// iter = t.iterRange(0, 100);
// for(;!iter.done;){
//   iter.next();
//   console.log(iter.value);
//   console.log(iter);
// }

function linesContent(t: Text, start: number, end: number): string[]{
  let iter = t.iter().next();
  console.log(`start = ${start}, end = ${end}`);
  let idx = 0;
  let array: string[] = [];
  while (!iter.done && idx <= end){
    console.log(iter);
    if(idx >= start && !iter.lineBreak){
      array.push(iter.value);
    }
    if(iter.lineBreak){
      idx++;
    }
    iter.next();
  }
  return array;
}

// console.log(linesContent(t, 0, 0));
function getOffset(doc: Text, pos: Position): number{
  let iter = doc.iter().next();
  let idx = 0;
  let len = 0;
  while (!iter.done && idx < pos.lineNumber) {
    len += iter.value.length;
    if(iter.lineBreak){
      idx++;
    }
    iter.next();
  }
  return len + pos.column;
}
console.log(getOffset(t, new Position(0, 0)));
console.log(getOffset(t, new Position(0, 1)));
console.log(getOffset(t, new Position(1, 0)));
console.log(getOffset(t, new Position(1, 1)));
console.log(Text.of("".split("\n")));
console.log(Text.empty);