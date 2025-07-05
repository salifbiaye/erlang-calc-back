import { IsString, IsNumber, IsOptional, IsObject, IsIn } from 'class-validator';

export class CreateSimulationDto {
  @IsIn(['channels', 'blocking', 'traffic', 'population'])
  type: string;

  @IsObject()
  formData: {
    calculationType: string;
    [key: string]: any;
  };

  @IsNumber()
  @IsOptional()
  result?: number;

  @IsObject()
  @IsOptional()
  chartData?: any;

  @IsString()
  @IsOptional()
  aiAnalysis?: string;

  @IsObject()
  @IsOptional()
  zone?: {
    id?: string;
    lat: number;
    lon: number;
    display_name: string;
  };
}
