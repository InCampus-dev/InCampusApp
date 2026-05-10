import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

import { CampusStructuredOptionType } from "../../../shared/src/domain/enums";

@Entity("campus_structured_options")
@Index("uq_campus_structured_options_campus_type_name", ["campusId", "optionType", "name"], {
  unique: true
})
export class CampusStructuredOption {
  @PrimaryGeneratedColumn("uuid")
  optionId!: string;

  @Index()
  @Column({ type: "uuid" })
  campusId!: string;

  @Column({ type: "enum", enum: CampusStructuredOptionType })
  optionType!: CampusStructuredOptionType;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
