import { toInstant } from '../../../../common/protocols';
import { KnowledgeLinks, Note, NoteDetails } from '../../domain';
import { ValidNoteRequest } from '../note.request';
import { NoteResponse } from '../note.response';
import { LinksMapper, tagList } from './links.mapper';

/** JSON ↔ Note. */
export const NoteMapper = {
  toDetails(request: ValidNoteRequest): NoteDetails {
    return {
      title: request.title,
      body: request.body ?? '',
      tags: tagList(request.tags),
    };
  },

  toLinks(request: ValidNoteRequest): KnowledgeLinks {
    return LinksMapper.toLinks(request);
  },

  toResponse(note: Note): NoteResponse {
    const d = note.details;
    return {
      id: note.id,
      title: d.title,
      body: d.body,
      tags: d.tags,
      projectIds: LinksMapper.sorted(note.links.projectIds),
      taskIds: LinksMapper.sorted(note.links.taskIds),
      createdAt: toInstant(note.createdAt),
      updatedAt: toInstant(note.updatedAt),
    };
  },
};
