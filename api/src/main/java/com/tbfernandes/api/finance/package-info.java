/**
 * Finance: cash flow entries (personal and business), purchase goals and, later,
 * bank data imported through open finance.
 * <p>
 * The bank provider sits behind the output port
 * {@link com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway}. Pluggy is the planned
 * adapter ({@code adapter.out.pluggy}); it stays disabled until backlog epic FIN-OF is done.
 */
@ApplicationModule(displayName = "Finance")
package com.tbfernandes.api.finance;

import org.springframework.modulith.ApplicationModule;
