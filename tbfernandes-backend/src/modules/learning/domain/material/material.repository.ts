import { Material } from './material';

export abstract class MaterialRepository {
  abstract create(material: Material): Promise<Material>;
  abstract save(material: Material): Promise<Material>;
  abstract findById(ownerId: string, id: string): Promise<Material | null>;
  /** Ordered by title; all of the owner's when studyId is null. */
  abstract findAll(
    ownerId: string,
    studyId: string | null,
  ): Promise<Material[]>;
  abstract delete(material: Material): Promise<void>;
}
