import { Injectable } from '@nestjs/common';
import { IdGenerator } from '../../common/application';
import { RequestContext } from '../../common/context/request-context';
import { uuidv7 } from '../../common/domain';

/** Hands the client's X-Client-Id to the first aggregate of the request (ADR-007). */
@Injectable()
export class RequestIdGenerator extends IdGenerator {
  forNewAggregate(): string {
    const state = RequestContext.current();
    const requested = state?.requestedClientId;
    if (state && requested) {
      state.requestedClientId = undefined;
      state.assignedClientId = requested;
      return requested;
    }
    return uuidv7();
  }

  newId(): string {
    return uuidv7();
  }
}
