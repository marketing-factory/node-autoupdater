import { load as loadYaml } from "js-yaml";
import fs from "fs";
import path from "path";
import { homedir } from "os";
import { getGitClient, getGitRootDirectory } from "./git-client";
import commonAncestorPath from "common-ancestor-path";
import { logger } from "./logger";

interface ConfigurationDataPreComputation {
  // App Configuration
  "gitlab_url": string,
  "gitlab_user_username"?: string,
  "gitlab_user_email"?: string,
  "gitlab_auth_token"?: string,
  // Project Configuration
  "gitlab_project_name": string,
  //"project_root_directory": Computed<string>,
  "assignee"?: string,
  "branch": string,
  "target_branch": string,
  "packages": string[],
};

/*
Priority order from lowest to highest (High priority configuration overrides low priority configuration): 
DEFAULT_CONFIGURATION_DATA
CONFIGURATION_SEARCH_PATHS
CONFIGURATION_ENV_VARIABLES

The paths of package.json files, if not absolute, are relative to the configuration file they are
defined in.
*/

const DEFAULT_CONFIGURATION_DATA: ConfigurationDataPreComputation = {
  // App Configuration
  "gitlab_url": "https://gitlab.com/",
  "gitlab_user_username": "",
  "gitlab_user_email": "",
  "gitlab_auth_token": "",
  // Project Configuration
  "gitlab_project_name": "",
  //"project_root_directory": ConfigurationManager.computeDeepestProjectRoot,
  "assignee": "",
  "branch": "support/autoupdate",
  "target_branch": "develop",
  "packages": [path.join(process.cwd(), "package.json")],
};

// Last path has highest priority
const CONFIGURATION_FILE_PATHS = [
  "/etc/.autoupdater.yaml",
  path.join(homedir(), ".autoupdater.yaml"),
  `${process.cwd()}/.autoupdater.yaml`,
];

const CONFIGURATION_ENV_VARIABLES: Partial<Record<keyof ConfigurationDataPreComputation, string>> = {
  "gitlab_project_name": "AUTOUPDATER_PROJECT_NAME",
};


type Computed<TypeAfterComputation> = TypeAfterComputation | (
  (config: ConfigurationDataPreComputation, loadedValue?: TypeAfterComputation) => TypeAfterComputation
);

type C = ConfigurationDataPreComputation;
export type ConfigurationData = {
  [Key in keyof C]: C[Key] extends Computed<any> ? Exclude<C[Key], (...args: any[]) => any> : C[Key]
};

function isConfigurationData(configurationData: Partial<ConfigurationData>): configurationData is ConfigurationData {
  return (
    typeof configurationData.gitlab_url === "string" && configurationData.gitlab_url.length > 0 &&
    typeof configurationData.gitlab_project_name === "string" && configurationData.gitlab_project_name.length > 0 &&
    typeof configurationData.branch === "string" && configurationData.branch.length > 0 &&
    typeof configurationData.target_branch === "string" && configurationData.target_branch.length > 0 &&
    Array.isArray(configurationData.packages) && typeof configurationData.packages[0] === "string" &&
    configurationData.packages[0].length > 0
  );
}

export abstract class ConfigurationManager {
  private static configurationData: ConfigurationData;
  private static configurationFilePaths = CONFIGURATION_FILE_PATHS;
  private static projectRoot: string;
  private static configurationDataIsLoaded = false;
  
  static getConfigurationData(projectRoot: string, ...configurationFilePaths: string[]) {
    this.projectRoot = path.resolve(projectRoot);
    try {
      this.configurationFilePaths = [...this.configurationFilePaths, ...configurationFilePaths];
      if (!this.configurationDataIsLoaded) {
        this.loadConfigurationData();
        this.configurationDataIsLoaded = true;
      }
      return this.configurationData;
    } catch (error: any) {
      logger.error(error);
      return null;
    }
  }

  static resetConfigurationData() {
    this.configurationDataIsLoaded = false;
  }

  private static loadConfigurationData() {
    const configurationDataPreComputation = {
      ...DEFAULT_CONFIGURATION_DATA,
      ...this.loadConfigurationFromFiles(),
      ...this.loadConfigurationFromEnvVariables(),
    };
    this.configurationData = this.resolveComputedConfigurationData(configurationDataPreComputation);
    this.cleanAndValidateLoadedConfiguration();
  }

  private static loadConfigurationFromFiles() {
    let configurationDataFromFiles: Partial<ConfigurationData> = {};
    for (const file of this.configurationFilePaths) {
      if (fs.existsSync(file)) {
        try {
          let loadedYaml = loadYaml(fs.readFileSync(file, "utf-8")) as Partial<ConfigurationData>;
          if (loadedYaml && typeof loadedYaml === "object") {
            // TODO: do this for all config values that are paths
            if (loadedYaml.hasOwnProperty("packages") && Array.isArray(loadedYaml.packages)) {
              loadedYaml.packages = loadedYaml.packages.map(p =>  path.resolve(file, "..", p));
            }
            configurationDataFromFiles = { ...configurationDataFromFiles, ...loadedYaml };
          } else {
            throw new Error(`Configuration file is not in correct format.`);
          }
        } catch (error) {
          if (error instanceof Error)
            throw new Error(`Error while loading configuration from file ${file}: ${error.message}`);
        }
      }
    }
    return configurationDataFromFiles;
  }

  private static loadConfigurationFromEnvVariables() {
    let envConfigurationData: Partial<ConfigurationDataPreComputation> = {};
    let configKey: keyof typeof CONFIGURATION_ENV_VARIABLES;
    let envVariable: string | undefined;
    
    for (configKey in CONFIGURATION_ENV_VARIABLES) {
      let configValue = CONFIGURATION_ENV_VARIABLES[configKey];
      if (configValue)
        envVariable = process.env[configValue];
      
      if (envVariable) {
        if (typeof DEFAULT_CONFIGURATION_DATA[configKey] === "string") {
          envConfigurationData = { ...envConfigurationData, [configKey]: envVariable };
        } else {
          try {
            envConfigurationData[configKey] = JSON.parse(envVariable);
          } catch (error) {
            if (error instanceof Error)
              throw new Error(`Non-string env variables must be JSON parsable!\n${error.message}`);
          }
        }
      }
        
    }
    
    return envConfigurationData;
  }

  private static resolveComputedConfigurationData(configurationDataPreComputation: ConfigurationDataPreComputation) {
    let computedConfigurationData: Partial<ConfigurationData> = {};
    let configKey: keyof ConfigurationDataPreComputation;
    for (configKey in configurationDataPreComputation) {
      let configValue = configurationDataPreComputation[configKey];
      let defaultConfigValue: unknown = DEFAULT_CONFIGURATION_DATA[configKey];
      if (typeof defaultConfigValue === "function") {
        if (typeof configValue === "function") {
          computedConfigurationData = { 
            ...computedConfigurationData,
            [configKey]: defaultConfigValue(configurationDataPreComputation)
          };
        // TODO: allow other types than string to be computed
        } else if (typeof configValue === "string") {
          computedConfigurationData = {
            ...computedConfigurationData,
            [configKey]: defaultConfigValue(configurationDataPreComputation, configValue)
          };
        }
      } else {
        computedConfigurationData = {
          ...computedConfigurationData,
          [configKey]: configValue
        };
      }
    }

    /*if (isConfigurationData(computedConfigurationData))
      return computedConfigurationData;
    else
      throw new Error(`One or more required configurations are missing.`);*/
    return computedConfigurationData as ConfigurationData;
  }

  private static cleanAndValidateLoadedConfiguration() {
    // gitlab_project_name is required
    if (!this.configurationData.gitlab_project_name) {
      throw new Error(
        "Please either specify gitlab_project_name in autoupdater.yaml or " +
        "supply the AUTOUPDATER_PROJECT_NAME env variable)"
      );
    }

    if (getGitRootDirectory(this.projectRoot) === null) {
      throw new Error(
        `The provided project root directory '${this.projectRoot}' is neither a git repository nor a ` +
        `subdirectory of a git repository.`
      );
    }
    
    const relative = path.relative(this.projectRoot, ConfigurationManager.computeDeepestProjectRoot(this.configurationData));
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(
        `The package.json files provided in one of the configuration files do not belong to the project ` +
        `root directory '${this.projectRoot}}'. package.json files: ${this.configurationData.packages}`
      );
    }
    
    // target branch must exist
    const git = getGitClient(this.projectRoot);
    if (!git!.branchExists(this.configurationData.target_branch)) {
      throw new Error(`Branch "${this.configurationData.target_branch}" does not exist.`);
    }
    // branch must be different from target branch
    if (this.configurationData.branch === this.configurationData.target_branch) {
      throw new Error(`Autoupdate branch must be different from target branch "${this.configurationData.target_branch}".`);
    }

    // no unknown configuration is present
    // TODO

    // all user provided package.json files must exist
    this.configurationData.packages.forEach((packageJsonFile: string) => {
      if (!fs.existsSync(packageJsonFile))
        throw new Error(`Could not find package.json file "${packageJsonFile}".`);
    });
  }

  static computeDeepestProjectRoot({ packages }: ConfigurationDataPreComputation, loadedValue?: string): string {
    if (loadedValue) return loadedValue;
    if (packages.length === 0) return "";
    if (!packages.every(p => path.isAbsolute(p))) return "";

    let commonAncestor = "";
    if (packages.length === 1 || packages.every(p => p === packages[0])) {
      commonAncestor = path.dirname(packages[0]);
    } else {
      commonAncestor = commonAncestorPath(...packages) ?? "";
    }

    return getGitRootDirectory(commonAncestor) ?? "";
  }

}