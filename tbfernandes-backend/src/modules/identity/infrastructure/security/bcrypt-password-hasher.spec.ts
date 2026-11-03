import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('writes and reads the "{bcrypt}" format of the existing hashes', async () => {
    const hash = await hasher.hash('correct horse battery');
    expect(hash.startsWith('{bcrypt}$2')).toBe(true);
    await expect(hasher.matches('correct horse battery', hash)).resolves.toBe(
      true,
    );
    await expect(hasher.matches('wrong', hash)).resolves.toBe(false);
  });

  it('accepts a hash without prefix and refuses unknown formats', async () => {
    const hash = (await hasher.hash('correct horse battery')).replace(
      '{bcrypt}',
      '',
    );
    await expect(hasher.matches('correct horse battery', hash)).resolves.toBe(
      true,
    );
    await expect(hasher.matches('x', '{noop}x')).resolves.toBe(false);
  });
});
