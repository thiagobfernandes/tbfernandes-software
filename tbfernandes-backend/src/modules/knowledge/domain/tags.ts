import { InvalidArgumentError } from '../../../common/domain';

/** Tags are trimmed, lower case, unique and kept in the order given. */
export const Tags = {
  normalize(tags: readonly (string | null)[] | null | undefined): string[] {
    const clean = [
      ...new Set(
        (tags ?? [])
          .filter((tag): tag is string => tag != null && tag.trim() !== '')
          .map((tag) => tag.trim().toLowerCase()),
      ),
    ];
    if (clean.some((tag) => tag.length > 40)) {
      throw new InvalidArgumentError('tags devem ter no máximo 40 caracteres');
    }
    return clean;
  },
};
