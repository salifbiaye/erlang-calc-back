import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CalculationModule } from '../calculation/calculation.module';

@Module({
  imports: [CalculationModule,PrismaModule],
  controllers: [SimulationController],
  providers: [SimulationService],
  exports: [SimulationService]
})
export class SimulationModule {}
