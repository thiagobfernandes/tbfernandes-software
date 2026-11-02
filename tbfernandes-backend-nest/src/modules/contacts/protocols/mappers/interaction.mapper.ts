import { Interaction, InteractionDetails } from '../../domain';
import { ValidInteractionRequest } from '../interaction.request';
import { InteractionResponse } from '../interaction.response';

/** JSON ↔ Interaction. */
export const InteractionMapper = {
  toDetails(request: ValidInteractionRequest): InteractionDetails {
    return { ...request };
  },

  toResponse(interaction: Interaction): InteractionResponse {
    const d = interaction.details;
    return {
      id: interaction.id,
      contactId: d.contactId,
      date: d.date,
      kind: d.kind.toLowerCase(),
      summary: d.summary,
      followUpTaskId: d.followUpTaskId,
    };
  },
};
