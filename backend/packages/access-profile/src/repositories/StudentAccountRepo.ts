// Task: AP02 | Path: backend/packages/access-profile/src/repositories/StudentAccountRepo.ts

import { DataSource, Repository } from "typeorm";

import { StudentAccount } from "../entities/StudentAccount";

export class StudentAccountRepo extends Repository<StudentAccount> {
  constructor(dataSource: DataSource) {
    super(StudentAccount, dataSource.createEntityManager());
  }

  public async findByEmail(email: string): Promise<StudentAccount | null> {
    return this.findOne({ where: { universityEmail: email } });
  }

  public async findById(id: string): Promise<StudentAccount | null> {
    return this.findOne({ where: { studentAccountId: id } });
  }
}
