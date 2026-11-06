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

export const StudyMapper = {
  toDetails(request: ValidStudyRequest): StudyDetails {
    return { ...request, skillIds: request.skillIds ?? [] };
  },
  toResponse(study: Study): StudyResponse {
    const details = study.details;
    return {
      id: study.id,
      ...details,
      status: study.status.toLowerCase(),
      skillIds: sorted(details.skillIds),
    };
  },
};

export const MaterialMapper = {
  toDetails(request: ValidMaterialRequest): MaterialDetails {
    return { ...request };
  },
  toResponse(material: Material): MaterialResponse {
    const details = material.details;
    return {
      id: material.id,
      ...details,
      type: details.type.toLowerCase(),
      status: material.status.toLowerCase(),
    };
  },
};

export const SkillMapper = {
  toDetails(request: ValidSkillRequest): SkillDetails {
    return { ...request, level: request.level ?? 0 };
  },
  toResponse(skill: Skill): SkillResponse {
    return { id: skill.id, ...skill.details };
  },
};

export const CertificationMapper = {
  toDetails(request: ValidCertificationRequest): CertificationDetails {
    return { ...request, studyIds: request.studyIds ?? [] };
  },
  toResponse(certification: Certification): CertificationResponse {
    const details = certification.details;
    return {
      id: certification.id,
      ...details,
      status: certification.status.toLowerCase(),
      studyIds: sorted(details.studyIds),
    };
  },
};

export const EducationMapper = {
  toDetails(request: ValidEducationRequest): EducationDetails {
    return { ...request };
  },
  toResponse(education: Education): EducationResponse {
    const details = education.details;
    return {
      id: education.id,
      ...details,
      status: details.status.toLowerCase(),
    };
  },
};
