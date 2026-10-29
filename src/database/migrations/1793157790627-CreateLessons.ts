import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessons1793157790627 implements MigrationInterface {
  name = 'CreateLessons1793157790627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(255) NOT NULL, "description" character varying(1000), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lessons_created_at" ON "lessons"  ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_words" ("lesson_id" uuid NOT NULL, "word_id" uuid NOT NULL, CONSTRAINT "PK_d0eb24e2592e0dd82a803cde587" PRIMARY KEY ("lesson_id", "word_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45151ebfb7d6225d910b55deb2" ON "lesson_words"  ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab266388121f17435b5448312e" ON "lesson_words"  ("word_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_words" ADD CONSTRAINT "FK_45151ebfb7d6225d910b55deb27" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_words" ADD CONSTRAINT "FK_ab266388121f17435b5448312e8" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_words" DROP CONSTRAINT "FK_ab266388121f17435b5448312e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_words" DROP CONSTRAINT "FK_45151ebfb7d6225d910b55deb27"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab266388121f17435b5448312e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45151ebfb7d6225d910b55deb2"`,
    );
    await queryRunner.query(`DROP TABLE "lesson_words"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_lessons_created_at"`);
    await queryRunner.query(`DROP TABLE "lessons"`);
  }
}
