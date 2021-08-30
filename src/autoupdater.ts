import { PackageManager, OutdatedPackages } from "./package-manager";
import { GitClient } from "./git-client";
import { ConfigurationManager, ConfigurationData } from "./configuration-manager";
import { Gitlab } from "./git-hosting-providers/gitlab";

export interface Logger {
  log(message: string): void,
  error(message: string): void,
  group(label: string): void,
  groupEnd(): void
}

export class Autoupdater {
  private readonly packageManager: PackageManager;
  private readonly git: GitClient;
  private readonly gitlab: Gitlab;
  private readonly logger: Logger = console;
  private config: ConfigurationData;
  private outdatedPackages: OutdatedPackages;

  constructor() {
    this.packageManager = new PackageManager(this.logger);
    this.git = new GitClient(this.logger);
    this.gitlab= new Gitlab(this.config);
  }

  start() {
    try {
      this.config = ConfigurationManager.getConfigurationData();
    } catch (error) {
      this.logger.error(`Error while loading configuration: ${error}`);
      return;
    }
    const packageJsonFiles = this.config.packages;

    this.outdatedPackages = this.packageManager.getOutdatedPackages(packageJsonFiles);
    if (this.outdatedPackages === null) {
      this.logger.log("No updates are needed.");
    } else {
      this.cleanSideEffectsOfLastAutoupdate();
      this.git.createAndCheckoutBranch(this.config.branch)
      this.packageManager.updatePackages(packageJsonFiles);
      this.git.addAndCommitChanges(this.generateCommitMessage(true), this.config.branch);

      this.git.push(this.getRemoteUrl(), this.config.branch);
      this.createOrUpdateMergeRequest();
    }
  }

  cleanSideEffectsOfLastAutoupdate() {
    this.logger.group(`Cleaning state changes caused by last autoupdate`);
    if (this.git.branchExists(this.config.branch)) {
      this.logger.log(`Deleting old branch '${this.config.branch}'...`);
      this.git.deleteBranch(this.config.branch);
    }
    this.logger.groupEnd();
  }

  getRemoteUrl(useBasicAuth=false): string {
    let url = `${this.config.gitlab_url}/${this.config.gitlab_project_name}.git/`;
    if (useBasicAuth) {
      url = url.replace(/^https:\/\//, "");
      url = `https://${this.config.gitlab_user_username}:${this.config.gitlab_auth_token}@${url}`;
    }
    return url;
  }

  generateCommitTitle(): string {
    return `Automatic update on ${Date.now().toLocaleString()}`;
  }

  generateCommitMessage(generateTitle=false, outdatedPackages=this.outdatedPackages): string {
    let message = "";
    if (generateTitle) {
      message += this.generateCommitTitle() + "\n\n";
    }
    message += `${JSON.stringify(outdatedPackages)}`;
    return message;
  }

  async createOrUpdateMergeRequest() {
    let lastAutoupdateMergeRequest = await this.gitlab.getLastAutoupdateMergeRequest();
    if (lastAutoupdateMergeRequest) {

      this.logger.log("Creating merge request...");
      await this.gitlab.createMergeRequest(
        this.generateCommitTitle(),
        this.generateCommitMessage()
      );

    } else {

      this.logger.log("Updating merge request...");
      await this.gitlab.updateMergeRequest(
        lastAutoupdateMergeRequest.iid,
        this.generateCommitTitle(),
        this.generateCommitMessage()
      );

    }
  }
}