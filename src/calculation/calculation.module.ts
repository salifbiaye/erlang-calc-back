import { Module } from '@nestjs/common';
import { CalculationService } from './calculation.service';
import { CalculationController } from './calculation.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';

// calculation.module.ts
@Module({
  imports: [ConfigModule],
  controllers: [CalculationController],  
  providers: [
    CalculationService,
    {
      provide: 'GEMINI_API_KEY',
      useFactory: (configService: ConfigService) => 
        configService.get<string>('GEMINI_API_KEY'),
      inject: [ConfigService],
    },
    AiService
  ],
  exports: [CalculationService]
})
export class CalculationModule {} 