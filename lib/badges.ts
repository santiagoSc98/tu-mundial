export const BADGES = {
  primer_acierto: {
    name: 'Primer acierto',
    description: 'Acertaste tu primera predicción',
    icon: 'target',
  },
  racha_3: {
    name: 'En racha',
    description: '3 aciertos consecutivos',
    icon: 'flame',
  },
  racha_5: {
    name: 'Imparable',
    description: '5 aciertos consecutivos',
    icon: 'flame',
  },
  marcador_exacto: {
    name: 'Ojo de águila',
    description: 'Acertaste un marcador exacto',
    icon: 'crosshair',
  },
  cinco_exactos: {
    name: 'Precisión total',
    description: '5 marcadores exactos',
    icon: 'crosshair',
  },
  lider: {
    name: 'En la cima',
    description: 'Llegaste al puesto #1',
    icon: 'trophy',
  },
  diez_predicciones: {
    name: 'Comprometido',
    description: 'Hiciste 10 predicciones',
    icon: 'list-check',
  },
  veinte_predicciones: {
    name: 'Fanático del Mundial',
    description: 'Hiciste 20 predicciones',
    icon: 'list-check',
  },
} as const

export type BadgeId = keyof typeof BADGES
