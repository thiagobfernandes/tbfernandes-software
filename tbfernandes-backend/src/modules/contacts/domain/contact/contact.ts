import {
  BusinessRuleViolationError,
  InvalidArgumentError,
  IsoDate,
  Require,
} from '../../../../common/domain';

/** The editable fields of a contact. */
export interface ContactDetails {
  name: string;
  /** work.company (other module). */
  companyId: string | null;
  /** For organizations not registered as companies. */
  companyName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  profileUrl: string | null;
  specialties: string[];
  context: string | null;
  nextContact: IsoDate | null;
  notes: string | null;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * A person in the professional network (RF-CTC-01). Linked to a registered company or, for
 * organizations not registered, just its name; never both (RN-23).
 */
export class Contact {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: ContactDetails,
  ) {}

  static create(id: string, ownerId: string, details: ContactDetails): Contact {
    return new Contact(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Contact.validated(details),
    );
  }

  /** Rebuilds a contact already stored; no rules run. */
  static restore(
    id: string,
    ownerId: string,
    details: ContactDetails,
  ): Contact {
    return new Contact(id, ownerId, details);
  }

  get details(): ContactDetails {
    return { ...this._details, specialties: [...this._details.specialties] };
  }

  update(details: ContactDetails): void {
    this._details = Contact.validated(details);
  }

  /** The registered company was deleted: keep the contact, drop the link. */
  companyDeleted(): void {
    this._details = { ...this._details, companyId: null };
  }

  private static validated(d: ContactDetails): ContactDetails {
    const companyName = Require.optionalText(d.companyName, 'companyName', 120);
    if (d.companyId != null && companyName != null) {
      throw new BusinessRuleViolationError(
        'RN-23',
        'Use uma empresa cadastrada ou um nome de empresa, não os dois',
      );
    }
    const email = Require.optionalText(d.email, 'email', 254);
    if (email != null && !EMAIL.test(email)) {
      throw new InvalidArgumentError('email não é válido');
    }
    const specialties = [
      ...new Set(
        (d.specialties ?? [])
          .filter((s) => s != null && s.trim() !== '')
          .map((s) => s.trim()),
      ),
    ];
    return {
      name: Require.text(d.name, 'name', 120),
      companyId: d.companyId ?? null,
      companyName,
      role: Require.optionalText(d.role, 'role', 120),
      email: email?.toLowerCase() ?? null,
      phone: Require.optionalText(d.phone, 'phone', 40),
      profileUrl: Require.optionalText(d.profileUrl, 'profileUrl', 2000),
      specialties,
      context: Require.optionalText(d.context, 'context', 2000),
      nextContact: d.nextContact ?? null,
      notes: Require.optionalText(d.notes, 'notes', 5000),
    };
  }
}
