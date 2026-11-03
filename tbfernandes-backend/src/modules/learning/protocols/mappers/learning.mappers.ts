import {
  Certification,
  CertificationDetails,
  Education,
  EducationDetails,
  Material,
  MaterialDetails,
  Skill,
  SkillDetails,
  Study,
  StudyDetails,
} from '../../domain';
import {
  CertificationResponse,
  ValidCertificationRequest,
} from '../certification.request';
import { EducationResponse, ValidEducationRequest } from '../education.request';
import { MaterialResponse, ValidMaterialRequest } from '../material.request';
import { SkillResponse, ValidSkillRequest } from '../skill.request';
import { StudyResponse, ValidStudyRequest } from '../study.request';

/** Stable order, so equal data gives equal JSON. */
const sorted = (ids: readonly string[]) => [...ids].sort();

/** JSON ↔ Study. */
export const StudyMapper = {
  toDetails(r: ValidStudyRequest): StudyDetails {
    return { ...r, skillIds: r.skillIds ?? [] };
  },
  toResponse(study: Study): StudyResponse {
    const d = study.details;
    return {
      id: study.id,
      ...d,
      status: study.status.toLowerCase(),
      skillIds: sorted(d.skillIds),
    };
  },
};

/** JSON ↔ Material. */
export const MaterialMapper = {
  toDetails(r: ValidMaterialRequest): MaterialDetails {
    return { ...r };
  },
  toResponse(material: Material): MaterialResponse {
    const d = material.details;
    return {
      id: material.id,
      ...d,
      type: d.type.toLowerCase(),
      status: material.status.toLowerCase(),
    };
  },
};

/** JSON ↔ Skill. */
export const SkillMapper = {
  toDetails(r: ValidSkillRequest): SkillDetails {
    return { ...r, level: r.level ?? 0 };
  },
  toResponse(skill: Skill): SkillResponse {
    return { id: skill.id, ...skill.details };
  },
};

/** JSON ↔ Certification. */
export const CertificationMapper = {
  toDetails(r: ValidCertificationRequest): CertificationDetails {
    return { ...r, studyIds: r.studyIds ?? [] };
  },
  toResponse(c: Certification): CertificationResponse {
    const d = c.details;
    return {
      id: c.id,
      ...d,
      status: c.status.toLowerCase(),
      studyIds: sorted(d.studyIds),
    };
  },
};

/** JSON ↔ Education. */
export const EducationMapper = {
  toDetails(r: ValidEducationRequest): EducationDetails {
    return { ...r };
  },
  toResponse(education: Education): EducationResponse {
    const d = education.details;
    return { id: education.id, ...d, status: d.status.toLowerCase() };
  },
};
