import { apiAthleteRegistrationModel } from 'src/app/api/models';
import { apiTeamRegistrationModel } from 'src/app/api/models/api-team-registration-model';

const FIRST_NAMES = {
  F: ['Aisha', 'Priya', 'Neha', 'Ananya', 'Kavya', 'Riya', 'Sneha', 'Meera'],
  M: ['Arjun', 'Rohan', 'Vikram', 'Karan', 'Aditya', 'Nikhil', 'Rahul', 'Dev'],
} as const;

const LAST_NAMES = [
  'Sharma',
  'Patel',
  'Reddy',
  'Iyer',
  'Nair',
  'Kapoor',
  'Menon',
  'Desai',
  'Rao',
  'Singh',
];

const TEAM_ADJECTIVES = [
  'Mighty',
  'Thunder',
  'Iron',
  'Rogue',
  'Savage',
  'Elite',
  'Prime',
  'Alpha',
];

const TEAM_NOUNS = [
  'Wolves',
  'Titans',
  'Barbells',
  'Burpees',
  'Engines',
  'Legends',
  'Crew',
  'Squad',
];

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Chennai', 'Delhi'];

export interface TestRegistrationOptions {
  eventShortName: string;
  categories: string[];
  femaleCount: number;
  maleCount: number;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateOfBirth(): string {
  const year = randomInt(1988, 2002);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomPhoneNumber(): string {
  return `9${String(randomInt(100000000, 999999999))}`;
}

function createAthlete(
  sex: 'M' | 'F',
  index: number,
  suffix: string
): apiAthleteRegistrationModel {
  const firstName = pick(FIRST_NAMES[sex]);
  const lastName = pick(LAST_NAMES);

  return {
    first_name: firstName,
    last_name: lastName,
    sex,
    email: `test.${suffix}.${sex.toLowerCase()}${index + 1}@example.com`,
    phone_number: randomPhoneNumber(),
    date_of_birth: randomDateOfBirth(),
    gym: 'CFMF',
    city: pick(CITIES),
  };
}

export function createTestRegistrationPayload(
  options: TestRegistrationOptions
): apiTeamRegistrationModel {
  const suffix = `${Date.now()}-${randomInt(1000, 9999)}`;
  const teamName = `Test ${pick(TEAM_ADJECTIVES)} ${pick(TEAM_NOUNS)} ${randomInt(100, 999)}`;

  const athletes: apiAthleteRegistrationModel[] = [
    ...Array.from({ length: options.femaleCount }, (_, index) =>
      createAthlete('F', index, suffix)
    ),
    ...Array.from({ length: options.maleCount }, (_, index) =>
      createAthlete('M', index, suffix)
    ),
  ];

  return {
    team_name: teamName,
    category: pick(options.categories),
    event_short_name: options.eventShortName,
    athletes,
  };
}
