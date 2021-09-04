import * as Lib from "./lib";

export default function (source: string) {
  console.log(Lib.hello());
  return `export default ${JSON.stringify(source)}`;
}
