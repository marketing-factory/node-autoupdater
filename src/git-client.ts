import { prepareCommands } from './prepare-commands';
import { Logger } from "./autoupdater";

const GIT_COMMANDS = {
  checkoutBranch: (branch: string) => ["checkout", branch],
  createBranch: (branch: string) => ["branch", branch],
  deleteBranch: (branch: string) => ["branch", "-d", branch],
  branchExists: (branch: string) => ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`],
  stageAndCommit: (message: string) => ["commit", "-am", message],
  push: (repository = "", branch = "") => ["push", repository, branch]
} as const;

export class GitClient {
  private readonly logger: Logger;
  private readonly git = prepareCommands("git", GIT_COMMANDS);

  constructor(logger: Logger = console) {
    this.logger = logger;
  }

  createAndCheckoutBranch(branch: string) {
    this.git.createBranch(branch);
    this.git.checkoutBranch(branch);
  }

  branchExists(branch: string): boolean {
    try {
      this.git.branchExists(branch);
      return true;
    } catch (error) {
      return false;
    }
  }

  deleteBranch(branch: string) {
    this.git.deleteBranch(branch);
  }

  addAndCommitChanges(message: string, branch: string) {
    this.git.checkoutBranch(branch);
    this.git.stageAndCommit(message);
  }

  push(repository: string, branch: string) {
    this.git.push(repository, branch);
  }
}