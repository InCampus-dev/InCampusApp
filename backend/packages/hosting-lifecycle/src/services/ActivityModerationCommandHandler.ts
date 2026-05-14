import { DataSource } from "typeorm";
import { Activity } from "../entities/Activity";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";

// L'interfaccia esatta definita nel documento UCR - S&M v1.3
export interface RequestActivityModerationAction {
  reportId: string;
  activityId: string;
  actionType: "remove_activity";
  campusId: string;
  reviewOutcomeId?: string;
}

export class ActivityModerationCommandHandler {
  constructor(private dataSource: DataSource) {}

  /**
   * Gestisce il comando di moderazione proveniente da SM.
   * Esegue l'hard-delete nativo su DS-HL-001 (che casca su DS-HL-002).
   */
  public async handle(command: RequestActivityModerationAction): Promise<void> {
    // 1. Validazione del comando
    if (command.actionType !== "remove_activity") {
      console.warn(`[HL07] Ignored unsupported moderation action: ${command.actionType}`);
      return;
    }

    console.log(`[HL07] Executing moderation removal for activity: ${command.activityId} (Report: ${command.reportId})`);

    // 2. Operazione atomica con lock pessimistico per evitare conflitti di concorrenza
    await executeTransaction(this.dataSource, async (manager) => {
      const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId: command.activityId });

      if (!activity) {
        console.log(`[HL07] Activity ${command.activityId} already deleted or not found. Skipping.`);
        return;
      }

      // 3. Verifica di isolamento per tenant (Campus)
      if (activity.campusId !== command.campusId) {
        throw new Error(`[HL07] Campus mismatch during moderation removal. Expected ${command.campusId}, found ${activity.campusId}.`);
      }

      // 4. Hard-Delete fisico (DS-HL-001).
      // Nota: Le partecipazioni (DS-HL-002) verranno rimosse in automatico dal database 
      // grazie a `{ onDelete: "CASCADE" }` definito nell'entità Participation.
      await manager.remove(Activity, activity);
      
      console.log(`[HL07] Activity ${command.activityId} successfully hard-deleted by moderation.`);
    });
  }
}