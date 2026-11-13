import {
  Routine,
  RoutineCheck,
  RoutineCheckDetails,
  RoutineDetails,
} from '../../domain';
import {
  ValidRoutineCheckRequest,
  ValidRoutineRequest,
} from '../routine.request';
import { RoutineCheckResponse, RoutineResponse } from '../routine.response';

export const RoutineMapper = {
  toDetails(request: ValidRoutineRequest): RoutineDetails {
    return { ...request };
  },

  toResponse(routine: Routine): RoutineResponse {
    return { id: routine.id, ...routine.details };
  },
};

export const RoutineCheckMapper = {
  toDetails(request: ValidRoutineCheckRequest): RoutineCheckDetails {
    return { ...request };
  },

  toResponse(check: RoutineCheck): RoutineCheckResponse {
    return { id: check.id, ...check.details };
  },
};
