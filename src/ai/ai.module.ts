import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'GEMINI_API_KEY',
      useFactory: (configService: ConfigService) => {
        return process.env.GEMINI_API_KEY;
      },
      inject: [ConfigService],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
