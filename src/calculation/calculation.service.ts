// src/calculation/calculation.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CalculationService {
  private readonly logger = new Logger(CalculationService.name);

  constructor(
    private configService: ConfigService,
    private readonly aiService: AiService
  ) {}

  async calculateChannels(traffic: number, blockingProb: number) {
    // Implémentation de la formule d'Erlang B
    let channels = 0;
    let blocking = 1;
    const trafficErlangs = traffic;
    
    while (blocking > blockingProb / 100) {
      channels++;
      blocking = this.erlangB(trafficErlangs, channels);
    }

    // Génération des données pour le graphique
    const chartData = this.generateChartData(traffic, blockingProb, channels);

    // Génération de l'analyse IA
    const aiAnalysis = await this.generateAIAnalysis({
      type: 'channels',
      traffic,
      blockingProb,
      result: channels,
      chartData
    });

    return {
      result: channels,
      chartData,
      aiAnalysis
    };
  }

  async calculateBlocking(numChannels: number, trafficLoad: number) {
    const blockingProb = this.erlangB(trafficLoad, numChannels) * 100;
    
    const chartData = this.generateBlockingChartData(trafficLoad, numChannels);

    const aiAnalysis = await this.generateAIAnalysis({
      type: 'blocking',
      numChannels,
      trafficLoad,
      result: blockingProb,
      chartData
    });

    return {
      result: blockingProb,
      chartData,
      aiAnalysis
    };
  }

  async calculateTraffic(availableChannels: number, targetBlocking: number) {
    if (availableChannels <= 0 || targetBlocking <= 0) {
      throw new Error('Le nombre de canaux et le taux de blocage doivent être supérieurs à zéro');
    }
    
    let low = 0;
    let high = availableChannels * 10; // Valeur initiale haute basée sur le nombre de canaux
    let traffic = 0;
    const precision = 0.0001;
    const maxIterations = 1000;
    let iterations = 0;
    
    // Recherche par dichotomie pour plus de précision et d'efficacité
    while (iterations < maxIterations) {
      traffic = (low + high) / 2;
      const blocking = this.erlangB(traffic, availableChannels) * 100; // Convertir en pourcentage
      
      if (Math.abs(blocking - targetBlocking) < precision) {
        break;
      } else if (blocking > targetBlocking) {
        high = traffic;
      } else {
        low = traffic;
      }
      
      iterations++;
    }

    const chartData = this.generateTrafficChartData(availableChannels, targetBlocking);

    const aiAnalysis = await this.generateAIAnalysis({
      type: 'traffic',
      availableChannels,
      targetBlocking,
      result: traffic,
      chartData
    });

    return {
      result: traffic,
      chartData,
      aiAnalysis
    };
  }

  async calculatePopulation(population: number, callRate: number, avgDuration: number) {
    // Calcul du trafic en Erlangs
    const traffic = (population * callRate * avgDuration) / 60;
    
    const chartData = this.generatePopulationChartData(population, callRate, avgDuration);

    const aiAnalysis = await this.generateAIAnalysis({
      type: 'population',
      population,
      callRate,
      avgDuration,
      result: traffic,
      chartData
    });

    return {
      result: traffic,
      chartData,
      aiAnalysis
    };
  }

  private erlangB(A: number, N: number): number {
    // Gestion des cas particuliers
    if (A <= 0) return 0;
    if (N <= 0) return 1;
    
    // Utilisation de l'approche logarithmique pour éviter les dépassements numériques
    let sum = 0;
    let term = 0;
    
    // Calcul du terme initial (k=0)
    let maxTerm = 0;
    
    // Trouver le terme maximum pour la stabilité numérique
    for (let k = 0; k <= N; k++) {
      const currentTerm = k * Math.log(A) - this.logFactorial(k);
      if (currentTerm > maxTerm) {
        maxTerm = currentTerm;
      }
    }
    
    // Calculer la somme des termes normalisés
    let sumTerms = 0;
    for (let k = 0; k <= N; k++) {
      const term = Math.exp(k * Math.log(A) - this.logFactorial(k) - maxTerm);
      sumTerms += term;
    }
    
    // Calculer le terme du numérateur
    const numerator = Math.exp(N * Math.log(A) - this.logFactorial(N) - maxTerm);
    
    // Calcul final de la probabilité de blocage
    const B = numerator / sumTerms;
    
    // S'assurer que la probabilité est entre 0 et 1
    return Math.max(0, Math.min(1, B));
  }
  
  // Fonction auxiliaire pour calculer le logarithme de la factorielle
  private logFactorial(n: number): number {
    if (n <= 1) return 0;
    let result = 0;
    for (let i = 2; i <= n; i++) {
      result += Math.log(i);
    }
    return result;
  }

  private generateChartData(traffic: number, blockingProb: number, maxChannels: number) {
    const data = [];
    const step = Math.max(1, Math.ceil(maxChannels / 50)); // Pas dynamique pour avoir environ 50 points
    
    for (let i = 1; i <= Math.min(maxChannels * 2, 200); i += step) {
      const blocking = this.erlangB(traffic, i) * 100;
      data.push({
        channels: i,
        blockingRate: parseFloat(blocking.toFixed(2)) // 2 décimales suffisent pour l'affichage
      });
    }
    
    // S'assurer d'inclure le dernier point si nécessaire
    if (data[data.length - 1]?.channels < maxChannels) {
      const blocking = this.erlangB(traffic, maxChannels) * 100;
      data.push({
        channels: maxChannels,
        blockingRate: parseFloat(blocking.toFixed(2))
      });
    }
    
    return data;
  }

  private generateBlockingChartData(trafficLoad: number, maxChannels: number) {
    const data = [];
    for (let i = 1; i <= Math.min(maxChannels * 2, 100); i++) {
      const blocking = this.erlangB(trafficLoad, i) * 100;
      data.push({
        channels: i,
        blockingRate: parseFloat(blocking.toFixed(4))
      });
    }
    return data;
  }

  private generateTrafficChartData(availableChannels: number, targetBlocking: number) {
    const data = [];
    
    // Calculer le trafic cible (point où le blocage = targetBlocking)
    let targetTraffic = 0;
    let low = 0;
    let high = availableChannels * 2; // Réduit la plage haute pour accélérer la convergence
    let iterations = 0;
    
    // Première passe pour trouver une estimation grossière
    while (iterations < 1000) {
      targetTraffic = (low + high) / 2;
      const blocking = this.erlangB(targetTraffic, availableChannels) * 100;
      
      if (Math.abs(blocking - targetBlocking) < 0.01) {
        break;
      } else if (blocking > targetBlocking) {
        high = targetTraffic;
      } else {
        low = targetTraffic;
      }
      iterations++;
    }
    
    // Si on n'a pas trouvé de solution, on utilise une valeur par défaut
    if (iterations >= 1000) {
      targetTraffic = availableChannels * 0.8; // Estimation grossière
    }
    
    // Définir les plages pour l'échantillonnage avec plus de points autour du point cible
    const ranges = [
      { start: 0.1, end: targetTraffic * 0.5, points: 10 },
      { start: targetTraffic * 0.5, end: targetTraffic * 0.9, points: 15 },
      { start: targetTraffic * 0.9, end: targetTraffic * 1.1, points: 15 },
      { start: targetTraffic * 1.1, end: targetTraffic * 1.5, points: 10 },
      { start: targetTraffic * 1.5, end: targetTraffic * 2, points: 5 }
    ];
    
    // Générer les points de données avec une distribution non linéaire
    for (const range of ranges) {
      const step = (range.end - range.start) / range.points;
      for (let t = range.start; t <= range.end && t <= availableChannels * 3; t += step) {
        if (t > 0) { // Éviter les valeurs négatives
          const blocking = this.erlangB(t, availableChannels) * 100;
          data.push({
            traffic: parseFloat(t.toFixed(2)),
            blockingRate: parseFloat(blocking.toFixed(2))
          });
        }
      }
    }
    
    // Ajouter le point cible s'il est valide
    if (targetTraffic > 0 && targetTraffic <= availableChannels * 3) {
      const blocking = this.erlangB(targetTraffic, availableChannels) * 100;
      data.push({
        traffic: parseFloat(targetTraffic.toFixed(2)),
        blockingRate: parseFloat(blocking.toFixed(2)),
        isTarget: true,
        targetBlocking: targetBlocking
      });
    }
    
    // Trier par trafic croissant et éliminer les doublons
    const uniqueData = [];
    const seen = new Set();
    
    data
      .sort((a, b) => a.traffic - b.traffic)
      .forEach(item => {
        const key = item.traffic.toFixed(2);
        if (!seen.has(key)) {
          seen.add(key);
          // Ne pas ajouter de points avec un taux de blocage > 100
          if (item.blockingRate <= 100) {
            uniqueData.push(item);
          }
        }
      });
    
    // S'assurer que le point cible est présent
    const hasTarget = uniqueData.some(item => item.isTarget);
    if (!hasTarget && targetTraffic > 0 && targetTraffic <= availableChannels * 3) {
      const blocking = this.erlangB(targetTraffic, availableChannels) * 100;
      uniqueData.push({
        traffic: parseFloat(targetTraffic.toFixed(2)),
        blockingRate: parseFloat(blocking.toFixed(2)),
        isTarget: true,
        targetBlocking: targetBlocking
      });
      uniqueData.sort((a, b) => a.traffic - b.traffic);
    }
    
    return uniqueData;
  }

  private generatePopulationChartData(population: number, callRate: number, avgDuration: number) {
    const data = [];
    for (let p = 1000; p <= population * 1.5; p += 1000) {
      const traffic = (p * callRate * avgDuration) / 60;
      data.push({
        population: p,
        traffic: parseFloat(traffic.toFixed(2))
      });
    }
    return data;
  }

  private async generateAIAnalysis(params: any): Promise<string> {
    try {
      const prompt = this.generateAIPrompt(params);
      return await this.aiService.generateContent(prompt, 'gemini-2.5-pro');
    } catch (error) {
      this.logger.error('Error in generateAIAnalysis:', error);
      return 'Impossible de générer une analyse pour le moment. Veuillez réessayer plus tard.';
    }
  }

  private generateAIPrompt(params: any): string {
    const instructions = "Réponds directement sans introduction . Sois technique et concis. Utilise uniquement les données fournies et deduisant autre chose pour but d'analyser le calcul et d'aider explique clairement et apporte des conseils.\n\n";
    
    switch(params.type) {
      case 'channels':
        return `${instructions}Pour un trafic de ${params.traffic} Erlangs avec un taux de blocage cible de ${params.blockingProb}%, il faut ${params.result} canaux. Analyse technique :`;

      case 'blocking':
        return `${instructions}Avec ${params.numChannels} canaux et une charge de ${params.trafficLoad} Erlangs, le taux de blocage est de ${params.result.toFixed(2)}%. Analyse :`;

      case 'traffic':
        return `${instructions}Avec ${params.availableChannels} canaux et un taux de blocage cible de ${params.targetBlocking}%, la capacité maximale est de ${params.result.toFixed(2)} Erlangs. Analyse :`;

      case 'population':
        return `${instructions}Pour ${params.population} utilisateurs avec ${params.callRate} appels/heure/pers. de ${params.avgDuration} min, le trafic généré est de ${params.result.toFixed(2)} Erlangs. Analyse :`;

      default:
        return "Analyse des résultats de calcul :";
    }
  }
}