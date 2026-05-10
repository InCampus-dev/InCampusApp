import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("campuses")
export class Campus {
  @PrimaryGeneratedColumn("uuid")
  campusId!: string;

  @Column({ type: "varchar", length: 255 })
  universityName!: string;

  @Column({ type: "varchar", length: 255 })
  campusName!: string;

  @Column({ type: "boolean", default: false })
  activationStatus!: boolean;
}
