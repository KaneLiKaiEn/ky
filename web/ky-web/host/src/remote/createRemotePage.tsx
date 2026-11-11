import React from "react";
import RemoteModuleLoader from "./RemoteModuleLoader";
import { loadRemoteModule } from "./loadRemoteModule";

interface CreateRemotePageOptions {
  remoteId: string;
  displayName?: string;
}

const createRemotePage = (options: CreateRemotePageOptions) => {
  const RemoteComponent = React.lazy(() => loadRemoteModule(options.remoteId));

  const RemotePage: React.FC = () => {
    return (
      <RemoteModuleLoader>
        <RemoteComponent />
      </RemoteModuleLoader>
    );
  };

  RemotePage.displayName = options.displayName ?? "RemotePage";

  return RemotePage;
};

export default createRemotePage;
