import type { ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { firstValueFrom, of, throwError } from 'rxjs';
import { OwnerContext } from '../../../common/application';
import { prospectingConfig } from '../../../infrastructure/environments/registers';
import {
  ProspectingChangesInterceptor,
  ProspectingEvents,
} from './prospecting-events';

const OWNER = 'screen-owner';
const WORKER_OWNER = 'worker-owner';

function context(method: string, originalUrl: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ method, originalUrl }) }),
  } as ExecutionContext;
}

function setup() {
  const events = new ProspectingEvents();
  const owner: OwnerContext = { currentOwnerId: () => OWNER };
  const config = { ownerId: WORKER_OWNER } as ConfigType<
    typeof prospectingConfig
  >;
  const interceptor = new ProspectingChangesInterceptor(events, owner, config);
  return { events, interceptor };
}

describe('Prospecting realtime notifications', () => {
  it('sends an initial refresh and isolates owners', () => {
    const events = new ProspectingEvents();
    const listener = jest.fn();
    const subscription = events.stream(OWNER).subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    events.publish(WORKER_OWNER);
    expect(listener).toHaveBeenCalledTimes(1);
    events.publish(OWNER);
    expect(listener).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
    events.publish(OWNER);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['PUT', '/api/v1/prospecting/leads/id', OWNER],
    ['POST', '/api/v1/webhooks/prospecting/leads/id/messages', WORKER_OWNER],
  ])(
    'notifies the correct owner after a successful %s',
    async (method, url, expectedOwner) => {
      const { events, interceptor } = setup();
      const publish = jest.spyOn(events, 'publish');
      const result = interceptor.intercept(context(method, url), {
        handle: () => of('saved'),
      });
      expect(publish).not.toHaveBeenCalled();
      await firstValueFrom(result);
      expect(publish).toHaveBeenCalledWith(expectedOwner);
    },
  );

  it('does not notify for reads or failed writes', async () => {
    const { events, interceptor } = setup();
    const publish = jest.spyOn(events, 'publish');
    await firstValueFrom(
      interceptor.intercept(context('GET', '/api/v1/prospecting/leads'), {
        handle: () => of([]),
      }),
    );
    await expect(
      firstValueFrom(
        interceptor.intercept(context('PUT', '/api/v1/prospecting/leads/id'), {
          handle: () => throwError(() => new Error('rolled back')),
        }),
      ),
    ).rejects.toThrow('rolled back');
    expect(publish).not.toHaveBeenCalled();
  });
});
