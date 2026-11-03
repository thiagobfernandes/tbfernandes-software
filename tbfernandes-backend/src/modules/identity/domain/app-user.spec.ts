import {
  BusinessRuleViolationError,
  InvalidArgumentError,
} from '../../../common/domain';
import { AppUser } from './app-user';
import { checkPassword } from './password-policy';

describe('AppUser', () => {
  const profile = {
    name: 'Thiago',
    email: ' Owner@Example.com',
    locale: null,
    timeZone: null,
  };

  it('normalizes the e-mail and fills locale and time zone', () => {
    const user = AppUser.create('u1', profile);
    expect(user.profile).toEqual({
      name: 'Thiago',
      email: 'owner@example.com',
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
    });
    expect(user.canLogIn()).toBe(false);
  });

  it('refuses an invalid e-mail or time zone', () => {
    expect(() => AppUser.create('u1', { ...profile, email: 'nope' })).toThrow(
      InvalidArgumentError,
    );
    expect(() =>
      AppUser.create('u1', { ...profile, timeZone: 'Mars/Base' }),
    ).toThrow(InvalidArgumentError);
  });
});

describe('password policy (RN-25)', () => {
  it('needs 12 to 128 characters', () => {
    expect(() => checkPassword('short')).toThrow(BusinessRuleViolationError);
    expect(() => checkPassword('x'.repeat(129))).toThrow(
      BusinessRuleViolationError,
    );
    expect(checkPassword('correct horse battery')).toBe(
      'correct horse battery',
    );
  });
});
