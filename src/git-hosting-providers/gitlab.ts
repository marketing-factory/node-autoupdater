import { Gitlab as GitlabApi, Types as GitlabTypes } from "@gitbeaker/node";
import { ConfigurationData } from "../configuration-manager";
import { GitHostingProvider } from "./git-hosting-provider";

export class Gitlab implements GitHostingProvider {
  private readonly api: InstanceType<typeof GitlabApi>;
  private readonly config: ConfigurationData;
  private projectId: Promise<number>;
  private assigneeId: Promise<number | undefined>;

  constructor(config: ConfigurationData) {
    this.config = config;
    this.api = new GitlabApi({
      host: config.gitlab_url, 
      token: config.gitlab_auth_token
    });
    this.projectId = this.getProjectId();
    this.assigneeId = this.getAssigneeId();  
  }

  async getProjectId() {
    return (await this.api.Projects.show(this.config.gitlab_project_name)).id;
  }

  async getAssigneeId() {
    if (this.config.assignee) {
      const users = await this.api.Users.all({
        "username": this.config.assignee
      });
      if (users.length)
        return users[0].id;
    }
    return undefined;
  }

  async getLastAutoupdateMergeRequest() {
    const mergeRequests = await this.api.MergeRequests.all({
      projectId: await this.projectId,
      sourceBranch: this.config.branch,
      state: "opened"
    });
    if (mergeRequests.length)
      return mergeRequests[0];
    return null;
  }

  async createMergeRequest(title: string, description: string) {
    await this.api.MergeRequests.create(
      await this.projectId,
      this.config.branch,
      this.config.target_branch,
      title,
      {
        assigneeId: await this.assigneeId,
        description: description,
        removeSourceBranch: true,
        squash: true
      }
    );
  }

  async updateMergeRequest(mergeRequestIid: number, title: string, description: string) {
    await this.api.MergeRequests.edit(
      await this.projectId,
      mergeRequestIid,
      {
        title: title,
        description: description,
        assigneeId: await this.assigneeId,
        removeSourceBranch: true,
        squash: true
      }
    );
  }
}