import { prepareCommands } from "../../src/prepare-commands";
import * as path from "path";

const nodeCommands = {
  eval: (script: string, ...options: string[]) => [...options, "-p", script],
  parentDirectory: () => ({ args: ["-p", "process.cwd()"], cwd: ".." }),
  gitVersion: () => ({ args: ["--version"], executable: "git" })
}

describe(prepareCommands, () => {
    const node = prepareCommands("node", nodeCommands);

    describe("When provided with commands as arrays, it ...", () => {
      it("turns the commands into functions of a an object to be returned", () => {
        expect(node).toHaveProperty("eval");
        expect(node.eval).toBeInstanceOf(Function);
      });
      
      it("makes functions that execute the commands when called", () => {
        expect(node.eval("util.format('Answer: %d', 42)", "-r", "util")).toBe("Answer: 42");
      });
  
      it("ignores empty string arguments", () => {
        expect(node.eval("1+1", "", "")).toBe("2");
      });
    });

    describe("When provided with commands as configurable objects, it ...", () => {
      it("uses the specified executable", () => {
        expect(node.gitVersion()).toMatch(/^git version.*/);
      });
      it("executes commands in the specified directory", () => {
        expect(node.parentDirectory()).toBe(path.join(process.cwd(), ".."));
      });
    })
});