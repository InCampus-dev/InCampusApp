import { DataSource, EntityManager, ObjectType, FindOptionsWhere } from "typeorm";

export async function executeTransaction<T>(
  dataSource: DataSource,
  runInTransaction: (manager: EntityManager) => Promise<T>
): Promise<T> {
  return await dataSource.transaction(runInTransaction);
}

export async function findWithPessimisticWriteLock<T>(
  manager: EntityManager,
  entityClass: ObjectType<T>,
  where: FindOptionsWhere<T>
): Promise<T | null> {
  return (await manager.findOne(entityClass as any, {
    where,
    lock: { mode: "pessimistic_write" }
  })) as T | null;
}