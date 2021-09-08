import fs from "fs";
import { vol } from "memfs";
import path from "path";
import { ConfigurationManager } from "../../src/configuration-manager";
import { getConfigFileAsString } from "../fixtures/get-config-file";

const CONFIGURATION_FILES = {
  "/autoupdate.yaml": getConfigFileAsString("autoupdate.yaml"),
  "/autoupdate-high-priority.yaml": getConfigFileAsString("autoupdate-high-priority.yaml"),
};

process.chdir("/");

jest.mock("fs");

jest.mock("../../src/git-client", () => {
  const originalModule = jest.requireActual("../../src/git-client");
  return {
    __esModule: true,
    ...originalModule,
    getGitClient: (directory: string) => {
      return { branchExists: (branch: string) => true };
    },
    getGitRootDirectory: (_?: string) => "/"
  };
});

describe(ConfigurationManager.getConfigurationData, () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      "/package.json": "",
      "/sub-project/package.json": ""
    });
    ConfigurationManager.resetConfigurationData();
  });

  it("loads configuration from specified config file", () => {
    fs.writeFileSync("/autoupdate.yaml", CONFIGURATION_FILES["/autoupdate.yaml"]);

    const config = ConfigurationManager.getConfigurationData("/", "/autoupdate.yaml");

    expect(config).toEqual({
      gitlab_url: "https://gitlab.com/",
      gitlab_user_username: "autoupdater",
      gitlab_user_email: "autoupdater@example.org",
      gitlab_auth_token: "personalaccesstoken123",
      gitlab_project_name: "example-project",
      assignee: "johndoe",
      branch: "support/autoupdate",
      target_branch: "develop",
      packages: [path.resolve("/", "package.json")]
    });
  });

  it("when loading from multiple config files and 2 files provide the same config, the file specified second will take precedence", () => {
    fs.writeFileSync("/autoupdate.yaml", CONFIGURATION_FILES["/autoupdate.yaml"]);
    fs.writeFileSync("/autoupdate-high-priority.yaml", CONFIGURATION_FILES["/autoupdate-high-priority.yaml"]);

    const config = ConfigurationManager.getConfigurationData("/", "/autoupdate.yaml", "/autoupdate-high-priority.yaml");

    expect(config).toEqual({
      gitlab_url: "https://gitlab.com/",
      gitlab_user_username: "autoupdater",
      gitlab_user_email: "autoupdater@example.org",
      gitlab_auth_token: "personalaccesstoken123",
      gitlab_project_name: "example-project",
      assignee: "johndoe",
      branch: "automatic-updates",
      target_branch: "main",
      packages: ["package.json", "sub-project/package.json"].map(p => path.resolve("/", p))
    });
  });

  it("loads configuration from env variables when set", () => {
    process.env.AUTOUPDATER_PROJECT_NAME = "test-project-123";
    fs.writeFileSync("/autoupdate.yaml", CONFIGURATION_FILES["/autoupdate.yaml"]);

    const config = ConfigurationManager.getConfigurationData("/", "/autoupdate.yaml");

    expect(config!.gitlab_project_name).toEqual("test-project-123");
  });
});