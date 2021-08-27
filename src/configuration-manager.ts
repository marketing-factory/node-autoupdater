const CONFIGURATION_SEARCH_PATHS = [
  "/etc/.node-autoupdater.yaml",
  "~/.node-autoupdater.yaml",
  `${process.cwd()}/.node-autoupdater.yaml`,
];

const DEFAULT_CONFIGURATION_DATA: Partial<ConfigurationData> = {
  "branch": "support/autoupdate",
  "target_branch": "develop",
};

const CONFIGURATION_ENV_VARIABLES: Partial<ConfigurationData> = {
  "gitlab_project_name": "AUTOUPDATER_PROJECT_NAME",
};

export interface ConfigurationData {
  // App Configuration
  "gitlab_url": string,
  "gitlab_user_username": string,
  "gitlab_user_email": string,
  "gitlab_auth_token": string,
  // Project Configuration
  "gitlab_project_name": string,
  "assignee": string,
  "branch": string,
  "target_branch": string,
  "packages": string[],
}

export abstract class ConfigurationManager {
  private static configurationData: ConfigurationData = DEFAULT_CONFIGURATION_DATA as ConfigurationData;

  static loadConfigurationData() {
    this.loadConfigurationFromFiles();
    this.loadConfigurationFromEnvVariables();
    this.validateLoadedConfiguration();
  }

  static getConfigurationData(): ConfigurationData {
    if (Object.keys(this.configurationData).length === 0) {
      this.loadConfigurationFromFiles();
    }
    return this.configurationData;
  }

  private static loadConfigurationFromFiles(...files: string[]) {

  }

  private static loadConfigurationFromEnvVariables() {

  }

  private static validateLoadedConfiguration() {

  }

  /*getConfig(key: keyof ConfigObject): ConfigObject[keyof ConfigObject] {
      return ;
  }*/
}