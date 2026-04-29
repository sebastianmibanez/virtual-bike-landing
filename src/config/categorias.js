export const categoriasPorGenero = {
  hombre: [
    'Debutantes sin edad',
    'Menor 23 años',
    'Mayor 24 años',
    'Mayor 35 años Master',
    'Todo competidor y Sub/23',
    'Master A 30/39 años',
    'Master B 40/49 años',
    'Master C mayor 50 y más años',
  ],
  mujer: ['Menor 23 años', 'Mayor 23 años', 'Master mayor 35 años'],
}

export const horariosPorGenero = {
  hombre: [
    { hora: '08:00', label: 'Acreditación', categorias: 'Todas las categorías', destacado: false },
    { hora: '09:00', label: 'Debutantes', categorias: 'Sin límite de edad', destacado: true },
    { hora: '09:20', label: 'Master C', categorias: 'Mayores de 50 años', destacado: true },
    { hora: '11:30', label: 'Competidores', categorias: 'Todo Competidor · Sub/23', destacado: true },
    { hora: '11:40', label: 'Master A y B', categorias: 'Master A (30-39) · Master B (40-49)', destacado: true },
  ],
  mujer: [
    { hora: '08:00', label: 'Acreditación', categorias: 'Todas las categorías', destacado: false },
    { hora: '09:20', label: 'Damas', categorias: 'Menor 23 · Mayor 23 · Master mayor 35', destacado: true },
  ],
  '': [
    { hora: '08:00', label: 'Acreditación', categorias: 'Todas las categorías', destacado: false },
    { hora: '09:00', label: 'Debutantes', categorias: 'Sin límite de edad', destacado: true },
    { hora: '09:20', label: 'Damas · Master C', categorias: 'Todas las categorías femeninas · Mayores de 50', destacado: true },
    { hora: '11:30', label: 'Competidores', categorias: 'Todo Competidor · Sub/23', destacado: true },
    { hora: '11:40', label: 'Master A y B', categorias: 'Master A (30-39) · Master B (40-49)', destacado: true },
  ],
}

export const tramosPorGenero = {
  hombre: [
    {
      id: 'h-60',
      badge: '+60 inscritos',
      subtitulo: 'Cuando el grupo supera los 60 participantes',
      puestos: [
        { lugar: 1, premio: 100000, extra: 'Medallón + Tricota de Campeón' },
        { lugar: 2, premio: 80000,  extra: 'Medallón' },
        { lugar: 3, premio: 70000,  extra: 'Medallón' },
        { lugar: 4, premio: 60000,  extra: 'Medallón' },
        { lugar: 5, premio: 50000,  extra: 'Medallón' },
        { lugar: 6, premio: 40000,  extra: 'Medallón' },
        { lugar: 7, premio: 40000,  extra: 'Medallón' },
      ],
    },
    {
      id: 'h-59',
      badge: '-59 inscritos',
      subtitulo: 'Entre 40 y 59 participantes en el grupo',
      puestos: [
        { lugar: 1, premio: 80000, extra: 'Medallón + Tricota de Campeón' },
        { lugar: 2, premio: 70000, extra: 'Medallón' },
        { lugar: 3, premio: 60000, extra: 'Medallón' },
        { lugar: 4, premio: 50000, extra: 'Medallón' },
        { lugar: 5, premio: 40000, extra: 'Medallón' },
      ],
    },
    {
      id: 'h-39',
      badge: '-39 inscritos',
      subtitulo: 'Entre 20 y 39 participantes en el grupo',
      puestos: [
        { lugar: 1, premio: 60000, extra: 'Medallón + Tricota de Campeón' },
        { lugar: 2, premio: 50000, extra: 'Medallón' },
        { lugar: 3, premio: 40000, extra: 'Medallón' },
        { lugar: 4, premio: 40000, extra: 'Medallón' },
        { lugar: 5, premio: 40000, extra: 'Medallón' },
      ],
    },
    {
      id: 'h-19',
      badge: '-19 inscritos',
      subtitulo: 'Hasta 19 participantes en el grupo',
      puestos: [
        { lugar: 1, premio: 40000, extra: 'Medallón + Tricota de Campeón' },
        { lugar: 2, premio: 30000, extra: 'Medallón' },
        { lugar: 3, premio: 20000, extra: 'Medallón' },
        { lugar: 4, premio: 20000, extra: 'Medallón' },
        { lugar: 5, premio: 20000, extra: 'Medallón' },
      ],
    },
  ],
  mujer: [
    {
      id: 'd-10',
      badge: '+10 inscritas',
      subtitulo: 'Más de 10 participantes en la categoría',
      puestos: [
        { lugar: 1, premio: 50000, extra: 'Medallón + Tricota de Campeona' },
        { lugar: 2, premio: 40000, extra: 'Medallón' },
        { lugar: 3, premio: 30000, extra: 'Medallón' },
        { lugar: 4, premio: 20000, extra: 'Medallón' },
        { lugar: 5, premio: 10000, extra: 'Medallón' },
      ],
    },
    {
      id: 'd-5',
      badge: '5–10 inscritas',
      subtitulo: 'Entre 5 y 10 participantes en la categoría',
      puestos: [
        { lugar: 1, premio: 40000, extra: 'Medallón + Tricota de Campeona' },
        { lugar: 2, premio: 30000, extra: 'Medallón' },
        { lugar: 3, premio: 20000, extra: 'Medallón' },
        { lugar: 4, premio: 10000, extra: 'Medallón' },
        { lugar: 5, premio: 10000, extra: 'Medallón' },
      ],
    },
    {
      id: 'd-3',
      badge: '3 o menos',
      subtitulo: 'Hasta 3 participantes en la categoría',
      puestos: [
        { lugar: 1, premio: 20000, extra: 'Medallón' },
        { lugar: 2, premio: 10000, extra: 'Medallón' },
        { lugar: 3, premio: 10000, extra: 'Medallón' },
      ],
    },
  ],
}
