import { type } from "os";

const CONFIGURATION_SEARCH_PATHS = [
    "/etc/.node-autoupdater.yaml",
    "~/.node-autoupdater.yaml",
    `${process.cwd()}/.node-autoupdater.yaml`,
];

interface ConfigurationData {
    // App Configuration
    "gitlab_url": string,
    "gitlab_user_username": string,
    "gitlab_user_email": string,
    "gitlab_auth_token": string,
    // Project Configuration
    "assignee": string,
    "branch": string,
    "packages": string[]
}
export type { ConfigurationData };

export abstract class ConfigurationManager {
    private static configurationData: ConfigurationData;

    static loadConfigurationFromFiles(...files: string[]): void {
        
    }

    static getConfigurationData(): ConfigurationData {
        if (Object.keys(this.configurationData).length === 0) {
            this.loadConfigurationFromFiles();
        }
        return this.configurationData;
    }

    /*getConfig(key: keyof ConfigObject): ConfigObject[keyof ConfigObject] {
        return ;
    }*/
}