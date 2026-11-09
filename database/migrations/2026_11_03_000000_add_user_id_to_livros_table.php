<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            // SQLite can add a nullable REFERENCES column directly. Keeping
            // this out of Schema::table() avoids Laravel's table rebuild here.
            DB::statement(
                'ALTER TABLE "livros" ADD COLUMN "user_id" INTEGER NULL REFERENCES "users" ("id") ON DELETE SET NULL'
            );
            DB::statement('CREATE INDEX "livros_user_id_index" ON "livros" ("user_id")');

            return;
        }

        Schema::table('livros', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('DROP INDEX "livros_user_id_index"');
            DB::statement('ALTER TABLE "livros" DROP COLUMN "user_id"');

            return;
        }

        Schema::table('livros', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
