import {
  BusinessRuleViolationError,
  IsoDate,
  Require,
} from '../../../../common/domain';
import { Indicator, IndicatorDetails, Indicators } from './indicator';

export const GOAL_AREAS = [
  'CAREER',
  'FINANCE',
  'LEARNING',
  'HEALTH',
  'PERSONAL',
] as const;
export type GoalArea = (typeof GOAL_AREAS)[number];

export const GOAL_STATUSES = [
  'PLANNED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export interface GoalDetails {
  name: string;
  description: string | null;
  area: GoalArea;
  status: GoalStatus | null;
  priority: GoalPriority | null;
  currentState: string | null;
  desiredResult: string;
  doneCriteria: string | null;
  dueDate: IsoDate | null;
  indicator: IndicatorDetails | null;
  parentId: string | null;
}

export type ValidGoalDetails = Omit<GoalDetails, 'indicator'> & {
  indicator: Indicator | null;
};

export const SELF_PARENT_MESSAGE =
  'Uma meta não pode ser submeta dela mesma nem das suas submetas';

export class Goal {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: ValidGoalDetails,
  ) {}

  static create(id: string, ownerId: string, details: GoalDetails) {
    return new Goal(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Goal.validated(id, details),
    );
  }

  static restore(id: string, ownerId: string, details: ValidGoalDetails) {
    return new Goal(id, ownerId, details);
  }

  get details(): ValidGoalDetails {
    const details = this._details;
    return {
      ...details,
      indicator: details.indicator && { ...details.indicator },
    };
  }

  get status(): GoalStatus {
    return this._details.status ?? 'PLANNED';
  }

  get priority(): GoalPriority {
    return this._details.priority ?? 'NORMAL';
  }

  update(details: GoalDetails): void {
    this._details = Goal.validated(this.id, details);
  }

  /** RF-GOL-04: only the current value of the indicator. */
  recordProgress(current: number): void {
    const indicator = this._details.indicator;
    if (!indicator) {
      throw new BusinessRuleViolationError(
        'RN-21',
        'A meta não tem indicador para atualizar',
      );
    }
    this._details = { ...this._details, indicator: { ...indicator, current } };
  }

  /**
   * GOL-05: a linked task was completed. A planned goal becomes active, and an indicator
   * counted in "tasks" goes up by one. Returns true if anything changed.
   */
  linkedTaskCompleted(): boolean {
    const details = this._details;
    const status = this.status === 'PLANNED' ? 'ACTIVE' : this.status;
    let indicator = details.indicator;
    if (indicator && indicator.unit.toLowerCase() === 'tasks')
      indicator = { ...indicator, current: indicator.current + 100 };
    if (status === this.status && indicator === details.indicator) return false;
    this._details = { ...details, status, indicator };
    return true;
  }

  private static validated(id: string, details: GoalDetails): ValidGoalDetails {
    if (details.parentId != null && details.parentId === id) {
      throw new BusinessRuleViolationError('RN-19', SELF_PARENT_MESSAGE);
    }
    return {
      name: Require.text(details.name, 'name', 200),
      description: Require.optionalText(
        details.description,
        'description',
        2000,
      ),
      area: Require.present(details.area, 'area'),
      status: details.status ?? 'PLANNED',
      priority: details.priority ?? 'NORMAL',
      currentState: Require.optionalText(
        details.currentState,
        'currentState',
        2000,
      ),
      desiredResult: Require.text(details.desiredResult, 'desiredResult', 2000),
      doneCriteria: Require.optionalText(
        details.doneCriteria,
        'doneCriteria',
        1000,
      ),
      dueDate: details.dueDate ?? null,
      indicator: details.indicator && Indicators.of(details.indicator),
      parentId: details.parentId ?? null,
    };
  }
}
