import { IsString, IsNumber, IsOptional, IsObject, IsIn, IsNotEmpty } from 'class-validator';

export class CreateSimulationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['channels', 'blocking', 'traffic', 'population'], {
    message: 'type must be one of the following values: channels, blocking, traffic, population'
  })
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
