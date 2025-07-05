import { Controller, Post, Body,Get,Query, UseGuards, Request, BadRequestException, Delete, Param, ParseUUIDPipe, HttpCode, HttpStatus, NotFoundException, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SimulationType } from '@prisma/client';
import { PaginationParams } from 'src/common/dto/pagination.dto';
type UserRequest = Request & { user: { userId: string } };

interface CreateSimulationDto {
  type: string;
  formData?: any;
  result?: number;
  chartData?: any;
  aiAnalysis?: string;
  zone?: {
    lat: number;
    lon: number;
    display_name?: string;
  };
}

@Controller('simulations')
export class SimulationController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @UseGuards(JwtAuthGuard)
  async getSimulations(
    @Request() req,
    @Query() query: PaginationParams
  ) {
    // Conversion explicite des paramètres
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const favoritesOnly = query.favoritesOnly === 'true'; // Conversion de la chaîne en booléen
  
    const userId = req.user.userId;
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      ...(favoritesOnly && {
        favoritedBy: {
          some: {
            id: userId
          }
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
        skip,
        take: limit, // Utilisation directe de limit déjà converti en nombre
      }),
      this.prisma.simulation.count({ where })
    ]);
  
    const totalPages = Math.ceil(total / limit);
  
    return {
      data: simulations.map(sim => ({
        ...sim,
        isFavorite: sim.favoritedBy.length > 0
      })),
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    };
  }
  @Get('shared')
  @UseGuards(JwtAuthGuard)
  async getSharedSimulations(
    @Request() req,
    @Query() { page = 1, limit = 10, favoritesOnly }: PaginationParams
  ) {
    const userId = req.user.userId;
    const skip = (page - 1) * limit;
    
    // Construire la condition where
    const where: any = {
      sharedWith: {
        some: {
          toUserId: userId
        }
      }
    };

    // Ajouter le filtre des favoris si nécessaire
    if (favoritesOnly === 'true') {
      where.favoritedBy = {
        some: { id: userId }
      };
    }

    const [simulations, total] = await Promise.all([
      this.prisma.simulation.findMany({
        where,
        include: {
          user: {  // Inclure les infos du propriétaire
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
          sharedWith: {  // Inclure les détails du partage
            where: { toUserId: userId },
            select: {
              canEdit: true,
              canShare: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.simulation.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: simulations.map(sim => ({
        ...sim,
        isFavorite: sim.favoritedBy.length > 0,
        // Extraire les permissions de partage
        permissions: {
          canEdit: sim.sharedWith[0]?.canEdit || false,
          canShare: sim.sharedWith[0]?.canShare || false
        }
      })),
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    };
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSimulationById(
    @Param('id') id: string,
    @Request() req
  ) {
    const userId = req.user.userId;

    const simulation = await this.prisma.simulation.findFirst({
      where: {
        OR: [
          { id, userId }, // Soit c'est la simulation de l'utilisateur
          { 
            id,
            sharedWith: { 
              some: { toUserId: userId } 
            } 
          } // Soit elle lui a été partagée
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
      throw new NotFoundException('Simulation non trouvée ou accès non autorisé');
    }

    return {
      ...simulation,
      isFavorite: simulation.favoritedBy.length > 0
    };
  }

// Mettre à jour le statut de favori
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async toggleFavorite(
    @Param('id') id: string,
    @Query('favorite') favorite: string,
    @Request() req
  ) {
    const userId = req.user.userId;
    const isFavorite = favorite === 'true';

    // Vérifier que la simulation existe et est accessible
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id,
        OR: [
          { userId }, // Soit c'est la simulation de l'utilisateur
          { 
            sharedWith: { 
              some: { toUserId: userId } 
            } 
          } // Soit elle lui a été partagée
        ]
      }
    });

    if (!simulation) {
      throw new NotFoundException('Simulation non trouvée ou accès non autorisé');
    }

    if (isFavorite) {
      // Ajouter aux favoris
      await this.prisma.simulation.update({
        where: { id },
        data: {
          favoritedBy: {
            connect: { id: userId }
          }
        }
      });
    } else {
      // Retirer des favoris
      await this.prisma.simulation.update({
        where: { id },
        data: {
          favoritedBy: {
            disconnect: { id: userId }
          }
        }
      });
    }

    return { success: true };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSimulation(
    @Body() createSimulationDto: CreateSimulationDto,
    @Request() req: UserRequest
  ) {
    const userId = req.user.userId;
    
    // Valider le type de simulation
    const simulationType = this.mapToSimulationType(createSimulationDto.type);
    if (!simulationType) {
      throw new BadRequestException('Type de simulation invalide');
    }

    // Créer la simulation avec les informations de zone
    const simulation = await this.prisma.simulation.create({
      data: {
        user: { connect: { id: userId } },
        type: simulationType,
        formData: createSimulationDto.formData || {},
        result: createSimulationDto.result,
        chartData: createSimulationDto.chartData || null,
        aiAnalysis: createSimulationDto.aiAnalysis || null,
        // Informations de zone
        zoneLat: createSimulationDto.zone?.lat || null,
        zoneLon: createSimulationDto.zone?.lon || null,
        zoneDisplayName: createSimulationDto.zone?.display_name || 
          (createSimulationDto.zone ? `Zone (${createSimulationDto.zone.lat}, ${createSimulationDto.zone.lon})` : null),
      },
    });

    return simulation;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSimulation(
    @Param('id') id: string,  // Retirer ParseUUIDPipe
    @Request() req
  ) {
    const userId = req.user.userId;
  
    // Vérifier que la simulation existe et appartient à l'utilisateur
    const simulation = await this.prisma.simulation.findFirst({
      where: { 
        id,
        userId  // Vérifie l'appartenance en une seule requête
      }
    });
  
    if (!simulation) {
      throw new NotFoundException('Simulation non trouvée ou accès non autorisé');
    }
  
    // Si on arrive ici, c'est que la simulation existe et appartient à l'utilisateur
    await this.prisma.simulation.delete({
      where: { id }
    });
  }

  private mapToSimulationType(type: string): SimulationType | null {
    try {
      if (Object.values(SimulationType).includes(type as SimulationType)) {
        return type as SimulationType;
      }
      
      const typeMap: Record<string, SimulationType> = {
        'channels': SimulationType.CHANNELS,
        'blocking': SimulationType.BLOCKING,
        'traffic': SimulationType.TRAFFIC,
        'population': SimulationType.POPULATION
      };
      
      return typeMap[type] || null;
    } catch (error) {
      return null;
    }
  }
}