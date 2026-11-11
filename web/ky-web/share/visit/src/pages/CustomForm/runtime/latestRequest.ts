/** Invalidating also rejects responses from requests that cannot be aborted. */
export class LatestRequest {
  private version = 0;

  begin(): number {
    return ++this.version;
  }

  invalidate(): void {
    this.version++;
  }

  isCurrent(version: number): boolean {
    return this.version === version;
  }
}
