import { Autoupdater } from "./autoupdater";

const projectRoot = process.argv[2] ?? process.cwd();
const app: Autoupdater = new Autoupdater(projectRoot, process.argv.slice(3));
app.start();