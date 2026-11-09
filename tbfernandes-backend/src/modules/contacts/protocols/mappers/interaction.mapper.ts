import { Interaction, InteractionDetails } from '../../domain';
import { ValidInteractionRequest } from '../interaction.request';
import { InteractionResponse } from '../interaction.response';

export const InteractionMapper = {
  toDetails(request: ValidInteractionRequest): InteractionDetails {
    return { ...request };
  },

  toResponse(interaction: Interaction): InteractionResponse {
    const details = interaction.details;
    return {
      id: interaction.id,
      contactId: details.contactId,
      date: details.date,
      kind: details.kind.toLowerCase(),
      summary: details.summary,
      followUpTaskId: details.followUpTaskId,
    };
  },
};
