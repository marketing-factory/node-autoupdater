import { load as loadYaml } from "js-yaml";
import fs from "fs";
import { join as pathJoin } from "path";
import { homedir } from "os";


export interface ConfigurationData {
  // App Configuration
  "gitlab_url": string,
  "gitlab_user_username"?: string,
  "gitlab_user_email"?: string,
  "gitlab_auth_token"?: string,
  // Project Configuration
  "gitlab_project_name": string,
  "assignee"?: string,
  "branch": string,
  "target_branch": string,
  "packages": string[],
}

/*
Priority order from lowest to highest (High priority configuration overrides low priority configuration): 
DEFAULT_CONFIGURATION_DATA
CONFIGURATION_SEARCH_PATHS
CONFIGURATION_ENV_VARIABLES
*/

const DEFAULT_CONFIGURATION_DATA: ConfigurationData = {
  // App Configuration
  "gitlab_url": "https://gitlab.com/",
  "gitlab_user_username": "",
  "gitlab_user_email": "",
  "gitlab_auth_token": "",
  // Project Configuration
  "gitlab_project_name": "",
  "assignee": "",
  "branch": "support/autoupdate",
  "target_branch": "develop",
  "packages": [pathJoin(process.cwd(), "package.json")],
};

// Last path has highest priority
const CONFIGURATION_FILE_PATHS = [
  "/etc/.autoupdater.yaml",
  pathJoin(homedir(), ".autoupdater.yaml"),
  `${process.cwd()}/.autoupdater.yaml`,
];

const CONFIGURATION_ENV_VARIABLES: Partial<Record<keyof ConfigurationData, string>> = {
  "gitlab_project_name": "AUTOUPDATER_PROJECT_NAME",
};

export abstract class ConfigurationManager {
  private static configurationData = DEFAULT_CONFIGURATION_DATA;
  private static configurationFilePaths = CONFIGURATION_FILE_PATHS;
  private static configurationDataIsLoaded = false;
  
  static getConfigurationData(...configurationFilePaths: string[]): ConfigurationData {
    this.configurationFilePaths = [...this.configurationFilePaths, ...configurationFilePaths];
    if (!this.configurationDataIsLoaded) {
      this.loadConfigurationData();
      this.configurationDataIsLoaded = true;
    }
    return this.configurationData;
  }

  static deleteConfigurationData() {
    this.configurationData = DEFAULT_CONFIGURATION_DATA;
    this.configurationDataIsLoaded = false;
  }

  private static loadConfigurationData() {
    this.loadConfigurationFromFiles();
    this.loadConfigurationFromEnvVariables();
    this.validateLoadedConfiguration();
  }

  private static loadConfigurationFromFiles() {
    let configurationFromOneFile: Partial<ConfigurationData>;
    for (const file of this.configurationFilePaths) {
      if (fs.existsSync(file)) {
        try {
          configurationFromOneFile = loadYaml(fs.readFileSync(file, "utf-8"));
          this.configurationData = { ...this.configurationData, ...configurationFromOneFile };
        } catch (error) {
          throw new Error(`Error while loading configuration from file ${file}: ${error.message}`);
        }
      }
    }
  }

  private static loadConfigurationFromEnvVariables() {
    let envConfigurationData: Partial<Record<keyof ConfigurationData, unknown>> = {};
    let configurationName: keyof ConfigurationData;
    let envVariable: string;

    for (configurationName in CONFIGURATION_ENV_VARIABLES) {
      envVariable = process.env[CONFIGURATION_ENV_VARIABLES[configurationName]];
      if (!envVariable) continue;

      if (typeof DEFAULT_CONFIGURATION_DATA[configurationName] === "string") {
        envConfigurationData[configurationName] = envVariable;
      } else {
        try {
          envConfigurationData[configurationName] = JSON.parse(envVariable);
        } catch (error) {
          throw new Error(`Non-string env variables must be in JSON format!\n${error.message}`);
        }
      }

    }

    this.configurationData = { ...this.configurationData, ...envConfigurationData as ConfigurationData }
  }

  private static validateLoadedConfiguration() {
    if (!this.configurationData.gitlab_project_name) {
      throw new Error(
        "Please either specify gitlab_project_name in autoupdater.yaml or " +
        "supply the AUTOUPDATER_PROJECT_NAME env variable)"
      );
    }
  }

  /*getConfig(key: keyof ConfigObject): ConfigObject[keyof ConfigObject] {
      return ;
  }*/
}