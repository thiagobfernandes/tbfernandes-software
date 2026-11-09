import { RequestFields, Joi } from '../../../common/protocols';

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
    return RequestFields.uuidList().allow(null);
  },
};
