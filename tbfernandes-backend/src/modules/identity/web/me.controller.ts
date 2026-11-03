import { Controller, Get, HttpCode, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidatedBody } from '../../../common/decorators';
import { ProfileService } from '../application/profile.service';
import {
  MeMapper,
  MeResponse,
  PasswordRequest,
  passwordRequestSchema,
  ProfileRequest,
  profileRequestSchema,
} from '../protocols';

/** The signed-in user's profile and password (IDN-03). */
@ApiTags('identity')
@Controller('me')
export class MeController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  async me(): Promise<MeResponse> {
    return MeMapper.toResponse(await this.profiles.me());
  }

  @Put()
  async update(
    @ValidatedBody(profileRequestSchema) body: ProfileRequest,
  ): Promise<MeResponse> {
    return MeMapper.toResponse(
      await this.profiles.updateProfile(MeMapper.toProfile(body)),
    );
  }

  @Put('password')
  @HttpCode(204)
  async changePassword(
    @ValidatedBody(passwordRequestSchema) body: PasswordRequest,
  ): Promise<void> {
    await this.profiles.changePassword(body.current ?? null, body.next);
  }
}
