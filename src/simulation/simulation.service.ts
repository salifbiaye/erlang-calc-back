import { Injectable } from '@nestjs/common';
import { CalculationService } from '../calculation/calculation.service';

@Injectable()
export class SimulationService {
  constructor(private calculationService: CalculationService) {}

  async generateSimulation(calculationType: string, params: any) {
    switch (calculationType) {
      case 'channels':
        return this.simulateChannels(params);
      case 'blocking':
        return this.simulateBlocking(params);
      case 'traffic':
        return this.simulateTraffic(params);
      case 'population':
        return this.simulatePopulation(params);
      default:
        throw new Error('Invalid simulation type');
    }
  }

  private async simulateChannels(params: any) {
    const { traffic_intensity, blocking_prob } = params;
    const result = await this.calculationService.calculateChannels(traffic_intensity, blocking_prob);
    
    // Générer des données de simulation pour différents scénarios
    const simulationData = [
      { traffic_intensity: traffic_intensity * 0.5, blocking_prob },
      { traffic_intensity: traffic_intensity * 0.75, blocking_prob },
      { traffic_intensity, blocking_prob },
      { traffic_intensity: traffic_intensity * 1.25, blocking_prob },
      { traffic_intensity: traffic_intensity * 1.5, blocking_prob },
    ];

    const simulations = await Promise.all(
      simulationData.map(async (data) => {
        const simResult = await this.calculationService.calculateChannels(
          data.traffic_intensity,
          data.blocking_prob
        );
        return {
          ...data,
          result: simResult.result,
          chartData: simResult.chartData
        };
      })
    );

    return {
      type: 'channels',
      formData: { calculationType: 'channels', traffic_intensity, blocking_prob },
      result: result.result,
      chartData: result.chartData,
      simulations,
      aiAnalysis: result.aiAnalysis
    };
  }

  private async simulateBlocking(params: any) {
    const { num_channels, traffic_load } = params;
    const result = await this.calculationService.calculateBlocking(num_channels, traffic_load);
    
    // Générer des données de simulation pour différents scénarios
    const simulationData = [
      { num_channels: Math.max(1, Math.floor(num_channels * 0.5)), traffic_load },
      { num_channels: Math.max(1, Math.floor(num_channels * 0.75)), traffic_load },
      { num_channels, traffic_load },
      { num_channels: Math.ceil(num_channels * 1.25), traffic_load },
      { num_channels: Math.ceil(num_channels * 1.5), traffic_load },
    ];

    const simulations = await Promise.all(
      simulationData.map(async (data) => {
        const simResult = await this.calculationService.calculateBlocking(
          data.num_channels,
          data.traffic_load
        );
        return {
          ...data,
          result: simResult.result,
          chartData: simResult.chartData
        };
      })
    );

    return {
      type: 'blocking',
      formData: { calculationType: 'blocking', num_channels, traffic_load },
      result: result.result,
      chartData: result.chartData,
      simulations,
      aiAnalysis: result.aiAnalysis
    };
  }

  private async simulateTraffic(params: any) {
    const { available_channels, target_blocking } = params;
    const result = await this.calculationService.calculateTraffic(available_channels, target_blocking);
    
    // Générer des données de simulation pour différents scénarios
    const simulationData = [
      { available_channels: Math.max(1, Math.floor(available_channels * 0.5)), target_blocking },
      { available_channels: Math.max(1, Math.floor(available_channels * 0.75)), target_blocking },
      { available_channels, target_blocking },
      { available_channels: Math.ceil(available_channels * 1.25), target_blocking },
      { available_channels: Math.ceil(available_channels * 1.5), target_blocking },
    ];

    const simulations = await Promise.all(
      simulationData.map(async (data) => {
        const simResult = await this.calculationService.calculateTraffic(
          data.available_channels,
          data.target_blocking
        );
        return {
          ...data,
          result: simResult.result,
          chartData: simResult.chartData
        };
      })
    );

    return {
      type: 'traffic',
      formData: { calculationType: 'traffic', available_channels, target_blocking },
      result: result.result,
      chartData: result.chartData,
      simulations,
      aiAnalysis: result.aiAnalysis
    };
  }

  private async simulatePopulation(params: any) {
    const { population, call_rate, avg_duration } = params;
    const result = await this.calculationService.calculatePopulation(population, call_rate, avg_duration);
    
    // Générer des données de simulation pour différents scénarios
    const simulationData = [
      { 
        population: Math.max(1, Math.floor(population * 0.5)), 
        call_rate: call_rate * 0.75,
        avg_duration: avg_duration * 0.8 
      },
      { 
        population: Math.max(1, Math.floor(population * 0.75)), 
        call_rate: call_rate * 0.9,
        avg_duration: avg_duration * 0.9 
      },
      { population, call_rate, avg_duration },
      { 
        population: Math.ceil(population * 1.25), 
        call_rate: call_rate * 1.1,
        avg_duration: avg_duration * 1.1 
      },
      { 
        population: Math.ceil(population * 1.5), 
        call_rate: call_rate * 1.25,
        avg_duration: avg_duration * 1.2 
      },
    ];

    const simulations = await Promise.all(
      simulationData.map(async (data) => {
        const simResult = await this.calculationService.calculatePopulation(
          data.population,
          data.call_rate,
          data.avg_duration
        );
        return {
          ...data,
          result: simResult.result,
          chartData: simResult.chartData
        };
      })
    );

    return {
      type: 'population',
      formData: { 
        calculationType: 'population', 
        population, 
        call_rate, 
        avg_duration 
      },
      result: result.result,
      chartData: result.chartData,
      simulations,
      aiAnalysis: result.aiAnalysis
    };
  }
}
