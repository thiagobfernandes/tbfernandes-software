package com.tbfernandes.api.work.protocols;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChecklistItemDto(UUID id, @NotBlank @Size(max = 200) String title, boolean done) {
}
