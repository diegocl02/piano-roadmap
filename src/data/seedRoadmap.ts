import { Roadmap } from '@/types';

export const seedRoadmap: Roadmap = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Dominio del Jazz y Técnica',
  description: 'Piano roadmap completo para dominar jazz e improvisación',
  createdAt: new Date().toISOString(),
  phases: [
    {
      id: 'phase-1',
      name: 'Fase 1: Fundamentos',
      activeDays: 66,
      sprints: [
        {
          id: 'sprint-1',
          name: 'Sprint 1: Días 1-22 — Maj7 & Dom7',
          dayStart: 1,
          dayEnd: 22,
          session: {
            id: 'session-sprint-1',
            modules: [
              {
                id: 'mod-technique-s1',
                name: 'Técnica',
                category: 'technique',
                description: 'Escalas Sol, La, Mi, Mib + menores naturales',
                defaultMinutes: 10,
                color: 'cyan',
              },
              {
                id: 'mod-jazz-s1',
                name: 'Laboratorio de Jazz',
                category: 'jazz',
                description: 'Acordes Maj7 y Dom7 — Círculo de quintas',
                defaultMinutes: 30,
                color: 'emerald',
              },
              {
                id: 'mod-reading-s1',
                name: 'Lectura',
                category: 'reading',
                description: "Alfred's Adult Course 2 — Primer 25%",
                defaultMinutes: 15,
                color: 'orange',
              },
            ],
          },
        },
        {
          id: 'sprint-2',
          name: 'Sprint 2: Días 23-44 — m7',
          dayStart: 23,
          dayEnd: 44,
          session: {
            id: 'session-sprint-2',
            modules: [
              {
                id: 'mod-technique-s2',
                name: 'Técnica',
                category: 'technique',
                description: 'Escalas Sol, La, Mi, Mib + menores armónicas',
                defaultMinutes: 10,
                color: 'cyan',
              },
              {
                id: 'mod-jazz-s2',
                name: 'Laboratorio de Jazz',
                category: 'jazz',
                description: 'Acordes m7 — Círculo de quintas completo',
                defaultMinutes: 30,
                color: 'emerald',
              },
              {
                id: 'mod-reading-s2',
                name: 'Lectura',
                category: 'reading',
                description: "Alfred's Adult Course 2 — 25%-50%",
                defaultMinutes: 15,
                color: 'orange',
              },
            ],
          },
        },
        {
          id: 'sprint-3',
          name: 'Sprint 3: Días 45-66 — m7b5 & dim7',
          dayStart: 45,
          dayEnd: 66,
          session: {
            id: 'session-sprint-3',
            modules: [
              {
                id: 'mod-technique-s3',
                name: 'Técnica',
                category: 'technique',
                description: 'Escalas completas + menores melódicas',
                defaultMinutes: 10,
                color: 'cyan',
              },
              {
                id: 'mod-jazz-s3',
                name: 'Laboratorio de Jazz',
                category: 'jazz',
                description: 'Acordes m7b5 y dim7 — Voicings y progresiones ii-V-I',
                defaultMinutes: 30,
                color: 'emerald',
              },
              {
                id: 'mod-reading-s3',
                name: 'Lectura',
                category: 'reading',
                description: "Alfred's Adult Course 2 — 50%-75%",
                defaultMinutes: 15,
                color: 'orange',
              },
            ],
          },
        },
      ],
    },
  ],
};
