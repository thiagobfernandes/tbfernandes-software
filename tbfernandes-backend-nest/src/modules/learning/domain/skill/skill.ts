import { BusinessRuleViolationError, Require } from '../../../../common/domain';

/** The editable fields of a skill. */
export interface SkillDetails {
  name: string;
  /** Self-declared, 1 to 5 (RN-13). */
  level: number;
  evidence: string | null;
}

/** A skill with a self-declared level from 1 to 5 (RF-LRN-03, RN-13). */
export class Skill {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: SkillDetails,
  ) {}

  static create(id: string, ownerId: string, details: SkillDetails): Skill {
    return new Skill(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Skill.validated(details),
    );
  }

  /** Rebuilds a skill already stored; no rules run. */
  static restore(id: string, ownerId: string, details: SkillDetails): Skill {
    return new Skill(id, ownerId, details);
  }

  get details(): SkillDetails {
    return { ...this._details };
  }

  update(details: SkillDetails): void {
    this._details = Skill.validated(details);
  }

  private static validated(d: SkillDetails): SkillDetails {
    const level = d.level ?? 0;
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      throw new BusinessRuleViolationError(
        'RN-13',
        'O nível da habilidade vai de 1 a 5',
      );
    }
    return {
      name: Require.text(d.name, 'name', 120),
      level,
      evidence: Require.optionalText(d.evidence, 'evidence', 2000),
    };
  }
}
