import { execSync } from "child_process";
import { PackageManagerCommands as commands } from "./PackageManagerCommands";
import type { Logger } from "./app";

interface OutdatedPackageInfo {
    current: string,
    wanted: string,
    latest: string
}

interface OutdatedPackages {
    [packageJsonFile: string]: {
        [name: string]: OutdatedPackageInfo
    }
}
export type { OutdatedPackages };

export class PackageUpdater {
    private logger: Logger;
    constructor(logger: Logger = console) {
        this.logger = logger;
    }

    /**
     * Returns null if there are no outdated packages
     */
    getOutdatedPackages(packageJsonFiles: string[]): OutdatedPackages {
        const outdatedPackages: OutdatedPackages = {};
        let outdatedPackagesOfOnePackageJsonFile: {[name: string]: OutdatedPackageInfo};
        let outdatedPackageInfo: OutdatedPackageInfo;
        for (const packageJsonFile of packageJsonFiles) {
            outdatedPackagesOfOnePackageJsonFile = JSON.parse(commands.outdatedJson(packageJsonFile));
            for (const packageName in outdatedPackagesOfOnePackageJsonFile) {
                outdatedPackageInfo = outdatedPackagesOfOnePackageJsonFile[packageName];
                // If current equals wanted then the package has a major update
                if (outdatedPackageInfo.current !== outdatedPackageInfo.wanted) {
                    // Skip other entries like 'location' and 'dependent':
                    outdatedPackages[packageJsonFile][packageName] = {
                        current: outdatedPackageInfo.current,
                        wanted: outdatedPackageInfo.wanted,
                        latest: outdatedPackageInfo.latest
                    };
                }
            }
        }
        if (Object.keys(outdatedPackages).length === 0)
            return null;
        return outdatedPackages;
    }

    updatePackages(packageJsonFiles: string[]): void {
        for (const packageJsonFile of packageJsonFiles) {
            this.logger.log(`Updating packages in ${packageJsonFile}...`);
            execSync(commands.update(packageJsonFile));
        }
    }
}