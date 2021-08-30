import { join } from "path";
const readFileSync = jest.requireActual("fs").readFileSync;

export function getConfigFileAsString(filename: string) {
  return readFileSync(join(__dirname, filename), "utf-8");
}