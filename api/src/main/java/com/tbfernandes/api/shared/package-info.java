/**
 * Shared kernel: identifiers, base errors, owner context and web plumbing used by every module.
 * Keep it small; business rules belong to the modules.
 */
@ApplicationModule(displayName = "Shared kernel", type = ApplicationModule.Type.OPEN)
package com.tbfernandes.api.shared;

import org.springframework.modulith.ApplicationModule;
