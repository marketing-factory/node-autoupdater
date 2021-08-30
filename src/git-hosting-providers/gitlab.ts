import { Gitlab as GitlabApi, Types as GitlabTypes } from "@gitbeaker/node";
import { ConfigurationData } from "../configuration-manager";
import { GitHostingProvider } from "./git-hosting-provider";

export class Gitlab implements GitHostingProvider {
  private readonly api: InstanceType<typeof GitlabApi>;
  private readonly config: ConfigurationData;
  private project: GitlabTypes.ProjectExtendedSchema;
  private assignee: GitlabTypes.UserSchema;

  constructor(config: ConfigurationData) {
    this.config = config;
    this.api = new GitlabApi({
      host: config.gitlab_url, 
      token: config.gitlab_auth_token
    });
    this.init();
  }

  async init() {
    this.project = await this.getProject();
    this.assignee = await this.getAssignee();
  }

  async getProject() {
    return await this.api.Projects.show(this.config.gitlab_project_name);
  }

  async getAssignee() {
    if (this.config.assignee) {
      const users = await this.api.Users.all({
        "username": this.config.assignee
      });
      if (users.length)
        return users[0];
    }
    return null;
  }

  async getLastAutoupdateMergeRequest() {
    const mergeRequests = await this.api.MergeRequests.all({
      projectId: this.project.id,
      sourceBranch: this.config.branch,
      state: "opened"
    });
    if (mergeRequests.length)
      return mergeRequests[0];
    return null;
  }

  async createMergeRequest(title: string, description: string) {
    await this.api.MergeRequests.create(
      this.project.id,
      this.config.branch,
      this.config.target_branch,
      title,
      {
        assigneeId: this.assignee.id,
        description: description,
        removeSourceBranch: true,
        squash: true
      }
    );
  }

  async updateMergeRequest(mergeRequestIid: number, title: string, description: string) {
    await this.api.MergeRequests.edit(
      this.project.id,
      mergeRequestIid,
      {
        title: title,
        description: description,
        assigneeId: this.assignee.id,
        removeSourceBranch: true,
        squash: true
      }
    );
  }
}