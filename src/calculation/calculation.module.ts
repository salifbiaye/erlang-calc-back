import { Module } from '@nestjs/common';
import { CalculationService } from './calculation.service';
import { CalculationController } from './calculation.controller';
import { ConfigModule } from '@nestjs/config';

// calculation.module.ts
@Module({
    imports: [ConfigModule],
    controllers: [CalculationController],  
    providers: [CalculationService],
    exports: [CalculationService]
  })
export class CalculationModule {} 