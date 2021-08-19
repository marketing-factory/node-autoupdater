export abstract class GitCommands {
    static createAndCheckoutBranch = (branchName: string) => `git checkout -b ${branchName}`;
    static deleteBranch = (branchName: string) => `git branch -d ${branchName}`;
}