import { ProjectConfig } from '@/types/project';

interface PromptResult {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
}

const dimensionMap: Record<string, { width: number; height: number }> = {
  'stories': { width: 1080, height: 1920 },
  'horizontal': { width: 1920, height: 1080 },
  'feed-quadrado': { width: 1080, height: 1080 },
  'feed-retrato': { width: 1080, height: 1350 },
};

const styleDescriptions: Record<string, string> = {
  'Clássico': 'classic elegant timeless aesthetic',
  'Formal': 'formal corporate professional look',
  'Elegante': 'elegant sophisticated luxury feel',
  'Sexy': 'sensual attractive glamorous style',
  'Institucional': 'institutional corporate clean design',
  'Tecnológico': 'technological futuristic digital aesthetic with neon accents',
  'Glassmorphism': 'glassmorphism frosted glass transparency effects',
  'Interface UI': 'UI design interface mockup style',
  'Minimalista': 'minimalist clean simple composition',
  'Lúdico': 'playful colorful fun vibrant style',
  'Cartoon': 'cartoon illustration animated style',
  'Infoproduto': 'digital product marketing professional thumbnail',
  'Jovial': 'youthful energetic dynamic fresh style',
  'Gamer': 'gaming esports neon dark aggressive style',
  'Retrato Profissional': 'professional portrait headshot photography',
  'Ultra Realista': 'ultra realistic photorealistic 8k photography',
  'Glow': 'glowing luminous light effects ethereal',
};

export function composePrompt(config: ProjectConfig): PromptResult {
  const parts: string[] = [];
  const dim = config.dimension ? dimensionMap[config.dimension] : { width: 1080, height: 1080 };

  // 1. Dimension & safe zones
  const ratio = config.dimension === 'stories' ? '9:16 vertical' :
    config.dimension === 'horizontal' ? '16:9 horizontal' :
    config.dimension === 'feed-retrato' ? '4:5 portrait' : '1:1 square';
  parts.push(`${ratio} aspect ratio social media image`);

  // Vertical position / safe zone
  if (config.verticalPosition === 'cima') {
    parts.push('subject positioned in the upper portion of the frame, leaving clean empty space at the bottom for text overlay');
  } else if (config.verticalPosition === 'baixo') {
    parts.push('subject positioned in the lower portion of the frame, leaving clean empty space at the top for text overlay');
  }

  // 2. Subject
  const genderLabel = config.gender === 'masculino' ? 'male' : 'female';
  parts.push(`${genderLabel} subject`);

  if (config.poseDescription) {
    parts.push(config.poseDescription);
  }

  // Character direction
  const dirExpression = config.expression || config.expressionCustom;
  const dirPose = config.pose || config.poseCustom;
  const dirAngle = config.cameraAngle || config.cameraAngleCustom;
  const dirLens = config.lens || config.lensCustom;
  const dirGaze = config.gazeDirection || config.gazeDirectionCustom;

  if (dirExpression) parts.push(`facial expression: ${dirExpression}`);
  if (dirPose) parts.push(`body pose: ${dirPose}`);
  if (dirAngle) parts.push(`camera angle: ${dirAngle}`);
  if (dirLens) parts.push(`shot with ${dirLens} lens`);
  if (dirGaze) parts.push(`gaze direction: ${dirGaze}`);

  // Subject position
  if (config.subjectPosition === 'esquerda') {
    parts.push('subject positioned on the left side of the frame');
  } else if (config.subjectPosition === 'direita') {
    parts.push('subject positioned on the right side of the frame');
  } else {
    parts.push('subject centered in frame');
  }

  // 3. Framing
  if (config.framing === 'closeup') {
    parts.push('close-up shot of face and shoulders');
  } else if (config.framing === 'plano-medio') {
    parts.push('medium shot from waist up');
  } else {
    parts.push('american shot from knees up');
  }

  // 4. Niche/project context
  if (config.niche) {
    parts.push(`${config.niche} niche/theme`);
  }

  // 5. Environment
  if (config.environment) {
    parts.push(`environment: ${config.environment}`);
  }

  // 6. Colors & lighting
  if (config.colorMode === 'manual') {
    parts.push(`ambient color: ${config.ambientColor}, rim light: ${config.rimLightColor}, complementary light: ${config.complementaryLightColor}`);
  } else {
    parts.push('choose the most coherent color palette for lighting based on the design context');
  }

  // 7. Style
  if (config.visualStyleEnabled && config.visualStyle) {
    const desc = styleDescriptions[config.visualStyle] || config.visualStyle;
    parts.push(`visual style: ${desc}`);
  }

  // 8. Sobriety
  if (config.sobriety > 70) {
    parts.push('professional corporate clean look');
  } else if (config.sobriety < 30) {
    parts.push('creative artistic bold expressive look');
  }

  // 9. Effects
  if (config.useBlur) {
    parts.push('background bokeh blur depth of field');
  }
  if (config.useSideGradient) {
    parts.push('lateral gradient color transition on sides');
  }

  // 10. Floating elements
  if (config.floatingElements && config.floatingElementsText) {
    parts.push(`floating elements around subject: ${config.floatingElementsText}`);
  }

  // 11. Text handling
  if (!config.textEnabled || config.textMode === 'camada') {
    parts.push('clean background with negative space for text overlay, no text in image');
  } else if (config.textEnabled && config.textMode === 'imagem') {
    if (config.text01) parts.push(`headline text: "${config.text01}" prominently displayed, legible`);
    if (config.text02) parts.push(`subheadline: "${config.text02}"`);
    if (config.cta) parts.push(`call to action button/text: "${config.cta}"`);
  }

  // 12. Additional prompt
  if (config.additionalPromptEnabled && config.additionalPrompt) {
    parts.push(config.additionalPrompt);
  }

  parts.push('high quality, professional, sharp details, studio lighting');

  // Ultra realism boost for human subjects (unless non-realist style)
  const nonRealistStyles = new Set(['Cartoon', 'Lúdico', 'Interface UI']);
  const hasHuman = config.subjectPhotos.length > 0 || !!config.poseDescription || !!config.expression || !!config.expressionCustom;
  const isNonRealist = config.visualStyleEnabled && config.visualStyle && nonRealistStyles.has(config.visualStyle);

  if (hasHuman && !isNonRealist) {
    parts.push('ultra photorealistic, extreme realism, cinematic lighting, skin pores detailed, natural facial texture, highly detailed lips and mouth anatomy, well-defined facial expressions, sharp eyes with natural catchlight, realistic hair strands strand-by-strand, high micro-texture detail, ultra sharp focus, 8k, ultra HD, premium quality, masterpiece');
    parts.push('natural healthy lip texture, correct lip contour and anatomy');
  }

  let negativePrompt = 'deformed hands, extra fingers, bad anatomy, blurry text, misspelled text, watermark, logo, low quality, blurry, pixelated, oversaturated, duplicate, disfigured face, extra limbs';

  if (hasHuman && !isNonRealist) {
    negativePrompt += ', cracked lips, overly dry lips, deformed mouth, weird teeth, extra teeth, asymmetrical eyes, uncanny face, plastic skin, waxy skin, over-smoothed skin, blurry eyes, low detail skin, mushy hair';
  }

  return {
    prompt: parts.join('. '),
    negativePrompt,
    width: dim.width,
    height: dim.height,
  };
}
