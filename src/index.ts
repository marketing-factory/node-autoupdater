import { Autoupdater } from "./autoupdater";

try {
  const projectRoot = process.argv[2] ?? process.cwd();
  const app: Autoupdater = new Autoupdater(projectRoot, process.argv.slice(3));
  app.start();
} catch (error) {
  console.error(error);
}
