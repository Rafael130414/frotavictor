import { useCallback, useEffect, useState } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { Container, Engine } from 'tsparticles-engine';

interface DisintegrationEffectProps {
  elementSelector: string;
  onComplete: () => void;
  color?: string;
}

export function DisintegrationEffect({ 
  elementSelector, 
  onComplete,
  color = "#3b82f6" 
}: DisintegrationEffectProps) {
  const [particles, setParticles] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      const element = document.querySelector(elementSelector) as HTMLElement;
      
      if (element) {
        setIsAnimating(true);
        
        // Capturar a posição e tamanho do elemento
        const rect = element.getBoundingClientRect();
        const { width, height, left, top } = rect;
        
        // Ajustar para a posição da janela
        const adjustedLeft = left + window.scrollX;
        const adjustedTop = top + window.scrollY;
        
        // Criar pontos de partículas com base no tamanho do elemento
        const particleSize = 4;
        const gap = 6;
        const cols = Math.floor(width / (particleSize + gap));
        const rows = Math.floor(height / (particleSize + gap));
        
        const newParticles = [];
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const x = adjustedLeft + j * (particleSize + gap) + gap/2;
            const y = adjustedTop + i * (particleSize + gap) + gap/2;
            
            newParticles.push({
              id: `p-${i}-${j}`,
              x,
              y,
              size: particleSize,
              color,
              originalY: y,
              delay: Math.random() * 1000, // Atraso aleatório para cada partícula
            });
          }
        }
        
        // Ocultar o elemento original
        element.style.visibility = 'hidden';
        
        // Definir as partículas
        setParticles(newParticles);
        
        // Definir um timeout para chamar onComplete após a animação
        setTimeout(() => {
          onComplete();
        }, 2000); // 2 segundos para a animação completa
      }
    }
  }, [elementSelector, isAnimating, onComplete, color]);

  const handleParticlesLoaded = useCallback(async (container?: Container) => {
    if (!container) return;
    
    const particlesContainer = container.canvas.element as HTMLCanvasElement;
    
    if (particlesContainer) {
      // Ajustar o canvas para cobrir a tela inteira
      particlesContainer.style.position = 'fixed';
      particlesContainer.style.top = '0';
      particlesContainer.style.left = '0';
      particlesContainer.style.width = '100%';
      particlesContainer.style.height = '100%';
      particlesContainer.style.pointerEvents = 'none';
      particlesContainer.style.zIndex = '9999';
      
      const pJSContainer = container as any;
      
      // Posicionar cada partícula individualmente
      particles.forEach((p, index) => {
        if (pJSContainer.particles.array[index]) {
          const particle = pJSContainer.particles.array[index];
          particle.position.x = p.x;
          particle.position.y = p.y;
          
          // Adicionar delay para animação sequencial
          setTimeout(() => {
            particle.velocity.y = -2 - Math.random() * 3;
            particle.velocity.x = (Math.random() - 0.5) * 2;
          }, p.delay);
        }
      });
    }
  }, [particles]);

  return (
    <>
      {isAnimating && (
        <Particles
          id="tsparticles-disintegration"
          init={particlesInit}
          loaded={handleParticlesLoaded}
          options={{
            fullScreen: {
              enable: false,
              zIndex: 9999
            },
            fpsLimit: 120,
            particles: {
              number: {
                value: particles.length,
                density: {
                  enable: false
                }
              },
              color: {
                value: [color]
              },
              shape: {
                type: "circle"
              },
              opacity: {
                value: 1,
                animation: {
                  enable: true,
                  speed: 1,
                  minimumValue: 0,
                  sync: false,
                  startValue: "max",
                  destroy: "min"
                }
              },
              size: {
                value: { min: 2, max: 4 }
              },
              move: {
                enable: true,
                speed: 3,
                direction: "top",
                random: true,
                straight: false,
                outModes: {
                  default: "out"
                }
              }
            },
            detectRetina: true
          }}
        />
      )}
    </>
  );
} 