import { AppUser, Profile } from '../../domain';
import { MeResponse } from '../me.response';
import { ProfileRequest } from '../profile.request';

export const MeMapper = {
  toResponse(user: AppUser): MeResponse {
    const profile = user.profile;
    return {
      id: user.id,
      name: profile.name,
      email: profile.email,
      locale: profile.locale ?? 'pt-BR',
      timeZone: profile.timeZone ?? 'America/Sao_Paulo',
      hasPassword: user.canLogIn(),
    };
  },

  toProfile(request: ProfileRequest): Profile {
    return {
      name: request.name,
      email: request.email,
      locale: request.locale ?? null,
      timeZone: request.timeZone ?? null,
    };
  },
};
