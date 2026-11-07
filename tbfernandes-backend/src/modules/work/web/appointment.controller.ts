import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IdParam, ValidatedBody } from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { AppointmentService } from '../application/appointment.service';
import {
  AppointmentMapper,
  AppointmentRequest,
  appointmentRequestSchema,
  AppointmentResponse,
} from '../protocols';
import type { ValidAppointmentRequest } from '../protocols';

@ApiTags('work')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointments: AppointmentService) {}

  @Get()
  async list(): Promise<AppointmentResponse[]> {
    return (await this.appointments.list()).map((item) =>
      AppointmentMapper.toResponse(item),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<AppointmentResponse> {
    return AppointmentMapper.toResponse(await this.appointments.get(id));
  }

  @Post()
  @ApiBody({ type: AppointmentRequest })
  async create(
    @ValidatedBody(appointmentRequestSchema) body: ValidAppointmentRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AppointmentResponse> {
    const appointment = await this.appointments.create(
      AppointmentMapper.toDetails(body),
    );
    return created(
      res,
      'appointments',
      AppointmentMapper.toResponse(appointment),
    );
  }

  @Put(':id')
  @ApiBody({ type: AppointmentRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(appointmentRequestSchema) body: ValidAppointmentRequest,
  ): Promise<AppointmentResponse> {
    return AppointmentMapper.toResponse(
      await this.appointments.update(id, AppointmentMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.appointments.delete(id);
  }
}
