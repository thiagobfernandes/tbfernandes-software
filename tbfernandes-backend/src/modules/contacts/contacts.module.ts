import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { WorkModule } from '../work';
import { ContactService } from './application/contact.service';
import { ContactsLookupService } from './application/contacts-lookup.service';
import { InteractionService } from './application/interaction.service';
import { WorkEventsListener } from './application/work-events.listener';
import { ContactsLookup } from './contacts.lookup';
import { ContactRepository, InteractionRepository } from './domain';
import { ContactEntity } from './infrastructure/persistence/contact.entity';
import { InteractionEntity } from './infrastructure/persistence/interaction.entity';
import { TypeOrmContactRepository } from './infrastructure/persistence/typeorm-contact.repository';
import { TypeOrmInteractionRepository } from './infrastructure/persistence/typeorm-interaction.repository';
import { ContactController } from './web/contact.controller';
import { InteractionController } from './web/interaction.controller';

/**
 * Contacts: professional network and interaction history. Follow-up tasks are created
 * through FollowUpTasks (work's public API), never by writing to its tables.
 */
@Module({
  imports: [
    WorkModule,
    DatabaseModule.forFeature([ContactEntity, InteractionEntity]),
  ],
  controllers: [ContactController, InteractionController],
  providers: [
    ContactService,
    InteractionService,
    ContactsLookupService,
    WorkEventsListener,
    { provide: ContactRepository, useClass: TypeOrmContactRepository },
    { provide: InteractionRepository, useClass: TypeOrmInteractionRepository },
    { provide: ContactsLookup, useExisting: ContactsLookupService },
  ],
  exports: [ContactsLookup],
})
export class ContactsModule {}
