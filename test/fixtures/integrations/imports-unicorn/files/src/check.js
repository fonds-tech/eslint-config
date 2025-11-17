import fs from "node:fs";
import { readFileSync } from "node:fs";

const filenames = ["package.json"];
let content = "";
if (filenames.indexOf("package.json") !== -1) {
  content = readFileSync(filenames[0], "utf-8");
}

export const output = fs.readFile;
export const fileContent = content;
