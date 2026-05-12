// Interfaccia per isolare l'accesso alla blocklist (Task DP02 / DUC-DP-01)
export interface BlockLookupPort {
  getBlockedAndBlockerIds(studentAccountId: string): Promise<string[]>;
}

export class FeedService {
  // TODO: Implementazione della ricerca feed per il Task DP02
}