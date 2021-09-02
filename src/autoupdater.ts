import * as PackageManager from "./package-manager";
import { getGitClient } from "./git-client";
import { ConfigurationManager, ConfigurationData } from "./configuration-manager";
import { Gitlab } from "./git-hosting-providers/gitlab";
import { logger } from "./logger";

export class Autoupdater {
  private readonly git: Exclude<ReturnType<typeof getGitClient>, null>;
  private readonly gitlab: Gitlab;
  private readonly config: ConfigurationData;
  private outdatedPackages: PackageManager.OutdatedPackages | null = null;

  constructor(...configurationFilePaths: string[]) {
    // TODO: Improve error handling to avoid this mess:
    logger.group("Loading configuration...");
    const config = ConfigurationManager.getConfigurationData(...configurationFilePaths);
    logger.groupEnd();
    if (config) {
      this.config = config;
      this.gitlab= new Gitlab(this.config);
      const git = getGitClient(this.config.project_root_directory);
      if (git)
        this.git = git
      else
        throw new Error();
    } else {
      throw new Error();
    }
  }

  start() {
    this.git.checkoutBranch(this.config.target_branch);
    this.cleanStateChangesByLastAutoupdate();

    const packageJsonFiles = this.config.packages;
    this.outdatedPackages = PackageManager.getOutdatedPackages(packageJsonFiles);
    if (this.outdatedPackages === null) {
      logger.log("No updates are needed.");
    } else {
      this.git.createBranch(this.config.branch);
      this.git.checkoutBranch(this.config.branch);
      PackageManager.updatePackages(packageJsonFiles);
      this.git.addAndCommitChanges(this.generateCommitMessage(true), this.config.branch);

      this.git.push(this.getRemoteUrl(), this.config.branch);
      this.git.checkoutBranch(this.config.target_branch);
      this.createOrUpdateMergeRequest();
      
    }
  }

  cleanStateChangesByLastAutoupdate() {
    logger.group(`Cleaning state changes caused by last autoupdate`);
    if (this.git.branchExists(this.config.branch)) {
      logger.log(`Deleting old local branch '${this.config.branch}'...`);
      this.git.deleteLocalBranch(this.config.branch);
      logger.log(`Deleting old remote branch '${this.config.branch}'...`);
      this.git.deleteRemoteBranch(this.getRemoteUrl(), this.config.branch);
    }
    logger.groupEnd();
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
    if (!lastAutoupdateMergeRequest) {

      logger.log("Creating merge request...");
      await this.gitlab.createMergeRequest(
        this.generateCommitTitle(),
        this.generateCommitMessage()
      );

    } else {

      logger.log("Updating merge request...");
      await this.gitlab.updateMergeRequest(
        lastAutoupdateMergeRequest.iid,
        this.generateCommitTitle(),
        this.generateCommitMessage()
      );

    }
  }
}