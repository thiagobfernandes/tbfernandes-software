import {
  BusinessRuleViolationError,
  InvalidArgumentError,
} from '../../../common/domain';
import {
  Certification,
  CertificationDetails,
} from './certification/certification';
import { Education } from './education/education';
import { Material } from './material/material';
import { Skill } from './skill/skill';
import { Study } from './study/study';

const certification: CertificationDetails = {
  name: 'OCP',
  issuer: 'Oracle',
  status: 'OBTAINED',
  obtainedAt: '2025-01-10',
  expiresAt: '2027-01-10',
  validationUrl: null,
  studyIds: ['s1', 's1'],
};

describe('learning domain', () => {
  it('study defaults to planned, keeps unique skills and checks dates (RN-02)', () => {
    const study = Study.create('s1', 'o1', {
      name: ' Modulith ',
      description: '',
      status: null,
      goalId: null,
      skillIds: ['k1', 'k1'],
      startDate: '2026-10-01',
      dueDate: null,
      nextActivity: null,
    });
    expect(study.status).toBe('PLANNED');
    expect(study.details).toMatchObject({ name: 'Modulith', skillIds: ['k1'] });
    expect(() =>
      study.update({ ...study.details, dueDate: '2026-09-01' }),
    ).toThrow(BusinessRuleViolationError);
  });

  it('material defaults to to_consume and needs a type', () => {
    const material = Material.create('m1', 'o1', {
      studyId: null,
      title: 'Docs',
      type: 'DOCS',
      url: null,
      status: null,
      notes: null,
    });
    expect(material.status).toBe('TO_CONSUME');
    expect(() =>
      material.update({ ...material.details, type: null as never }),
    ).toThrow(InvalidArgumentError);
  });

  it.each([0, 6, 2.5])('skill level %p is outside 1..5 (RN-13)', (level) => {
    expect(() =>
      Skill.create('k1', 'o1', { name: 'Java', level, evidence: null }),
    ).toThrow(BusinessRuleViolationError);
  });

  it('an obtained certification needs the date and expires after it (RN-14)', () => {
    expect(() =>
      Certification.create('c1', 'o1', { ...certification, obtainedAt: null }),
    ).toThrow(BusinessRuleViolationError);
    expect(() =>
      Certification.create('c1', 'o1', {
        ...certification,
        expiresAt: '2025-01-10',
      }),
    ).toThrow(BusinessRuleViolationError);
    expect(
      Certification.create('c1', 'o1', certification).details.studyIds,
    ).toEqual(['s1']);
  });

  it('a certification expires in a window only when obtained (LRN-06)', () => {
    const obtained = Certification.create('c1', 'o1', certification);
    expect(obtained.expiresBetween('2026-12-01', '2027-01-10')).toBe(true);
    expect(obtained.expiresBetween('2026-12-01', '2027-01-09')).toBe(false);
    const planned = Certification.create('c2', 'o1', {
      ...certification,
      status: 'PLANNED',
      obtainedAt: null,
      expiresAt: '2027-01-01',
    });
    expect(planned.expiresBetween('2026-12-01', '2027-01-10')).toBe(false);
  });

  it('education needs a start date before the end (RN-02)', () => {
    expect(() =>
      Education.create('e1', 'o1', {
        institution: 'USP',
        course: 'CS',
        degree: 'BSc',
        status: 'COMPLETED',
        startDate: '2020-02-01',
        endDate: '2019-12-01',
      }),
    ).toThrow(BusinessRuleViolationError);
  });
});
