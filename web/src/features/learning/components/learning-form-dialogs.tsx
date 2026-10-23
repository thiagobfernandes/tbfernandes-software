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
    toast.success(`${noun} updated`);
  } else {
    dataActions.create(key, values as never);
    toast.success(`${noun} created`);
  }
}

export function StudyFormDialog({ item, ...dialog }: DialogProps<Study>) {
  const { goals, skills } = useAppData();
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Edit study" : "New study"}
      description="A focused learning effort, usually serving a goal."
      schema={studySchema}
      submitLabel={item ? "Save changes" : "Create study"}
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
          label: "Name",
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
          label: "Goal",
          type: "select",
          optional: true,
          options: goals.map((g) => ({ value: g.id, label: g.name })),
        },
        { name: "startDate", label: "Start", type: "date" },
        { name: "dueDate", label: "Due", type: "date" },
        {
          name: "nextActivity",
          label: "Next activity",
          type: "text",
          full: true,
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 2,
        },
        {
          name: "skillIds",
          label: "Skills it develops",
          type: "multi",
          options: skills.map((s) => ({ value: s.id, label: s.name })),
          emptyLabel: "Add skills first.",
        },
      ]}
      onSubmit={(values) => save("studies", "Study", item?.id, values)}
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
      title={item ? "Edit material" : "New material"}
      description="Consuming a material is not the same as mastering the topic."
      schema={materialSchema}
      submitLabel={item ? "Save changes" : "Add material"}
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
          label: "Title",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "type",
          label: "Type",
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
          label: "Study",
          type: "select",
          optional: true,
          options: studies.map((s) => ({ value: s.id, label: s.name })),
        },
        { name: "url", label: "Link", type: "url", placeholder: "https://" },
        { name: "notes", label: "Notes", type: "textarea", rows: 2 },
      ]}
      onSubmit={(values) => save("materials", "Material", item?.id, values)}
    />
  );
}

export function SkillFormDialog({ item, ...dialog }: DialogProps<Skill>) {
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Edit skill" : "New skill"}
      description="The level is your own assessment; evidence keeps it honest."
      schema={skillSchema}
      submitLabel={item ? "Save changes" : "Add skill"}
      defaults={{
        name: item?.name ?? "",
        level: String(item?.level ?? 2) as "1" | "2" | "3" | "4" | "5",
        evidence: item?.evidence ?? "",
      }}
      fields={[
        { name: "name", label: "Skill", type: "text", required: true },
        {
          name: "level",
          label: "Level",
          type: "select",
          options: [1, 2, 3, 4, 5].map((level) => ({
            value: String(level),
            label: `${level} · ${skillLevelLabels[level]}`,
          })),
        },
        {
          name: "evidence",
          label: "Evidence",
          type: "textarea",
          rows: 2,
          placeholder: "Projects, results or feedback that show it",
        },
      ]}
      onSubmit={(values) =>
        save("skills", "Skill", item?.id, {
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
      title={item ? "Edit certification" : "New certification"}
      schema={certificationSchema}
      submitLabel={item ? "Save changes" : "Add certification"}
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
          label: "Name",
          type: "text",
          required: true,
          full: true,
        },
        { name: "issuer", label: "Issuer", type: "text", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: certificationStatusOptions,
        },
        { name: "obtainedAt", label: "Obtained on", type: "date" },
        { name: "expiresAt", label: "Expires on", type: "date" },
        {
          name: "validationUrl",
          label: "Validation link",
          type: "url",
          full: true,
          placeholder: "https://",
        },
        {
          name: "studyIds",
          label: "Related studies",
          type: "multi",
          options: studies.map((s) => ({ value: s.id, label: s.name })),
        },
      ]}
      onSubmit={(values) =>
        save("certifications", "Certification", item?.id, values)
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
      title={item ? "Edit education" : "New education"}
      schema={educationSchema}
      submitLabel={item ? "Save changes" : "Add education"}
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
          label: "Institution",
          type: "text",
          required: true,
          full: true,
        },
        { name: "course", label: "Course", type: "text", required: true },
        {
          name: "degree",
          label: "Degree",
          type: "text",
          required: true,
          placeholder: "Bachelor, MBA…",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "in_progress", label: "In progress" },
            { value: "completed", label: "Completed" },
            { value: "paused", label: "Paused" },
          ],
        },
        { name: "startDate", label: "Start", type: "date", required: true },
        { name: "endDate", label: "End", type: "date" },
      ]}
      onSubmit={(values) => save("educations", "Education", item?.id, values)}
    />
  );
}
