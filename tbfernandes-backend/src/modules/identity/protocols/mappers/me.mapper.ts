import { AppUser, Profile } from '../../domain';
import { MeResponse } from '../me.response';
import { ProfileRequest } from '../profile.request';

/** Account ↔ JSON of /me. */
export const MeMapper = {
  toResponse(user: AppUser): MeResponse {
    const p = user.profile;
    return {
      id: user.id,
      name: p.name,
      email: p.email,
      locale: p.locale ?? 'pt-BR',
      timeZone: p.timeZone ?? 'America/Sao_Paulo',
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
