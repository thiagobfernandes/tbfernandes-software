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
      title={item ? "Editar contato" : "Novo contato"}
      description="Registre por que a relação importa, não só como falar com a pessoa."
      schema={contactSchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar contato"}
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
        { name: "name", label: "Nome", type: "text", required: true },
        { name: "role", label: "Cargo", type: "text" },
        {
          name: "companyId",
          label: "Empresa",
          type: "select",
          optional: true,
          options: companies.map((c) => ({ value: c.id, label: c.name })),
        },
        {
          name: "companyName",
          label: "Outra organização",
          type: "text",
          hint: "Quando não for uma das suas empresas.",
        },
        { name: "email", label: "E-mail", type: "text" },
        { name: "phone", label: "Telefone", type: "text" },
        {
          name: "profileUrl",
          label: "Link do perfil",
          type: "url",
          placeholder: "https://",
        },
        { name: "nextContact", label: "Próximo contato", type: "date" },
        { name: "specialties", label: "Especialidades", type: "tags" },
        {
          name: "context",
          label: "Como vocês se conheceram e por que importa",
          type: "textarea",
          rows: 2,
        },
        { name: "notes", label: "Notas", type: "textarea", rows: 2 },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("contacts", item.id, values);
          toast.success("Contato atualizado");
          onSaved?.({ ...item, ...values });
        } else {
          const created = dataActions.create("contacts", values);
          toast.success(`${created.name} adicionado`);
          onSaved?.(created);
        }
      }}
    />
  );
}
