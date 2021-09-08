import { Autoupdater } from "./autoupdater";

try {
  const app: Autoupdater = new Autoupdater(process.argv[2], process.argv.slice(3));
  app.start();
} catch (error) {
  console.error(error);
}
