import { Autoupdater } from "./autoupdater";

try {
  const app: Autoupdater = new Autoupdater();
  app.start();
} catch (error) {
  console.error(error);
}
