import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [
    // Exportez ici les providers, services, etc. que vous voulez rendre disponibles
    // pour les modules qui importeront le CommonModule
  ],
})
export class CommonModule {}
