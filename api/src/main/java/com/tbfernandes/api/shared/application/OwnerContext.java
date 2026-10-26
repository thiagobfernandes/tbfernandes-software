package com.tbfernandes.api.shared.application;

import java.util.UUID;

/**
 * Who owns the data of the current request. Every table has owner_id (RNF-SEG-03);
 * use cases always read and write within this owner.
 */
public interface OwnerContext {

	UUID currentOwnerId();

}
