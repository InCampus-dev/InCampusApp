import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity("block_relationships")
@Index("uq_block_relationships_initiator_blocked", ["initiatorAccountId", "blockedAccountId"], {
  unique: true
})
export class BlockRelationship {
  @PrimaryGeneratedColumn("uuid")
  blockId!: string;

  @Index()
  @Column({ type: "uuid" })
  initiatorAccountId!: string;

  @Index()
  @Column({ type: "uuid" })
  blockedAccountId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
