import { BusinessRuleViolationError } from '../../../common/domain';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** RN-25: length beats composition rules (NIST SP 800-63B). */
export function checkPassword(password: string | null | undefined): string {
  if (
    !password ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new BusinessRuleViolationError(
      'RN-25',
      `A senha precisa ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres`,
    );
  }
  return password;
}
