import { DataSource, EntityManager } from "typeorm";

export async function withTransaction<T>(
  dataSource: DataSource,
  work: (manager: EntityManager) => Promise<T>
): Promise<T> {
  return dataSource.transaction(work);
}
