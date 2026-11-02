import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  IdParam,
  ValidatedBody,
  ValidatedQuery,
} from '../../../common/decorators';
import { created } from '../../../common/web/created';
import { ContactService } from '../application/contact.service';
import {
  contactListQuerySchema,
  ContactMapper,
  ContactRequest,
  contactRequestSchema,
  ContactResponse,
} from '../protocols';
import type { ContactListQuery, ValidContactRequest } from '../protocols';

@ApiTags('contacts')
@Controller('contacts')
export class ContactController {
  constructor(private readonly contacts: ContactService) {}

  /** CTC-04: dueWithinDays keeps contacts to reach out to now or in the next days. */
  @Get()
  @ApiQuery({ name: 'dueWithinDays', required: false, type: Number })
  async list(
    @ValidatedQuery(contactListQuerySchema) query: ContactListQuery,
  ): Promise<ContactResponse[]> {
    return (await this.contacts.list(query.dueWithinDays)).map((contact) =>
      ContactMapper.toResponse(contact),
    );
  }

  @Get(':id')
  async get(@IdParam() id: string): Promise<ContactResponse> {
    return ContactMapper.toResponse(await this.contacts.get(id));
  }

  @Post()
  @ApiBody({ type: ContactRequest })
  async create(
    @ValidatedBody(contactRequestSchema) body: ValidContactRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ContactResponse> {
    const contact = await this.contacts.create(ContactMapper.toDetails(body));
    return created(res, 'contacts', ContactMapper.toResponse(contact));
  }

  @Put(':id')
  @ApiBody({ type: ContactRequest })
  async update(
    @IdParam() id: string,
    @ValidatedBody(contactRequestSchema) body: ValidContactRequest,
  ): Promise<ContactResponse> {
    return ContactMapper.toResponse(
      await this.contacts.update(id, ContactMapper.toDetails(body)),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@IdParam() id: string): Promise<void> {
    await this.contacts.delete(id);
  }
}
