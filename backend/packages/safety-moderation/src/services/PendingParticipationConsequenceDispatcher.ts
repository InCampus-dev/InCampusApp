export interface PendingParticipationConsequenceDispatcher {
  handleNewBlock(args: {
    blockId: string;
    initiatorAccountId: string;
    blockedAccountId: string;
  }): Promise<void>;
}

export const noOpPendingParticipationConsequenceDispatcher: PendingParticipationConsequenceDispatcher =
  {
    async handleNewBlock(): Promise<void> {}
  };
