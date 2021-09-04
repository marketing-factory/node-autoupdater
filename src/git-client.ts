import { prepareCommands } from './prepare-commands';
import { logger } from "./logger";

const GIT_COMMAND_DEFINITIONS = {
  init: (directory: string) => ({ args: ["init -y"], cwd: directory }),
  rootDirectory: (anySubdirectory: string) => ({args: ["rev-parse", "--show-toplevel"], cwd: anySubdirectory}),
  checkoutBranch: (branch: string) => ["checkout", branch],
  createBranch: (branch: string) => ["branch", branch],
  deleteLocalBranch: (branch: string) => ["branch", "-D", branch],
  deleteRemoteBranch: (repository: string, branch: string) => ["push", "-d", repository, branch],
  branchExists: (branch: string) => ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`],
  remoteBranchExists: (repository: string, branch: string) => ["ls-remote", "--exit-code", "--heads", repository, branch],
  stageAndCommit: (message: string) => ["commit", "-am", message],
  push: (repository="", branch="") => ["push", repository, branch]
} as const;

export function initGitDirectory(directory: string) {
  const initCommand = prepareCommands("git", { cmd: GIT_COMMAND_DEFINITIONS.init }).cmd;
  initCommand(directory);
}

export function getGitRootDirectory(anySubdirectory=process.cwd()) {
  const getRootDirectoryCommand = prepareCommands("git", {cmd: GIT_COMMAND_DEFINITIONS.rootDirectory}).cmd;
  try {
    return getRootDirectoryCommand(anySubdirectory);
  } catch (error) {
    return null;
  }
}

export function getGitClient(directory: string) {
  const rootDirectory = getGitRootDirectory(directory);
  if (rootDirectory === null) {
    logger.error(`Directory "${directory}" is neither a git repository nor a subdirectory of a git repository.`);
    return null;
  }
  const git = prepareCommands("git", GIT_COMMAND_DEFINITIONS, rootDirectory);
  return {

    ...git,

    branchExists(branch: string): boolean {
      try {
        git.branchExists(branch);
        return true;
      } catch (error) {
        return false;
      }
    },

    remoteBranchExists(repository: string, branch: string) {
      try {
        git.remoteBranchExists(repository, branch);
        return true;
      } catch (error) {
        return false;
      }
    },

    addAndCommitChanges(message: string, branch: string) {
      git.checkoutBranch(branch);
      git.stageAndCommit(message);
    }

  };
}