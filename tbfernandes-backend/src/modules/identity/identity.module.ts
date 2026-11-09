import { Global, Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { OwnerContext } from '../../common/application';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { authConfig } from '../../infrastructure/environments/registers';
import { Logger } from '../../infrastructure/logger';
import { AccountBootstrapService } from './application/account-bootstrap.service';
import { AuthenticationService } from './application/authentication.service';
import { PasswordHasher } from './application/password-hasher';
import { ProfileService } from './application/profile.service';
import { AppUserRepository } from './domain';
import { AppUserEntity } from './infrastructure/persistence/app-user.entity';
import { TypeOrmAppUserRepository } from './infrastructure/persistence/typeorm-app-user.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { AuthTokenService } from './infrastructure/security/auth-token.service';
import { JwtAuthGuard } from './infrastructure/security/jwt-auth.guard';
import { JwtOwnerContext } from './infrastructure/security/jwt-owner-context';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { LocalStrategy } from './infrastructure/security/local.strategy';
import { AuthController } from './web/auth.controller';
import { MeController } from './web/me.controller';

@Global()
@Module({
  imports: [
    DatabaseModule.forFeature([AppUserEntity]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.jwtSecret,
        signOptions: { algorithm: 'HS256', expiresIn: config.jwtTtlSeconds },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        throttlers: [
          { name: 'login', ttl: 60_000, limit: config.loginAttemptsPerMinute },
        ],
      }),
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    ProfileService,
    AuthenticationService,
    AccountBootstrapService,
    { provide: AppUserRepository, useClass: TypeOrmAppUserRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    AuthTokenService,
    LocalStrategy,
    JwtStrategy,
    { provide: OwnerContext, useClass: JwtOwnerContext },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [OwnerContext],
})
export class IdentityModule implements OnApplicationBootstrap {
  constructor(
    private readonly accounts: AccountBootstrapService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const { email, password } = this.config.bootstrap;
    if (!email || !password) return;
    const result = await this.accounts.bootstrap(
      this.config.bootstrap,
      this.config.ownerId,
    );
    if (result !== 'unchanged') Logger.info(`Account ${email}: ${result}`);
  }
}
