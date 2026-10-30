/**
 * Finance: cash flow entries (personal and business), purchase goals and bank data imported
 * through open finance.
 * <p>
 * The bank provider sits behind the output port
 * {@link com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway}. The Pluggy adapter
 * ({@code adapter.out.pluggy}) is off unless {@code tbf.pluggy.enabled=true} (RN-15).
 */
@ApplicationModule(displayName = "Finance")
package com.tbfernandes.api.finance;

import org.springframework.modulith.ApplicationModule;
