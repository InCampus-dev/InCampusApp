import { DataSource, EntityManager, ObjectType, FindOptionsWhere } from "typeorm";

/**
 * Executes a callback within a database transaction.
 * This is required by Task S07 to ensure atomicity for capacity checks
 * and participation record creation/updates.
 */
export async function executeTransaction<T>(
  dataSource: DataSource,
  action: (manager: EntityManager) => Promise<T>
): Promise<T> {
  return await dataSource.transaction(action);
}

/**
 * Fetches an entity with a pessimistic write lock.
 * Use this inside a transaction to lock the Activity row.
 * This prevents concurrent users from reading a stale CurrentParticipantCount
 * and exceeding the MaxParticipants limit (NFR-13).
 */
export async function findWithPessimisticWriteLock<T>(
  manager: EntityManager,
  entityClass: ObjectType<T>,
  where: FindOptionsWhere<T>
): Promise<T | null> {
  return await manager.findOne(entityClass, {
    where,
    lock: { mode: "pessimistic_write" },
  });
}