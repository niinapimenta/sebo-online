<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('status')->default('confirmado');
            $table->decimal('total', 20, 2);
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('itens_pedido', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('livro_id')->nullable()->constrained('livros')->nullOnDelete();
            $table->foreignId('vendedor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('livro_titulo');
            $table->string('livro_autor');
            $table->string('livro_foto')->nullable();
            $table->string('vendedor_nome')->nullable();
            $table->decimal('preco_unitario', 10, 2);
            $table->unsignedInteger('quantidade');
            $table->decimal('subtotal', 20, 2);
            $table->timestamps();
            $table->index(['pedido_id', 'livro_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('itens_pedido');
        Schema::dropIfExists('pedidos');
    }
};
