import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('Mot de passe ou adresse email incorrect');
    }

    if (user.provider && !user.password) {
      throw new UnauthorizedException('Mot de passe ou adresse email incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe ou adresse email  incorrect');
    }

    if (!user.emailVerified) {
      // Générer un nouveau token et l'enregistrer
      const verificationToken = this.generateToken();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationToken }
      });
      
      // Renvoyer l'email de vérification
      await this.emailService.sendVerificationEmail(email, verificationToken);
      throw new UnauthorizedException('Votre compte n\'est pas encore activé. Un nouvel email de vérification vient de vous être envoyé.');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified
      }
    };
  }

  async register(email: string, password: string, name?: string) {
    if (!email || !password) {
      throw new BadRequestException('L\'adresse email et le mot de passe sont obligatoires');
    }

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Un compte existe déjà avec cette adresse email');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = this.generateToken();
    
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          verificationToken
        },
      });

      // Créer les paramètres de notification séparément
      await this.prisma.notificationSettings.create({
        data: {
          userId: user.id,
          emailSimulationShared: true,
          emailNewComment: true,
          pushNotificationLevel: 'all'
        }
      });

      await this.emailService.sendVerificationEmail(email, verificationToken);
      
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      throw new BadRequestException('Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.');
    }
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      throw new BadRequestException('Le lien de vérification est invalide ou a expiré');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null
      }
    });

    return { message: 'Votre adresse email a été vérifiée avec succès' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Aucun compte n\'existe avec cette adresse email');
    }

    try {
      const resetToken = this.generateToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      await this.emailService.sendPasswordResetEmail(email, resetToken);
      
      return { message: 'Un email contenant les instructions pour réinitialiser votre mot de passe vous a été envoyé' };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw new BadRequestException('Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword) {
      throw new BadRequestException('Le nouveau mot de passe est obligatoire');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new BadRequestException('Le lien de réinitialisation est invalide ou a expiré');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { message: 'Votre mot de passe a été réinitialisé avec succès' };
  }

  async validateOAuthUser(oauthUser: any) {
    const { email, name, image, googleId, githubId, provider } = oauthUser;

    if (!email) {
      throw new BadRequestException('L\'adresse email est requise pour l\'authentification OAuth');
    }

    // Rechercher l'utilisateur par email ou ID OAuth
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(googleId ? [{ googleId }] : []),
          ...(githubId ? [{ githubId }] : []),
        ],
      },
    });

    if (user) {
      // Mettre à jour les informations OAuth si nécessaire
      const updateData: any = {
        name: name || user.name,
        image: image || user.image,
        emailVerified: new Date(),
      };

      if (googleId && !user.googleId) updateData.googleId = googleId;
      if (githubId && !user.githubId) updateData.githubId = githubId;
      if (!user.provider) updateData.provider = provider;

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      try {
        // Créer un nouvel utilisateur
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            image,
            googleId,
            githubId,
            provider,
            emailVerified: new Date(),
          },
        });

        // Créer les paramètres de notification
        await this.prisma.notificationSettings.create({
          data: {
            userId: user.id,
            emailSimulationShared: true,
            emailNewComment: true,
            pushNotificationLevel: 'all'
          }
        });
      } catch (error) {
        throw new BadRequestException('Une erreur est survenue lors de la création de votre compte OAuth');
      }
    }

    return user;
  }
} 