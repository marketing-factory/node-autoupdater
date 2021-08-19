import {PackageUpdater} from "./package-updater";
import { GitClient } from "./git-client";
import { ConfigurationManager as Config } from "./ConfigurationManager";

import type { OutdatedPackages } from "./package-updater";


interface Logger {
    log(message: string): void
}
export type { Logger };

export class App {
    private packageUpdater: PackageUpdater;
    private gitClient: GitClient;
    private outdatedPackages: OutdatedPackages;

    constructor() {
        this.packageUpdater = new PackageUpdater(console);
        this.gitClient = new GitClient(console);
    }

    start() {
        const packageJsonFiles = Config.data.packages;
        this.outdatedPackages = this.packageUpdater.getOutdatedPackages(packageJsonFiles);


    }
}
