import { Appointment, AppointmentDetails } from '../../domain';
import { ValidAppointmentRequest } from '../appointment.request';
import { AppointmentResponse } from '../appointment.response';

export const AppointmentMapper = {
  toDetails(request: ValidAppointmentRequest): AppointmentDetails {
    return { ...request };
  },

  toResponse(appointment: Appointment): AppointmentResponse {
    return { id: appointment.id, ...appointment.details };
  },
};
