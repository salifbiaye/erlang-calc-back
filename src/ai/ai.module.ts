import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'GEMINI_API_KEY',
      useFactory: (configService: ConfigService) => {
        return configService.get<string>('GEMINI_API_KEY');
      },
      inject: [ConfigService],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
