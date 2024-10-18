import { parse } from "./mod";

console.log(parse(".gitignore\n**/*.ts\nprivate")[0][0]);
