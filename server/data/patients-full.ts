import { Patient, Gender } from '../../shared/src/types/medicalTypes';

const patients: Patient[] = [
  {
    id: 'd2773336-f723-11e9-8f0b-362b9e155667',
    name: 'John McClane',
    dateOfBirth: '1986-07-09',
    ssn: '090786-122X',
    gender: Gender.Male,
    occupation: 'New york city cop',
    entries: [
      {
        id: 'd811e46d-70b3-4d90-b090-4535c7cf8fb1',
        date: '2015-01-02',
        type: 'Hospital',
        specialist: 'MD House',
        diagnosisCodes: ['S62.5'],
        description:
          "Healing time appr. 2 weeks. patient doesn't remember how he got the injury.",
        discharge: {
          date: '2015-01-16',
          criteria: 'Thumb has healed.',
        },
      },
    ],
  },
  {
    id: 'd2773598-f723-11e9-8f0b-362b9e155667',
    name: 'Martin Riggs',
    dateOfBirth: '1979-01-30',
    ssn: '300179-777A',
    gender: Gender.Male,
    occupation: 'Cop',
    entries: [
      {
        id: 'fcd59fa6-c4b4-4fec-ac4d-df4fe1f85f62',
        date: '2019-08-05',
        type: 'OccupationalHealthcare',
        specialist: 'MD House',
        employerName: 'HyPD',
        diagnosisCodes: ['Z57.1', 'Z74.3', 'M51.2'],
        description:
          'Patient mistakenly found himself in a nuclear plant waste site without protection gear. Very minor radiation poisoning. ',
        sickLeave: {
          startDate: '2019-08-05',
          endDate: '2019-08-28',
        },
      },
    ],
  },
  {
    id: 'd27736ec-f723-11e9-8f0b-362b9e155667',
    name: 'Hans Gruber',
    dateOfBirth: '1970-04-25',
    ssn: '250470-555L',
    gender: Gender.Other,
    occupation: 'Technician',
    entries: [],
  },
  {
    id: 'd2773822-f723-11e9-8f0b-362b9e155667',
    name: 'Dana Scully',
    dateOfBirth: '1974-01-05',
    ssn: '050174-432N',
    gender: Gender.Female,
    occupation: 'Forensic Pathologist',
    entries: [
      {
        id: 'b4f4eca1-2aa7-4b13-9a18-4a5535c3c8da',
        date: '2019-10-20',
        specialist: 'MD House',
        type: 'HealthCheck',
        description: 'Yearly control visit. Cholesterol levels back to normal.',
        healthCheckRating: 0,
      },
      {
        id: 'fcd59fa6-c4b4-4fec-ac4d-df4fe1f85f62',
        date: '2019-09-10',
        specialist: 'MD House',
        type: 'OccupationalHealthcare',
        employerName: 'FBI',
        description: 'Prescriptions renewed.',
      },
      {
        id: '37be178f-a432-4ba4-aac2-f86810e36a15',
        date: '2018-10-05',
        specialist: 'MD House',
        type: 'HealthCheck',
        description:
          'Yearly control visit. Due to high cholesterol levels recommended to eat more vegetables.',
        healthCheckRating: 1,
      },
    ],
  },
  {
    id: 'd2773c6e-f723-11e9-8f0b-362b9e155667',
    name: 'Matti Luukkainen',
    dateOfBirth: '1971-04-09',
    ssn: '090471-8890',
    gender: Gender.Male,
    occupation: 'Digital evangelist',
    entries: [
      {
        id: '54a8746e-34c4-4cf4-bf72-bfecd039be9a',
        date: '2019-05-01',
        specialist: 'Dr Byte House',
        type: 'HealthCheck',
        description: 'Digital overdose, very bytestatic. Otherwise healthy.',
        healthCheckRating: 0,
      },
    ],
  },
  {
    id: 'd2773c6f-f723-11e9-8f0b-362b9e155668',
    name: 'Sarah Connor',
    dateOfBirth: '1959-05-13',
    ssn: '130559-882T',
    gender: Gender.Female,
    occupation: 'Resistance Fighter',
    entries: [
      {
        id: 'b8839d46-5e5c-4f3b-8a44-5a4a5e5c4f3b',
        date: '2025-01-15',
        type: 'Hospital',
        specialist: 'Dr. Silberman',
        diagnosisCodes: ['T14.8', 'Z57.1'],
        description: 'Gunshot wound to the shoulder',
        discharge: {
          date: '2025-01-30',
          criteria: 'Wound healed, physical therapy completed'
        }
      },
      {
        id: 'd4e5f6a7-b8c9-4d3e-9f10-1a2b3c4d5e6f',
        date: '2025-03-22',
        type: 'OccupationalHealthcare',
        specialist: 'Dr. Silberman',
        employerName: 'Resistance',
        diagnosisCodes: ['Z73.0'],
        description: 'Stress management counseling',
        sickLeave: {
          startDate: '2025-03-22',
          endDate: '2025-04-05'
        }
      }
    ]
  },
  {
    id: 'd2773c70-f723-11e9-8f0b-362b9e155669',
    name: 'Thomas Anderson',
    dateOfBirth: '1964-09-13',
    ssn: '130964-888M',
    gender: Gender.Male,
    occupation: 'The One',
    entries: [
      {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        date: '2025-02-10',
        type: 'HealthCheck',
        specialist: 'The Oracle',
        description: 'Routine check-up. Everything is perfect.',
        healthCheckRating: 0
      },
      {
        id: '6f5e4d3c-2b1a-4987-9c8d-7e6f5a4b3c2d',
        date: '2025-02-11',
        type: 'Hospital',
        specialist: 'Morpheus',
        diagnosisCodes: ['T14.8'],
        description: 'Gunshot wound during training simulation',
        discharge: {
          date: '2025-02-12',
          criteria: 'Bullet removed and wound healed instantly'
        }
      }
    ]
  },
  {
    id: 'd2773c71-f723-11e9-8f0b-362b9e155670',
    name: 'Trinity',
    dateOfBirth: '1973-08-21',
    ssn: '210873-889T',
    gender: Gender.Female,
    occupation: 'Hacker',
    entries: [
      {
        id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
        date: '2025-03-15',
        type: 'OccupationalHealthcare',
        specialist: 'Morpheus',
        employerName: 'Resistance',
        diagnosisCodes: ['M70.1'],
        description: 'Repetitive strain injury from hacking',
        sickLeave: {
          startDate: '2025-03-15',
          endDate: '2025-03-25'
        }
      },
      {
        id: '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        date: '2025-04-01',
        type: 'HealthCheck',
        specialist: 'The Oracle',
        description: 'Annual check-up. Excellent health.',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c72-f723-11e9-8f0b-362b9e155671',
    name: 'Ellen Ripley',
    dateOfBirth: '2092-01-07',
    ssn: '070192-991X',
    gender: Gender.Female,
    occupation: 'Warrant Officer',
    entries: [
      {
        id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        date: '2122-06-15',
        type: 'Hospital',
        specialist: 'Dr. Wren',
        diagnosisCodes: ['T63.4'],
        description: 'Alien facehugger attachment',
        discharge: {
          date: '2122-06-30',
          criteria: 'Parasite removed, quarantine completed'
        }
      }
    ]
  },
  {
    id: 'd2773c73-f723-11e9-8f0b-362b9e155672',
    name: 'Rick Deckard',
    dateOfBirth: '2010-01-23',
    ssn: '230110-555R',
    gender: Gender.Male,
    occupation: 'Blade Runner',
    entries: [
      {
        id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
        date: '2049-11-15',
        type: 'HealthCheck',
        specialist: 'Dr. Eldon Tyrell',
        description: 'Baseline test for replicant detection',
        healthCheckRating: 2
      },
      {
        id: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
        date: '2049-11-20',
        type: 'OccupationalHealthcare',
        specialist: 'Dr. Eldon Tyrell',
        employerName: 'LAPD',
        diagnosisCodes: ['F43.1'],
        description: 'Stress-related hallucinations',
        sickLeave: {
          startDate: '2049-11-20',
          endDate: '2049-12-05'
        }
      }
    ]
  },
  {
    id: 'd2773c74-f723-11e9-8f0b-362b9e155674',
    name: 'James Bond',
    dateOfBirth: '1968-11-11',
    ssn: '111168-007J',
    gender: Gender.Male,
    occupation: 'Secret Agent',
    entries: [
      {
        id: 'a1b2c3d4-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
        date: '2025-05-10',
        type: 'HealthCheck',
        specialist: 'Dr. No',
        diagnosisCodes: ['I25.1'],
        description: 'Annual physical. Minor arrhythmia detected.',
        healthCheckRating: 1
      },
      {
        id: 'b2c3d4e5-f7a8-9b0c-1d2e-3f4a5b6c7d8e',
        date: '2025-05-15',
        type: 'Hospital',
        specialist: 'Dr. Q',
        diagnosisCodes: ['T14.8', 'S06.0'],
        description: 'Concussion and multiple injuries from mission',
        discharge: {
          date: '2025-05-25',
          criteria: 'Cleared for duty'
        }
      }
    ]
  },
  {
    id: 'd2773c75-f723-11e9-8f0b-362b9e155675',
    name: 'Bruce Wayne',
    dateOfBirth: '1972-02-19',
    ssn: '190272-001B',
    gender: Gender.Male,
    occupation: 'CEO of Wayne Enterprises',
    entries: [
      {
        id: 'c3d4e5f6-a8b9-0c1d-2e3f-4a5b6c7d8e9f',
        date: '2025-04-01',
        type: 'OccupationalHealthcare',
        specialist: 'Dr. Thompkins',
        employerName: 'Wayne Enterprises',
        diagnosisCodes: ['F43.1'],
        description: 'Stress management therapy',
        sickLeave: {
          startDate: '2025-04-01',
          endDate: '2025-04-10'
        }
      }
    ]
  },
  {
    id: 'd2773c76-f723-11e9-8f0b-362b9e155676',
    name: 'Tony Stark',
    dateOfBirth: '1970-05-29',
    ssn: '290570-001T',
    gender: Gender.Male,
    occupation: 'CEO of Stark Industries',
    entries: [
      {
        id: 'd4e5f6a7-b9c0-d1e2-f3a4-b5c6d7e8f9a0',
        date: '2025-03-12',
        type: 'Hospital',
        specialist: 'Dr. Helen Cho',
        diagnosisCodes: ['T70.2'],
        description: 'Arc reactor maintenance procedure',
        discharge: {
          date: '2025-03-15',
          criteria: 'Reactor stabilized'
        }
      }
    ]
  },
  {
    id: 'd2773c77-f723-11e9-8f0b-362b9e155677',
    name: 'Natasha Romanoff',
    dateOfBirth: '1984-12-03',
    ssn: '031284-002N',
    gender: Gender.Female,
    occupation: 'Security Consultant',
    entries: [
      {
        id: 'e5f6a7b8-c0d1-e2f3-a4b5-c6d7e8f9a0b1',
        date: '2025-02-14',
        type: 'HealthCheck',
        specialist: 'Dr. Banner',
        description: 'Routine check-up. Excellent physical condition.',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c78-f723-11e9-8f0b-362b9e155678',
    name: 'Peter Parker',
    dateOfBirth: '2001-08-10',
    ssn: '100801-003P',
    gender: Gender.Male,
    occupation: 'Photographer',
    entries: [
      {
        id: 'f6a7b8c9-d1e2-f3a4-b5c6-d7e8f9a0b1c2',
        date: '2025-01-05',
        type: 'Hospital',
        specialist: 'Dr. Strange',
        diagnosisCodes: ['T14.8', 'S02.0'],
        description: 'Multiple fractures from high-impact collision',
        discharge: {
          date: '2025-01-10',
          criteria: 'Bones healed'
        }
      }
    ]
  },
  {
    id: 'd2773c79-f723-11e9-8f0b-362b9e155679',
    name: 'Clark Kent',
    dateOfBirth: '1980-04-18',
    ssn: '180480-001C',
    gender: Gender.Male,
    occupation: 'Journalist',
    entries: [
      {
        id: 'a7b8c9d0-e2f3-a4b5-c6d7-e8f9a0b1c2d3',
        date: '2024-12-25',
        type: 'HealthCheck',
        specialist: 'Dr. Hamilton',
        diagnosisCodes: ['Z00.1'],
        description: 'Annual physical. Perfect health.',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c80-f723-11e9-8f0b-362b9e155680',
    name: 'Diana Prince',
    dateOfBirth: '1918-05-01',
    ssn: '010518-001D',
    gender: Gender.Female,
    occupation: 'Museum Curator',
    entries: [
      {
        id: 'b8c9d0e1-f3a4-b5c6-d7e8-f9a0b1c2d3e4',
        date: '2024-11-11',
        type: 'OccupationalHealthcare',
        specialist: 'Dr. Minerva',
        employerName: 'Louvre Museum',
        diagnosisCodes: ['M54.5'],
        description: 'Back pain treatment',
        sickLeave: {
          startDate: '2024-11-11',
          endDate: '2024-11-15'
        }
      }
    ]
  },
  {
    id: 'd2773c88-f723-11e9-8f0b-362b9e155688',
    name: 'Wolverine',
    dateOfBirth: '1880-01-01',
    ssn: '010180-001W',
    gender: Gender.Male,
    occupation: 'X-Men Member',
    entries: [
      {
        id: 'e1d2c3b4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
        date: '2025-06-01',
        type: 'HealthCheck',
        specialist: 'Professor X',
        description: 'Adamantium levels check',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c89-f723-11e9-8f0b-362b9e155689',
    name: 'Storm',
    dateOfBirth: '1975-04-15',
    ssn: '150475-002S',
    gender: Gender.Female,
    occupation: 'X-Men Member',
    entries: [
      {
        id: 'f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f',
        date: '2025-06-02',
        type: 'HealthCheck',
        specialist: 'Professor X',
        description: 'Weather control ability check',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c90-f723-11e9-8f0b-362b9e155690',
    name: 'Charles Xavier',
    dateOfBirth: '1930-07-01',
    ssn: '010730-003X',
    gender: Gender.Male,
    occupation: 'Professor',
    entries: [
      {
        id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        date: '2025-06-03',
        type: 'HealthCheck',
        specialist: 'Dr. McCoy',
        description: 'Neurological examination',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c91-f723-11e9-8f0b-362b9e155691',
    name: 'Jean Grey',
    dateOfBirth: '1980-03-20',
    ssn: '200380-004J',
    gender: Gender.Female,
    occupation: 'Psychologist',
    entries: [
      {
        id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        date: '2025-06-04',
        type: 'HealthCheck',
        specialist: 'Professor X',
        description: 'Telepathic ability assessment',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c92-f723-11e9-8f0b-362b9e155692',
    name: 'Scott Summers',
    dateOfBirth: '1980-08-15',
    ssn: '150880-005S',
    gender: Gender.Male,
    occupation: 'X-Men Leader',
    entries: [
      {
        id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        date: '2025-06-05',
        type: 'HealthCheck',
        specialist: 'Dr. McCoy',
        description: 'Optic blast control check',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c93-f723-11e9-8f0b-362b9e155693',
    name: 'Ororo Munroe',
    dateOfBirth: '1975-04-15',
    ssn: '150475-006O',
    gender: Gender.Female,
    occupation: 'Weather Goddess',
    entries: [
      {
        id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
        date: '2025-06-06',
        type: 'HealthCheck',
        specialist: 'Professor X',
        description: 'Meteorological power assessment',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c94-f723-11e9-8f0b-362b9e155694',
    name: 'Piotr Rasputin',
    dateOfBirth: '1982-09-25',
    ssn: '250982-007P',
    gender: Gender.Male,
    occupation: 'Artist',
    entries: [
      {
        id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
        date: '2025-06-07',
        type: 'HealthCheck',
        specialist: 'Dr. McCoy',
        description: 'Metallic skin durability test',
        healthCheckRating: 0
      }
    ]
  },
  {
    id: 'd2773c95-f723-11e9-8f0b-362b9e155695',
    name: 'Bruce Banner',
    dateOfBirth: '1969-12-18',
    ssn: '181269-001B',
    gender: Gender.Male,
    occupation: 'Nuclear Physicist',
    entries: [
      {
        id: 'f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f',
        date: '2025-06-10',
        type: 'HealthCheck',
        specialist: 'Dr. Strange',
        description: 'Gamma radiation levels critical. Immediate hospitalization required.',
        healthCheckRating: 3
      },
      {
        id: 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
        date: '2025-06-11',
        type: 'Hospital',
        specialist: 'Dr. Strange',
        diagnosisCodes: ['T66.6'],
        description: 'Gamma radiation poisoning with cellular degeneration',
        discharge: {
          date: '2025-06-20',
          criteria: 'Radiation levels stabilized, but condition remains critical'
        }
      }
    ]
  },
];

export default patients;