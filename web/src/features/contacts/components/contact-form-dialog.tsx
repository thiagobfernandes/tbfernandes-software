"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { contactSchema } from "@/features/contacts/schemas/contact-schema";
import type { Contact } from "@/features/contacts/types/contact";
import { dataActions, useAppData } from "@/lib/sample-data/store";

type ContactFormDialogProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  item?: Contact;
  onSaved?: (contact: Contact) => void;
};

export function ContactFormDialog({
  item,
  onSaved,
  ...dialog
}: ContactFormDialogProps) {
  const { companies } = useAppData();
  return (
    <EntityFormDialog
      {...dialog}
      className="sm:max-w-2xl"
      title={item ? "Edit contact" : "New contact"}
      description="Record why the relationship matters, not just how to reach the person."
      schema={contactSchema}
      submitLabel={item ? "Save changes" : "Add contact"}
      defaults={{
        name: item?.name ?? "",
        role: item?.role ?? "",
        companyId: item?.companyId ?? "",
        companyName: item?.companyName ?? "",
        email: item?.email ?? "",
        phone: item?.phone ?? "",
        profileUrl: item?.profileUrl ?? "",
        nextContact: item?.nextContact ?? "",
        specialties: item?.specialties ?? [],
        context: item?.context ?? "",
        notes: item?.notes ?? "",
      }}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "role", label: "Role", type: "text" },
        {
          name: "companyId",
          label: "Company",
          type: "select",
          optional: true,
          options: companies.map((c) => ({ value: c.id, label: c.name })),
        },
        {
          name: "companyName",
          label: "Other organization",
          type: "text",
          hint: "When it is not one of your companies.",
        },
        { name: "email", label: "Email", type: "text" },
        { name: "phone", label: "Phone", type: "text" },
        {
          name: "profileUrl",
          label: "Profile link",
          type: "url",
          placeholder: "https://",
        },
        { name: "nextContact", label: "Next contact", type: "date" },
        { name: "specialties", label: "Specialties", type: "tags" },
        {
          name: "context",
          label: "How you met and why it matters",
          type: "textarea",
          rows: 2,
        },
        { name: "notes", label: "Notes", type: "textarea", rows: 2 },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("contacts", item.id, values);
          toast.success("Contact updated");
          onSaved?.({ ...item, ...values });
        } else {
          const created = dataActions.create("contacts", values);
          toast.success(`${created.name} added`);
          onSaved?.(created);
        }
      }}
    />
  );
}
