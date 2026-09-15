import { createTestRegistrationPayload } from './test-registration-data';

describe('createTestRegistrationPayload', () => {
  it('creates a team with the expected athlete mix', () => {
    const payload = createTestRegistrationPayload({
      eventShortName: 'dtteams2026',
      categories: ['Open', 'Scaled'],
      femaleCount: 2,
      maleCount: 4,
    });

    expect(payload.event_short_name).toBe('dtteams2026');
    expect(payload.category).toMatch(/Open|Scaled/);
    expect(payload.team_name).toContain('Test ');
    expect(payload.athletes).toHaveSize(6);
    expect(payload.athletes.filter((athlete) => athlete.sex === 'F')).toHaveSize(2);
    expect(payload.athletes.filter((athlete) => athlete.sex === 'M')).toHaveSize(4);

    for (const athlete of payload.athletes) {
      expect(athlete.first_name).toBeTruthy();
      expect(athlete.last_name).toBeTruthy();
      expect(athlete.email).toContain('@example.com');
      expect(athlete.date_of_birth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(athlete.phone_number).toMatch(/^9\d{9}$/);
      expect(athlete.gym).toBe('CFMF');
    }
  });
});
