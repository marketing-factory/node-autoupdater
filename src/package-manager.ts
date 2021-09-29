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

  for (const packageJsonFile of packageJsonFiles) {
    let outdatedPackagesOfOnePackageJsonFile =
      getOutdatedPackagesOfOnePackageJsonFile(packageJsonFile);
    if (outdatedPackagesOfOnePackageJsonFile !== null) {
      outdatedPackages[packageJsonFile] = outdatedPackagesOfOnePackageJsonFile;
    }
  }

  if (Object.keys(outdatedPackages).length === 0)
    return null;
  return outdatedPackages;
}

function getOutdatedPackagesOfOnePackageJsonFile(packageJsonFile: string) {
  let outdatedPackagesOfOnePackageJsonFile: { [name: string]: OutdatedPackageInfo } =
    JSON.parse(COMMANDS.outdatedJson(packageJsonFile));

  // Filter unwanted information:
  for (const packageName in outdatedPackagesOfOnePackageJsonFile) {
    let outdatedPackageInfo = outdatedPackagesOfOnePackageJsonFile[packageName];
    // If current equals wanted then the package has a major update
    if (outdatedPackageInfo.current !== outdatedPackageInfo.wanted) {
      // Skip other entries like 'location' and 'dependent':
      outdatedPackagesOfOnePackageJsonFile[packageName] = {
        current: outdatedPackageInfo.current,
        wanted: outdatedPackageInfo.wanted,
        latest: outdatedPackageInfo.latest
      };
    } else {
      delete outdatedPackagesOfOnePackageJsonFile[packageName];
    }
  }

  if (Object.keys(outdatedPackagesOfOnePackageJsonFile).length === 0)
    return null;
  return outdatedPackagesOfOnePackageJsonFile;
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