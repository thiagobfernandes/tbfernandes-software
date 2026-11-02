import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'tbf:public';

/** Route open without a session in session mode (login, health, webhooks). */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC, true);
