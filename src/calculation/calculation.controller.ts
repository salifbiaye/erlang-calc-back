// src/calculation/calculation.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CalculateDto } from './dto/calculation.dto';
import { CalculationService } from './calculation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('calculate')
export class CalculationController {
  constructor(private readonly calculationService: CalculationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async calculate(@Body() calculateDto: CalculateDto, @Req() req: Request) {

    
    
    try {
      switch (calculateDto.calculationType) {
        case 'channels':
          if (!calculateDto.traffic_intensity || !calculateDto.blocking_prob) {
            throw new Error('Paramètres manquants pour le calcul des canaux');
          }
          return await this.calculationService.calculateChannels(
            calculateDto.traffic_intensity,
            calculateDto.blocking_prob
          );

        case 'blocking':
          if (!calculateDto.num_channels || !calculateDto.traffic_load) {
            throw new Error('Paramètres manquants pour le calcul du taux de blocage');
          }
          return await this.calculationService.calculateBlocking(
            calculateDto.num_channels,
            calculateDto.traffic_load
          );

        case 'traffic':
          if (!calculateDto.available_channels || !calculateDto.target_blocking) {
            throw new Error('Paramètres manquants pour le calcul du trafic');
          }
          return await this.calculationService.calculateTraffic(
            calculateDto.available_channels,
            calculateDto.target_blocking
          );

        case 'population':
          if (!calculateDto.population || !calculateDto.call_rate || !calculateDto.avg_duration) {
            throw new Error('Paramètres manquants pour le calcul basé sur la population');
          }
          return await this.calculationService.calculatePopulation(
            calculateDto.population,
            calculateDto.call_rate,
            calculateDto.avg_duration
          );

        default:
          throw new Error('Type de calcul non pris en charge');
      }
    } catch (error) {
      return {
        error: error.message,
        success: false
      };
    }
  }
}