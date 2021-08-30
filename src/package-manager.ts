import { prepareCommands } from "./prepare-commands";
import { Logger } from "./autoupdater";
import * as path from "path";

const COMMANDS = {
  outdatedJson: (packageJsonFile: string = "./package.json") =>
    ({ args: ["outdated", "--json"], cwd: path.dirname(packageJsonFile) }),
  update: (packageJsonFile: string = "./package.json") =>
    ({ args: ["update"], cwd: path.dirname(packageJsonFile) }),
} as const;

interface OutdatedPackageInfo {
  current: string,
  wanted: string,
  latest: string
}

export interface OutdatedPackages {
  [packageJsonFile: string]: {
    [name: string]: OutdatedPackageInfo
  }
}

export class PackageManager {
  private readonly logger: Logger;
  private readonly commands = prepareCommands(this.determineUsedPackageManager(), COMMANDS);

  constructor(logger: Logger = console, usedPackageManagerName?: "npm" | "yarn") {
    this.logger = logger;
    if (usedPackageManagerName) {
      this.commands = prepareCommands(usedPackageManagerName, COMMANDS);;
    }
  }

  private determineUsedPackageManager(): "npm" | "yarn" {
    return "npm";
  }

  /**
   * @returns null if there are no outdated packages
   */
  getOutdatedPackages(packageJsonFiles: string[]): OutdatedPackages {
    const outdatedPackages: OutdatedPackages = {};
    let outdatedPackagesOfOnePackageJsonFile: { [name: string]: OutdatedPackageInfo };
    let outdatedPackageInfo: OutdatedPackageInfo;
    for (const packageJsonFile of packageJsonFiles) {
      outdatedPackagesOfOnePackageJsonFile = JSON.parse(this.commands.outdatedJson(packageJsonFile));
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
      this.commands.update(packageJsonFile);
    }
  }

}