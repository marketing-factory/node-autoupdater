import { PackageManager } from "./package-manager";
import { GitClient } from "./git-client";
import { ConfigurationManager } from "./configuration-manager";
import type { OutdatedPackages } from "./package-manager";
import type { ConfigurationData } from "./configuration-manager";


interface Logger {
    log(message: string): void
}
export type { Logger };

export class App {
    private packageManager: PackageManager;
    private gitClient: GitClient;
    private outdatedPackages: OutdatedPackages;
    private config: ConfigurationData;
    private logger: Logger = console;

    constructor() {
        this.packageManager = new PackageManager(this.logger);
        this.gitClient = new GitClient(this.logger);
    }

    start() {
        this.config = ConfigurationManager.getConfigurationData();
        const packageJsonFiles = this.config.packages;
        this.outdatedPackages = this.packageManager.getOutdatedPackages(packageJsonFiles);
        if (this.outdatedPackages === null) {
            this.logger.log("No updates are needed.");
        } else {
            this.gitClient.createAndCheckoutBranch(this.config.branch)
            this.packageManager.updatePackages(packageJsonFiles);
        }

    }
}
