import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculationService } from '../calculation/calculation.service';
import { SimulationType } from '@prisma/client';

@Injectable()
export class SimulationService {
  constructor(
    private calculationService: CalculationService,
    private prisma: PrismaService
  ) {}

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

  async getSimulationStats(userId: string) {
    const stats = await this.prisma.simulation.groupBy({
      by: ['type'],
      where: {
        userId: userId
      },
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    });

    const allTypes = ['BLOCKING', 'CHANNELS', 'POPULATION', 'TRAFFIC'];
    return allTypes.map(type => {
      const stat = stats.find(s => s.type === type);
      return {
        type,
        count: stat?._count?.type || 0
      };
    });
  }

  async getSimulations(userId: string, page: number, limit: number, favoritesOnly: boolean) {
    const where = {
      userId,
      ...(favoritesOnly && {
        favoritedBy: {
          some: { id: userId }
        }
      })
    };

    const [simulations, total] = await Promise.all([
      this.prisma.simulation.findMany({
        where,
        include: {
          favoritedBy: {
            where: { id: userId },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.simulation.count({ where })
    ]);

    return {
      data: simulations.map(sim => ({
        ...sim,
        isFavorite: sim.favoritedBy.length > 0
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }

  async getSharedSimulations(userId: string, page: number, limit: number, favoritesOnly: boolean) {
    const where: any = {
      sharedWith: {
        some: { toUserId: userId }
      },
      ...(favoritesOnly && {
        favoritedBy: {
          some: { id: userId }
        }
      })
    };

    const [simulations, total] = await Promise.all([
      this.prisma.simulation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          favoritedBy: {
            where: { id: userId },
            select: { id: true }
          },
          sharedWith: {
            where: { toUserId: userId },
            select: { canEdit: true, canShare: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.simulation.count({ where })
    ]);

    return {
      data: simulations.map(sim => ({
        ...sim,
        isFavorite: sim.favoritedBy.length > 0,
        permissions: {
          canEdit: sim.sharedWith[0]?.canEdit || false,
          canShare: sim.sharedWith[0]?.canShare || false
        }
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }

  async getSimulationById(id: string, userId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        OR: [
          { id, userId },
          { 
            id,
            sharedWith: { 
              some: { toUserId: userId } 
            } 
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        favoritedBy: {
          where: { id: userId },
          select: { id: true }
        }
      }
    });

    if (!simulation) {
      throw new Error('Simulation non trouvée ou accès non autorisé');
    }

    return {
      ...simulation,
      isFavorite: simulation.favoritedBy.length > 0
    };
  }

  async toggleFavorite(id: string, userId: string, isFavorite: boolean) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { 
            sharedWith: { 
              some: { toUserId: userId } 
            } 
          }
        ]
      }
    });

    if (!simulation) {
      throw new Error('Simulation non trouvée ou accès non autorisé');
    }

    await this.prisma.simulation.update({
      where: { id },
      data: {
        favoritedBy: {
          [isFavorite ? 'connect' : 'disconnect']: { id: userId }
        }
      }
    });

    return { success: true };
  }

  async deleteSimulation(id: string, userId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: { id, userId }
    });

    if (!simulation) {
      throw new Error('Simulation non trouvée ou accès non autorisé');
    }

    await this.prisma.simulation.delete({ where: { id } });
    return { success: true };
  }

  async createSimulation(createSimulationDto: any, userId: string) {
    const simulationType = this.mapToSimulationType(createSimulationDto.type);
    if (!simulationType) {
      throw new Error('Type de simulation non valide');
    }

    return this.prisma.simulation.create({
      data: {
        user: { connect: { id: userId } },
        type: simulationType,
        formData: createSimulationDto.formData || {},
        result: createSimulationDto.result,
        chartData: createSimulationDto.chartData || null,
        aiAnalysis: createSimulationDto.aiAnalysis || null,
        zoneLat: createSimulationDto.zone?.lat || null,
        zoneLon: createSimulationDto.zone?.lon || null,
        zoneDisplayName: createSimulationDto.zone?.display_name || 
          (createSimulationDto.zone ? `Zone (${createSimulationDto.zone.lat}, ${createSimulationDto.zone.lon})` : null),
      },
    });
  }

  private mapToSimulationType(type: string): SimulationType | null {
    const validTypes = ['BLOCKING', 'CHANNELS', 'POPULATION', 'TRAFFIC'] as const;
    return validTypes.includes(type.toUpperCase() as any) ? type.toUpperCase() as SimulationType : null;
  }
}
