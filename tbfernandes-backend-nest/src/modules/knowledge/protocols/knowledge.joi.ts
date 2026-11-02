import { J, Joi } from '../../../common/protocols';

/** Pieces shared by the note and snippet requests. */
export const KnowledgeJoi = {
  /** Tags as typed; the domain trims, lowercases and removes repeats. */
  tags() {
    return Joi.array()
      .items(Joi.string().allow('', null))
      .allow(null)
      .default([]);
  },

  /** Ids of linked projects or tasks. Absent or null means none. */
  ids() {
    return J.uuidList().allow(null);
  },
};
