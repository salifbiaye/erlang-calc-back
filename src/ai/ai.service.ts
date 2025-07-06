import { Injectable, Inject, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(@Inject('GEMINI_API_KEY') private readonly apiKey: string) {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. AI features will be disabled.');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  async generateContent(prompt: string, model = 'gemini-2.5-pro'): Promise<string> {
    if (!this.genAI) {
      this.logger.warn('AI service is not initialized. Please set GEMINI_API_KEY.');
      return 'AI service is not available. Please check the server configuration.';
    }

    try {
      const modelInstance = this.genAI.getGenerativeModel({ model });
      const result = await modelInstance.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error generating AI content:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  async analyzeSimulation(params: any): Promise<string> {
    const prompt = this.generateSimulationPrompt(params);
    return this.generateContent(prompt, 'gemini-2.5-pro');
  }

  private generateSimulationPrompt(params: any): string {
    // Personnalisez ce prompt selon vos besoins spécifiques
    return `Analyse les résultats de simulation suivants et fournis une interprétation technique concise en français :
    
Type de simulation: ${params.type}
Paramètres: ${JSON.stringify(params.parameters, null, 2)}
Résultats: ${JSON.stringify(params.results, null, 2)}

Analyse technique :`;
  }
}
