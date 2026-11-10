import { IdGenerator } from '../../../common/application';
import { AppUser, AppUserRepository } from '../domain';
import { AccountBootstrapService } from './account-bootstrap.service';
import { PasswordHasher } from './password-hasher';

const OWNER_ID = '0192f000-0000-7000-8000-000000000001';
const EMAIL = 'owner@example.com';

class FakeHasher extends PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }
  matches(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${password}`);
  }
}

function setup(existingHash?: string) {
  const stored = new Map<string, AppUser>();
  if (existingHash) {
    const user = AppUser.create(OWNER_ID, {
      name: 'Owner',
      email: EMAIL,
      locale: null,
      timeZone: null,
    });
    user.changePasswordHash(existingHash);
    stored.set(EMAIL, user);
  }
  const users = {
    findByEmail: (email: string) => Promise.resolve(stored.get(email) ?? null),
    findById: () => Promise.resolve(null),
    save: (user: AppUser) => {
      stored.set(user.profile.email, user);
      return Promise.resolve(user);
    },
  } as unknown as AppUserRepository;
  const ids = { newId: () => 'new-id' } as unknown as IdGenerator;
  const uow = {
    run: <T>(work: () => Promise<T>) => work(),
  };
  const service = new AccountBootstrapService(
    users,
    new FakeHasher(),
    ids,
    uow,
  );
  return { service, stored };
}

const account = (password: string, resetPassword = false) => ({
  email: EMAIL,
  password,
  name: 'Owner',
  resetPassword,
});

describe('AccountBootstrapService', () => {
  it('creates the owner account with the hashed password', async () => {
    const { service, stored } = setup();
    await expect(
      service.bootstrap(account('a long enough password'), OWNER_ID),
    ).resolves.toBe('created');
    expect(stored.get(EMAIL)!.passwordHash).toBe(
      'hashed:a long enough password',
    );
  });

  it('keeps an existing password unless a reset is asked', async () => {
    const { service, stored } = setup('hashed:the old long password');
    await expect(
      service.bootstrap(account('a brand new long password'), OWNER_ID),
    ).resolves.toBe('unchanged');
    expect(stored.get(EMAIL)!.passwordHash).toBe(
      'hashed:the old long password',
    );
  });

  it('replaces the password when the reset is asked and it differs', async () => {
    const { service, stored } = setup('hashed:the old long password');
    await expect(
      service.bootstrap(account('a brand new long password', true), OWNER_ID),
    ).resolves.toBe('password-set');
    expect(stored.get(EMAIL)!.passwordHash).toBe(
      'hashed:a brand new long password',
    );
    await expect(
      service.bootstrap(account('a brand new long password', true), OWNER_ID),
    ).resolves.toBe('unchanged');
  });

  it('still refuses a short password (RN-25)', async () => {
    const { service } = setup('hashed:the old long password');
    await expect(
      service.bootstrap(account('short', true), OWNER_ID),
    ).rejects.toMatchObject({ rule: 'RN-25' });
  });
});
