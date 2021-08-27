import { Gitlab } from "./gitlab";

/**
 * Represents a facade of a repository hosting provider's API, providing only
 * the functionalities needed by the autoupdater.
 */
export interface GitHostingProvider {
  getLastAutoupdateMergeRequest(): Promise<any>;

  createMergeRequest(title: string, description: string): Promise<void>;

  updateMergeRequest(mergeRequestIid: number, title: string, description: string): Promise<void>;
}

export function getHostingProviderFromUrl(url: string) {
const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("gitlab"))
    return Gitlab;
  return null;
}