declare module 'ci-env' {
  export const repo: string | undefined;
  export const sha: string | undefined;
  export const event: string | undefined;
  export const commit_message: string | undefined;
  export const branch: string | undefined;
  export const pull_request_number: string | undefined;
  export const pull_request_target_branch: string | undefined;
  export const ci: string | undefined;
  export const platform: string | undefined;
  export const jobUrl: string | undefined;
  export const buildUrl: string | undefined;
}
