import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CalculationModule } from './calculation/calculation.module';
import { SimulationModule } from './simulation/simulation.module';
import { UserModule } from './user/user.module';
import { AiModule } from './ai/ai.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Modules de l'application
    CommonModule,
    AuthModule, 
    PrismaModule, 
    CalculationModule, 
    SimulationModule,
    UserModule,
    AiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
