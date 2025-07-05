import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CalculationModule } from './calculation/calculation.module';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    CalculationModule, 
    SimulationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
