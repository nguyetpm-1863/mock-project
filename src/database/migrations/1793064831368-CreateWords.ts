import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWords1793064831368 implements MigrationInterface {
  name = 'CreateWords1793064831368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "words" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "content" character varying(255) NOT NULL, "meaning" character varying(1000) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_feaf97accb69a7f355fa6f58a3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_words_created_at" ON "words"  ("created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_words_created_at"`);
    await queryRunner.query(`DROP TABLE "words"`);
  }
}
