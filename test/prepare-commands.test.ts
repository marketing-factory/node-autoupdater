import { prepareCommands } from "../src/prepare-commands";
import * as path from "path";

const nodeCommands = {
  eval: (script: string, ...options: string[]) => [...options, "-p", script],
  pwd: (parentDirectory=false) => 
    ({args: ["/C", "cd"], executable: "cmd", cwd: parentDirectory ? ".." : "."}),
}

describe(prepareCommands, () => {
    const readyCommands = prepareCommands("node", nodeCommands);

    it("returns commands as functions on an object", () => {
      expect(readyCommands).toHaveProperty("eval");
      expect(readyCommands.eval).toBeInstanceOf(Function);
    });
    
    it("returns commands that execute correctly", () => {
      expect(readyCommands.eval("util.format('Answer: %d', 42)", "-r", "util")).toBe("Answer: 42");
    });

    it("ignores empty string arguments", () => {
      const newLocal = readyCommands.eval("1+1", "", "");
      console.log(newLocal);
      expect(newLocal).toBe("2");
    });

    it("uses specified executable and starts in specified directory", () => {
      expect(readyCommands.pwd()).toBe(process.cwd());
      expect(readyCommands.pwd(true)).toBe(path.join(process.cwd(), ".."));
    });
});