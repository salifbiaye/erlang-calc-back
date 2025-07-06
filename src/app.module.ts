import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CalculationModule } from './calculation/calculation.module';
import { SimulationModule } from './simulation/simulation.module';
import { UserModule } from './user/user.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
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
