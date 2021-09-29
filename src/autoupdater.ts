import * as PackageManager from "./package-manager";
import { getGitClient } from "./git-client";
import { ConfigurationManager, ConfigurationData } from "./configuration-manager";
import { Gitlab } from "./git-hosting-providers/gitlab";
import { logger } from "./logger";
import path from "path";

export class Autoupdater {
  private readonly git: Exclude<ReturnType<typeof getGitClient>, null>;
  private readonly gitlab: Gitlab;
  private readonly config: ConfigurationData;
  private readonly projectRoot: string;
  private outdatedPackages: PackageManager.OutdatedPackages | null = null;
  private useBasicAuth = false;

  constructor(projectRoot: string, configurationFilePaths: string[]=[]) {
    // TODO: Improve error handling to avoid this mess:
    
    this.projectRoot = path.resolve(projectRoot);

    logger.group("Loading configuration...");
    const config = ConfigurationManager.getConfigurationData(this.projectRoot, ...configurationFilePaths);
    if (!config) throw new Error("An error occurred while loading configuration.");
    this.config = config;
    logger.groupEnd();
    
    const git = getGitClient(this.projectRoot);
    if (!git) throw new Error("Couldn't find project root.");
    this.git = git

    this.gitlab= new Gitlab(this.config);
  }

  start() {
    this.git.checkoutBranch(this.config.target_branch);
    this.prepare();

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
      this.createOrUpdateMergeRequest().then(() => {
        logger.log("Autoupdate completed.");
      });
      
    }
  }

  prepare() {
    // Disable username and password prompt
    process.env.GCM_INTERACTIVE = "never";
    process.env.GIT_TERMINAL_PROMPT = "0";
    if (!this.git.remoteCanBeAccessed(this.getRemoteUrl())) {
      this.useBasicAuth = true;
    }

    logger.group(`Cleaning state changes caused by last autoupdate`);
    if (this.git.branchExists(this.config.branch)) {
      logger.log(`Deleting old local branch '${this.config.branch}'...`);
      this.git.deleteLocalBranch(this.config.branch);
    }
    if (this.git.remoteBranchExists(this.getRemoteUrl(), this.config.branch)) {
      logger.log(`Deleting old remote branch '${this.config.branch}'...`);
      this.git.deleteRemoteBranch(this.getRemoteUrl(), this.config.branch);
    }
    logger.groupEnd();
  }

  getRemoteUrl(): string {
    let url = `${this.config.gitlab_url}/${this.config.gitlab_project_name}.git/`;
    if (this.useBasicAuth) {
      url = url.replace(/^https:\/\//, "");
      url = `https://${this.config.gitlab_user_username}:${this.config.gitlab_auth_token}@${url}`;
    }
    return url;
  }

  generateCommitTitle(): string {
    return `Automatic update on ${(new Date()).toLocaleString()}`;
  }

  generateCommitMessage(generateTitle=false, markdown=false, outdatedPackages=this.outdatedPackages): string {
    let message = "";

    if (generateTitle) {
      if (markdown) message += "## ";
      message +=`${this.generateCommitTitle()}\n\n`;
    }
    
    for (const packageJsonFile in outdatedPackages) {
      let projectName = this.getSubprojectRelativePath(packageJsonFile);

      if (markdown) projectName = "`" + projectName + "`";
      if (markdown) message += "### ";
      message += `Updates for ${projectName}\n`;
      for (const packageName in outdatedPackages[packageJsonFile]) {
        const { current, wanted } = outdatedPackages[packageJsonFile][packageName];
        let update = `${packageName} (${current} => ${wanted})`;
        if (markdown) update = "`" + update + "`"
        message += `  - ${update}\n`;
      }
      message += "\n";
    }

    return message;
  }

  getSubprojectRelativePath(packageJsonFile: string) {
    let subproject = path.posix.relative(
      path.join(this.projectRoot, ".."),
      path.join(packageJsonFile, "..")
    );
    return subproject.replace(
      /^.*\//, // project root
      this.config.gitlab_project_name.replace(/^.*\//, "") // project name without group prefix
    );
  }

  async createOrUpdateMergeRequest() {
    /* BUG: Pushing to the autoupdate branch always closes the last merge request.
     * This results in the value of lastAutoupdateMergeRequest to always be null, since 
     * looking for the last merge request happens after a git push.
     */
    let lastAutoupdateMergeRequest = await this.gitlab.getLastAutoupdateMergeRequest();
    if (!lastAutoupdateMergeRequest) {

      logger.log("Creating merge request...");
      await this.gitlab.createMergeRequest(
        this.generateCommitTitle(),
        this.generateCommitMessage(false, true)
      );

    } else {

      logger.log("Updating merge request...");
      await this.gitlab.updateMergeRequest(
        lastAutoupdateMergeRequest.iid,
        this.generateCommitTitle(),
        this.generateCommitMessage(false, true)
      );

    }
  }
}