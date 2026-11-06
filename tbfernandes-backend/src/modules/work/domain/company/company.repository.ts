import { Company } from './company';

export abstract class CompanyRepository {
  abstract create(company: Company): Promise<Company>;
  abstract save(company: Company): Promise<Company>;
  abstract findById(ownerId: string, id: string): Promise<Company | null>;
  abstract findAll(ownerId: string): Promise<Company[]>;
  abstract exists(ownerId: string, id: string): Promise<boolean>;
  abstract delete(company: Company): Promise<void>;
}
