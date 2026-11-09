import { toInstant } from '../../../../common/protocols';
import { TimeEntry, TimeEntryDetails } from '../../domain';
import { ValidTimeEntryRequest } from '../time-entry.request';
import { TimeEntryResponse } from '../time-entry.response';

export const TimeEntryMapper = {
  toDetails(request: ValidTimeEntryRequest): TimeEntryDetails {
    return { ...request };
  },

  toResponse(entry: TimeEntry, now: Date): TimeEntryResponse {
    const details = entry.details;
    return {
      id: entry.id,
      description: details.description,
      projectId: details.projectId,
      taskId: details.taskId,
      startedAt: toInstant(details.startedAt)!,
      endedAt: toInstant(details.endedAt),
      durationSeconds: entry.durationSeconds(now),
      note: details.note,
    };
  },
};
