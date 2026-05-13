import { DataSource, Repository } from "typeorm";

import { StudentProfile } from "../entities/StudentProfile";

export class StudentProfileRepo extends Repository<StudentProfile> {
  constructor(dataSource: DataSource) {
    super(StudentProfile, dataSource.createEntityManager());
  }

  public async findByStudentAccountId(studentAccountId: string): Promise<StudentProfile | null> {
    return this.findOne({ where: { studentAccountId } });
  }
}
