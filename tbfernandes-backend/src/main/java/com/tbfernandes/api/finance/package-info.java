/**
 * Finance: cash flow entries (personal and business), purchase goals and bank data imported
 * through open finance.
 * <p>
 * The bank provider sits behind the interface
 * {@link com.tbfernandes.api.finance.application.OpenFinanceGateway}. The Pluggy client
 * ({@code infrastructure.pluggy}) is off unless {@code tbf.pluggy.enabled=true} (RN-15).
 */
@ApplicationModule(displayName = "Finance")
package com.tbfernandes.api.finance;

import org.springframework.modulith.ApplicationModule;
