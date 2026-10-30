import * as w from "./work.ts";
import * as k from "./knowledge.ts";
import * as m from "./methods.ts";
import * as g from "./growth.ts";
import * as l from "./life.ts";
console.log(JSON.stringify({ ...w, ...k, ...m, ...g, ...l }, null, 1));
