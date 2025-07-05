// src/common/dto/pagination.dto.ts
import { IsOptional, IsNumber, Min, Max, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsBooleanString()
  favoritesOnly?: string; // On le gère comme une chaîne
}