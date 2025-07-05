// src/calculation/calculation.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CalculationService {
  constructor(private configService: ConfigService) {}

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
    let traffic = 0;
    let blocking = 1;
    
    // Trouver le trafic maximum pour le taux de blocage cible
    while (blocking > targetBlocking / 100) {
      traffic += 0.1;
      blocking = this.erlangB(traffic, availableChannels);
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
    let I = 1.0;
    for (let i = 1; i <= N; i++) {
      I = 1.0 + (i * I) / A;
    }
    return 1.0 / I;
  }

  private generateChartData(traffic: number, blockingProb: number, maxChannels: number) {
    const data = [];
    for (let i = 1; i <= Math.min(maxChannels * 2, 100); i++) {
      const blocking = this.erlangB(traffic, i) * 100;
      data.push({
        channels: i,
        blockingRate: parseFloat(blocking.toFixed(4))
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
    for (let t = 0.1; t <= availableChannels * 3; t += 0.5) {
      const blocking = this.erlangB(t, availableChannels) * 100;
      data.push({
        traffic: parseFloat(t.toFixed(2)),
        blockingRate: parseFloat(blocking.toFixed(4))
      });
    }
    return data;
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
    console.log('Generating AI analysis...', params);
    try {
      const prompt = this.generateAIPrompt(params);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.configService.get('OPENROUTER_API_KEY')}`,
          'HTTP-Referer': `${this.configService.get('FRONTEND_URL')}`, // Remplacez par votre URL de production
          'X-Title': 'ErlangCalc',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-30b-a3b:free',
          messages: [{ role: 'user', content: prompt }]
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API error:', errorData);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.choices[0]?.message?.content || 'Aucune analyse disponible.';
      console.log(data.choices[0]?.message?.content);
    } catch (error) {
      console.error('Error in generateAIAnalysis:', error);
      return 'Impossible de générer une analyse pour le moment.';
    }
  }

  private generateAIPrompt(params: any): string {
    switch(params.type) {
      case 'channels':
        return `Analyse les résultats du calcul de canaux nécessaires :
- Trafic: ${params.traffic} Erlangs
- Taux de blocage cible: ${params.blockingProb}%
- Canaux nécessaires: ${params.result}

Fournis une analyse professionnelle en français sur l'impact de ces paramètres sur la planification réseau.`;

      case 'blocking':
        return `Analyse le taux de blocage calculé :
- Canaux: ${params.numChannels}
- Charge de trafic: ${params.trafficLoad} Erlangs
- Taux de blocage: ${params.result.toFixed(4)}%

Donne une interprétation technique en français de ces résultats.`;

      case 'traffic':
        return `Analyse la capacité de trafic :
- Canaux disponibles: ${params.availableChannels}
- Taux de blocage cible: ${params.targetBlocking}%
- Trafic supporté: ${params.result.toFixed(2)} Erlangs

Fournis une analyse en français de ces résultats.`;

      case 'population':
        return `Analyse l'estimation basée sur la population :
- Population: ${params.population}
- Taux d'appel: ${params.callRate} appels/personne/heure
- Durée moyenne: ${params.avgDuration} minutes
- Trafic généré: ${params.result.toFixed(2)} Erlangs

Donne une analyse en français de ces résultats.`;

      default:
        return 'Analyse des résultats de calcul.';
    }
  }
}