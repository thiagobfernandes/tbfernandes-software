"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import {
  certificationStatusOptions,
  materialStatusOptions,
  materialTypeOptions,
  skillLevelLabels,
  studyStatusOptions,
} from "@/features/learning/components/learning-meta";
import {
  certificationSchema,
  educationSchema,
  materialSchema,
  skillSchema,
  studySchema,
} from "@/features/learning/schemas/learning-schema";
import type {
  Certification,
  Education,
  LearningMaterial,
  Skill,
  Study,
} from "@/features/learning/types/learning";
import { dataActions, useAppData } from "@/lib/sample-data/store";

type DialogProps<T> = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  item?: T;
};

function save<
  K extends
    "studies" | "materials" | "skills" | "certifications" | "educations",
>(key: K, noun: string, id: string | undefined, values: object) {
  if (id) {
    dataActions.update(key, id, values);
    toast.success(`${noun}: alterações salvas`);
  } else {
    dataActions.create(key, values as never);
    toast.success(`${noun}: registro criado`);
  }
}

export function StudyFormDialog({ item, ...dialog }: DialogProps<Study>) {
  const { goals, skills } = useAppData();
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar estudo" : "Novo estudo"}
      description="Um esforço de aprendizado focado, geralmente a serviço de uma meta."
      schema={studySchema}
      submitLabel={item ? "Salvar alterações" : "Criar estudo"}
      defaults={{
        name: item?.name ?? "",
        status: item?.status ?? "planned",
        goalId: item?.goalId ?? "",
        startDate: item?.startDate ?? "",
        dueDate: item?.dueDate ?? "",
        nextActivity: item?.nextActivity ?? "",
        description: item?.description ?? "",
        skillIds: item?.skillIds ?? [],
      }}
      fields={[
        {
          name: "name",
          label: "Nome",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: studyStatusOptions,
        },
        {
          name: "goalId",
          label: "Meta",
          type: "select",
          optional: true,
          options: goals.map((g) => ({ value: g.id, label: g.name })),
        },
        { name: "startDate", label: "Início", type: "date" },
        { name: "dueDate", label: "Prazo", type: "date" },
        {
          name: "nextActivity",
          label: "Próxima atividade",
          type: "text",
          full: true,
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          rows: 2,
        },
        {
          name: "skillIds",
          label: "Habilidades que desenvolve",
          type: "multi",
          options: skills.map((s) => ({ value: s.id, label: s.name })),
          emptyLabel: "Cadastre habilidades primeiro.",
        },
      ]}
      onSubmit={(values) => save("studies", "Estudo", item?.id, values)}
    />
  );
}

export function MaterialFormDialog({
  item,
  defaultStudyId,
  ...dialog
}: DialogProps<LearningMaterial> & { defaultStudyId?: string }) {
  const { studies } = useAppData();
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar material" : "Novo material"}
      description="Consumir um material não é o mesmo que dominar o assunto."
      schema={materialSchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar material"}
      defaults={{
        title: item?.title ?? "",
        type: item?.type ?? "article",
        status: item?.status ?? "to_consume",
        studyId: item?.studyId ?? defaultStudyId ?? "",
        url: item?.url ?? "",
        notes: item?.notes ?? "",
      }}
      fields={[
        {
          name: "title",
          label: "Título",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "type",
          label: "Tipo",
          type: "select",
          options: materialTypeOptions,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: materialStatusOptions,
        },
        {
          name: "studyId",
          label: "Estudo",
          type: "select",
          optional: true,
          options: studies.map((s) => ({ value: s.id, label: s.name })),
        },
        { name: "url", label: "Link", type: "url", placeholder: "https://" },
        { name: "notes", label: "Notas", type: "textarea", rows: 2 },
      ]}
      onSubmit={(values) => save("materials", "Material", item?.id, values)}
    />
  );
}

export function SkillFormDialog({ item, ...dialog }: DialogProps<Skill>) {
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar habilidade" : "Nova habilidade"}
      description="O nível é sua própria avaliação; as evidências mantêm a avaliação honesta."
      schema={skillSchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar habilidade"}
      defaults={{
        name: item?.name ?? "",
        level: String(item?.level ?? 2) as "1" | "2" | "3" | "4" | "5",
        evidence: item?.evidence ?? "",
      }}
      fields={[
        { name: "name", label: "Habilidade", type: "text", required: true },
        {
          name: "level",
          label: "Nível",
          type: "select",
          options: [1, 2, 3, 4, 5].map((level) => ({
            value: String(level),
            label: `${level} · ${skillLevelLabels[level]}`,
          })),
        },
        {
          name: "evidence",
          label: "Evidências",
          type: "textarea",
          rows: 2,
          placeholder: "Projetos, resultados ou feedbacks que comprovam",
        },
      ]}
      onSubmit={(values) =>
        save("skills", "Habilidade", item?.id, {
          ...values,
          level: Number(values.level),
        })
      }
    />
  );
}

export function CertificationFormDialog({
  item,
  ...dialog
}: DialogProps<Certification>) {
  const { studies } = useAppData();
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar certificação" : "Nova certificação"}
      schema={certificationSchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar certificação"}
      defaults={{
        name: item?.name ?? "",
        issuer: item?.issuer ?? "",
        status: item?.status ?? "planned",
        obtainedAt: item?.obtainedAt ?? "",
        expiresAt: item?.expiresAt ?? "",
        validationUrl: item?.validationUrl ?? "",
        studyIds: item?.studyIds ?? [],
      }}
      fields={[
        {
          name: "name",
          label: "Nome",
          type: "text",
          required: true,
          full: true,
        },
        { name: "issuer", label: "Emissor", type: "text", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: certificationStatusOptions,
        },
        { name: "obtainedAt", label: "Obtida em", type: "date" },
        { name: "expiresAt", label: "Vence em", type: "date" },
        {
          name: "validationUrl",
          label: "Link de validação",
          type: "url",
          full: true,
          placeholder: "https://",
        },
        {
          name: "studyIds",
          label: "Estudos relacionados",
          type: "multi",
          options: studies.map((s) => ({ value: s.id, label: s.name })),
        },
      ]}
      onSubmit={(values) =>
        save("certifications", "Certificação", item?.id, values)
      }
    />
  );
}

export function EducationFormDialog({
  item,
  ...dialog
}: DialogProps<Education>) {
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar formação" : "Nova formação"}
      schema={educationSchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar formação"}
      defaults={{
        institution: item?.institution ?? "",
        course: item?.course ?? "",
        degree: item?.degree ?? "",
        status: item?.status ?? "in_progress",
        startDate: item?.startDate ?? "",
        endDate: item?.endDate ?? "",
      }}
      fields={[
        {
          name: "institution",
          label: "Instituição",
          type: "text",
          required: true,
          full: true,
        },
        { name: "course", label: "Curso", type: "text", required: true },
        {
          name: "degree",
          label: "Grau",
          type: "text",
          required: true,
          placeholder: "Bacharelado, MBA…",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "in_progress", label: "Em andamento" },
            { value: "completed", label: "Concluída" },
            { value: "paused", label: "Pausada" },
          ],
        },
        { name: "startDate", label: "Início", type: "date", required: true },
        { name: "endDate", label: "Fim", type: "date" },
      ]}
      onSubmit={(values) => save("educations", "Formação", item?.id, values)}
    />
  );
}
