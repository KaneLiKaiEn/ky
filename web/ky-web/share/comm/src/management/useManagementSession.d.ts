import { type Resource } from "../resource";
export interface ManagementSession {
    sessionId: string;
    orgId: number;
    userId: number;
    userName: string;
    orgName: string;
    userTag?: string;
}
export declare function useManagementSession(requireUser?: boolean): Resource<ManagementSession>;
