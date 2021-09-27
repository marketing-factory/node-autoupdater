import { prepareCommands } from "./prepare-commands";
import { logger } from "./logger";
import * as path from "path";

const COMMAND_DEFINITIONS = {
  outdatedJson: (packageJsonFile: string = "./package.json") =>
    ({ args: ["outdated", "--json"], cwd: path.dirname(packageJsonFile) }),
  update: (packageJsonFile: string = "./package.json") =>
    ({ args: ["update"], cwd: path.dirname(packageJsonFile) }),
} as const;

const COMMANDS = prepareCommands(determineUsedPackageManager(), COMMAND_DEFINITIONS);

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

function determineUsedPackageManager(): "npm" | "yarn" {
  return "npm";
}

/**
 * @returns null if there are no outdated packages
 */
export function getOutdatedPackages(packageJsonFiles: string[]) {
  const outdatedPackages: OutdatedPackages = {};
  let outdatedPackagesOfOnePackageJsonFile: { [name: string]: OutdatedPackageInfo };
  let outdatedPackageInfo: OutdatedPackageInfo;
  let outdatedPackagesExist = false;
  for (const packageJsonFile of packageJsonFiles) {
    outdatedPackages[packageJsonFile] = {};
    outdatedPackagesOfOnePackageJsonFile = JSON.parse(COMMANDS.outdatedJson(packageJsonFile));
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
        outdatedPackagesExist = true;
      }
    }
  }
  if (outdatedPackagesExist)
    return outdatedPackages;
  return null;
}

export function updatePackages(packageJsonFiles: string[]): void {
  for (const packageJsonFile of packageJsonFiles) {
    logger.log(`Updating dependencies of ${packageJsonFile}...`);
    try {
      COMMANDS.update(packageJsonFile);
    } catch (error) {
      logger.error(
        `An error occurred while updating the dependencies of ${packageJsonFile}: ${error}`
      );
    }
  }
}