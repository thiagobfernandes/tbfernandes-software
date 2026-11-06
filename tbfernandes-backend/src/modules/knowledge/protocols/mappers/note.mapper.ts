import { toInstant } from '../../../../common/protocols';
import { KnowledgeLinks, Note, NoteDetails } from '../../domain';
import { ValidNoteRequest } from '../note.request';
import { NoteResponse } from '../note.response';
import { LinksMapper, tagList } from './links.mapper';

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
    const details = note.details;
    return {
      id: note.id,
      title: details.title,
      body: details.body,
      tags: details.tags,
      projectIds: LinksMapper.sorted(note.links.projectIds),
      taskIds: LinksMapper.sorted(note.links.taskIds),
      createdAt: toInstant(note.createdAt),
      updatedAt: toInstant(note.updatedAt),
    };
  },
};
