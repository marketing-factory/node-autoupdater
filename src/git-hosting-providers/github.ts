import { ConfigurationData } from "../configuration-manager";
import { GitHostingProvider } from "./git-hosting-provider";

export class Github implements GitHostingProvider {
  private readonly api: unknown;
  private readonly config: ConfigurationData;

  constructor(config: ConfigurationData) {
    this.config = config;
  }

  async getProject() {
  }

  async getAssignee() {
  }

  async getLastAutoupdateMergeRequest() {
  }

  async createMergeRequest(title: string, description: string) {
  }

  async updateMergeRequest(mergeRequestIid: number, title: string, description: string) {
  }
}