// src/calculation/dto/calculation.dto.ts
import { IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class CalculateDto {
  @IsIn(['channels', 'blocking', 'traffic', 'population'])
  calculationType: string;

  @IsNumber()
  @IsOptional()
  traffic_intensity?: number;

  @IsNumber()
  @IsOptional()
  blocking_prob?: number;

  @IsNumber()
  @IsOptional()
  num_channels?: number;

  @IsNumber()
  @IsOptional()
  traffic_load?: number;

  @IsNumber()
  @IsOptional()
  available_channels?: number;

  @IsNumber()
  @IsOptional()
  target_blocking?: number;

  @IsNumber()
  @IsOptional()
  population?: number;

  @IsNumber()
  @IsOptional()
  call_rate?: number;

  @IsNumber()
  @IsOptional()
  avg_duration?: number;

  @IsOptional()
  selectedZone?: {
    lat: number;
    lon: number;
    display_name: string;
  };
}