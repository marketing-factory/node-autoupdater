import { Gitlab, Types as GitlabTypes } from '@gitbeaker/node';
import { execSync } from "child_process";
import { GitCommands as Git } from "./git-commands";
import type { Logger } from "./app";

export class GitClient {
    private logger: Logger;
    private gitlab: InstanceType<typeof Gitlab>;

    constructor(logger: Logger = console) {
        this.logger = logger;
        this.gitlab = new Gitlab({});
    }

    /*async authenticate(username: string, passwordOrToken: string): Promise<boolean> {

    }*/

    createAndCheckoutBranch(branchName: string) {
        if (this.branchExists(branchName)) {
            this.logger.log(`Deleting old ${branchName} branch...`);
            execSync(Git.deleteBranch(branchName));
        }
        this.logger.log(`Creating new branch ${branchName}`);
        execSync(Git.createAndCheckoutBranch(branchName));
    }

    branchExists(branchName: string): boolean {
        try {
            execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
            return true;
        } catch (error) {
            return false;
        }
    }
}

let ok = new GitClient(console);