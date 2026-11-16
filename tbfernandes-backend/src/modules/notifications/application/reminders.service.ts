import { Injectable } from '@nestjs/common';
import { Clock } from '../../../common/application';
import { ContactsLookup } from '../../contacts';
import { WorkLookup } from '../../work';
import { NotificationService } from './notification.service';

const OPEN = new Set(['backlog', 'todo', 'in_progress', 'blocked']);

/**
 * RF-NTF-03: tasks due today, overdue tasks and contacts due for a follow-up. Checked on a
 * timer and whenever the list is opened; each reminder is created once (RN-39).
 */
@Injectable()
export class RemindersService {
  constructor(
    private readonly work: WorkLookup,
    private readonly contacts: ContactsLookup,
    private readonly notifications: NotificationService,
    private readonly clock: Clock,
  ) {}

  async check(ownerId: string): Promise<void> {
    const today = this.clock.today();
    const [tasks, contacts] = await Promise.all([
      this.work.tasks(ownerId),
      this.contacts.contacts(ownerId),
    ]);
    for (const task of tasks) {
      if (!task.dueDate || !OPEN.has(task.status)) continue;
      if (task.dueDate === today)
        await this.notifications.notify(ownerId, {
          kind: 'TASK_DUE',
          title: `Vence hoje: ${task.title}`,
          body: null,
          href: '/tasks',
          key: `task-due:${task.id}:${today}`,
        });
      else if (task.dueDate < today)
        await this.notifications.notify(ownerId, {
          kind: 'TASK_OVERDUE',
          title: `Atrasada: ${task.title}`,
          body: `Venceu em ${task.dueDate.split('-').reverse().join('/')}.`,
          href: '/tasks',
          key: `task-overdue:${task.id}:${task.dueDate}`,
        });
    }
    for (const contact of contacts) {
      if (!contact.nextContact || contact.nextContact > today) continue;
      await this.notifications.notify(ownerId, {
        kind: 'CONTACT_FOLLOW_UP',
        title: `Hora de falar com ${contact.name}`,
        body: contact.companyName ?? null,
        href: `/contacts?contact=${contact.id}`,
        key: `contact:${contact.id}:${contact.nextContact}`,
      });
    }
  }
}
