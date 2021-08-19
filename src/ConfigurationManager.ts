interface ConfigObject {
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

export abstract class ConfigurationManager {
    private configLocations: string[] = [
        "~/.node-autoupdater.yaml",

    ];
    static data: ConfigObject;

    static loadConfigurationFromFiles(): void {

    }

    static getConfig(key: keyof ConfigObject): ConfigObject[keyof ConfigObject] {
        return ;
    }
}