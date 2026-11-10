import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TooManyLoginAttemptsError } from '../../domain';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new TooManyLoginAttemptsError();
  }
}
