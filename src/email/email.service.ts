import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const resendApiKey = process.env.RESEND_API_KEY;
    console.log('Initialisation de Resend avec la clé API:', resendApiKey ? 'Présente' : 'Manquante');
    this.resend = new Resend(resendApiKey);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!to || to.includes('example.com')) {
        throw new BadRequestException('Adresse email invalide');
      }

      const response = await this.resend.emails.send({
        from: 'no-reply@shadowfit-app.space',
        to,
        subject,
        html
      });

      if (response.error) {
        return " Oups, une erreur est survenue lors de l'envoi de l'email";
      }

      return response;
    } catch (error) {
    
      return "Erreur lors de l'envoi de l'email";
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    return this.sendEmail(
      email,
      'Vérification de votre compte',
      `
        <h1>Bienvenue sur notre plateforme !</h1>
        <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
        <a href="${verificationUrl}">Vérifier mon adresse email</a>
        <p>Ce lien est valable pendant 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
      `
    );
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    return this.sendEmail(
      email,
      'Réinitialisation de votre mot de passe',
      `
        <h1>Réinitialisation de votre mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
        <p>Ce lien est valable pendant 24 heures.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
      `
    );
  }
} 