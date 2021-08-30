import fs from "fs";
import { vol } from "memfs";
import { ConfigurationManager } from "../../src/configuration-manager";
import { getConfigFileAsString } from "../fixtures/get-config-file";

const CONFIGURATION_FILES = {
  "/autoupdate.yaml": getConfigFileAsString("autoupdate.yaml"),
  "/autoupdate-high-priority.yaml": getConfigFileAsString("autoupdate-high-priority.yaml"),
};

jest.mock("fs");

describe(ConfigurationManager.getConfigurationData, () => {
  beforeEach(() => {
    vol.reset();
    ConfigurationManager.deleteConfigurationData();
  });

  it("loads configuration from specified config file", () => {
    fs.writeFileSync("/autoupdate.yaml", CONFIGURATION_FILES["/autoupdate.yaml"]);

    const config = ConfigurationManager.getConfigurationData("/autoupdate.yaml");

    expect(config).toEqual({
      gitlab_url: "https://gitlab.com/",
      gitlab_user_username: "autoupdater",
      gitlab_user_email: "autoupdater@example.org",
      gitlab_auth_token: "personalaccesstoken123",
      gitlab_project_name: "example-project",
      assignee: "johndoe",
      branch: "support/autoupdate",
      target_branch: "develop",
      packages: ["package.json"]
    });
  });

  it("when loading from multiple config files and 2 files provide the same config, the file specified second will take precedence", () => {
    fs.writeFileSync("/autoupdate.yaml", CONFIGURATION_FILES["/autoupdate.yaml"]);
    fs.writeFileSync("/autoupdate-high-priority.yaml", CONFIGURATION_FILES["/autoupdate-high-priority.yaml"]);

    const config = ConfigurationManager.getConfigurationData("/autoupdate.yaml", "/autoupdate-high-priority.yaml");

    expect(config).toEqual({
      gitlab_url: "https://gitlab.com/",
      gitlab_user_username: "autoupdater",
      gitlab_user_email: "autoupdater@example.org",
      gitlab_auth_token: "personalaccesstoken123",
      gitlab_project_name: "example-project",
      assignee: "johndoe",
      branch: "automatic-updates",
      target_branch: "main",
      packages: ["package.json", "sub-project/package.json"]
    });
  });

  it("loads configuration from env variables when set", () => {
    process.env.AUTOUPDATER_PROJECT_NAME = "test-project-123";
    fs.writeFileSync("/autoupdate.yaml", CONFIGURATION_FILES["/autoupdate.yaml"]);

    const config = ConfigurationManager.getConfigurationData("/autoupdate.yaml");

    expect(config.gitlab_project_name).toEqual("test-project-123");
  });
});