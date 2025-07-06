import {
  Controller,
  Get,
  UseGuards,
  Request,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.userService.getUserProfile(req.user.userId);
  }

  @Put('me')
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(req.user.userId, updateUserDto);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      return await this.userService.changePassword(
        req.user.userId,
        changePasswordDto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req) {
    try {
      await this.userService.deleteUser(req.user.userId);
      return { success: true, message: 'Compte supprimé avec succès' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
