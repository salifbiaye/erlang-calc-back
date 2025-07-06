import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Cet email est déjà utilisé');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        image: updateUserDto.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return updatedUser;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur a un mot de passe (peut être connecté via OAuth)
    if (!user.password) {
      throw new BadRequestException('Ce compte utilise une connexion externe');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès' };
  }

  async deleteUser(userId: string) {
    // Vérifier si l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'utilisateur et toutes ses données associées
    // Note: Assurez-vous que les relations dans Prisma sont correctement configurées avec onDelete: Cascade
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true, message: 'Compte supprimé avec succès' };
  }
}
