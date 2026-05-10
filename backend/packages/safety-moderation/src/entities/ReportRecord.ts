import { CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("report_records")
export class ReportRecord {
  @PrimaryGeneratedColumn("uuid")
  reportId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
