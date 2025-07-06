import { Controller, Post, Body, Get, Query, UseGuards, Request, Delete, Param, ParseUUIDPipe, HttpCode, HttpStatus, NotFoundException, BadRequestException, Patch } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationParams } from '../common/dto/pagination.dto';
import { SimulationType } from '@prisma/client';
import { CreateSimulationDto } from './dto/create-simulation.dto';
type UserRequest = Request & { user: { userId: string } };

@Controller('simulations')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getSimulationStats(@Request() req) {
    const stats = await this.simulationService.getSimulationStats(req.user.userId);
    return {
      success: true,
      data: stats
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSimulations(
    @Request() req,
    @Query() query: PaginationParams
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const favoritesOnly = query.favoritesOnly === 'true';
    
    return this.simulationService.getSimulations(
      req.user.userId,
      page,
      limit,
      favoritesOnly
    );
  }
  @Get('shared')
  @UseGuards(JwtAuthGuard)
  async getSharedSimulations(
    @Request() req,
    @Query() { page = 1, limit = 10, favoritesOnly }: PaginationParams
  ) {
    return this.simulationService.getSharedSimulations(
      req.user.userId,
      Number(page) || 1,
      Number(limit) || 10,
      favoritesOnly === 'true'
    );
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSimulationById(
    @Param('id') id: string,
    @Request() req
  ) {
    try {
      return await this.simulationService.getSimulationById(id, req.user.userId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

// Mettre à jour le statut de favori
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @Param('id') id: string,
    @Query('favorite') favorite: string,
    @Request() req
  ) {
    try {
      return await this.simulationService.toggleFavorite(
        id,
        req.user.userId,
        favorite === 'true'
      );
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSimulation(
    @Body() createSimulationDto: CreateSimulationDto,
    @Request() req: UserRequest
  ) {
    const userId = req.user.userId;
    
    
    // Créer la simulation avec les informations de zone
    const simulation = await this.simulationService.createSimulation(
      createSimulationDto,
      userId
    );

    return simulation;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSimulation(
    @Param('id') id: string,
    @Request() req
  ) {
    try {
      await this.simulationService.deleteSimulation(id, req.user.userId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
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