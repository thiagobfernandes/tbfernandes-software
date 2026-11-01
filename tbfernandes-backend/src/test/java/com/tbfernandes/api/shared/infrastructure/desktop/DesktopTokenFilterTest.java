package com.tbfernandes.api.shared.infrastructure.desktop;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class DesktopTokenFilterTest {

	private static final String TOKEN = "0123456789abcdef0123456789abcdef";

	private final DesktopTokenFilter filter = new DesktopTokenFilter(TOKEN);

	@Test
	void letsTheAppThrough() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/companies");
		request.addHeader(DesktopTokenFilter.HEADER, TOKEN);
		MockFilterChain chain = new MockFilterChain();

		filter.doFilter(request, new MockHttpServletResponse(), chain);

		assertThat(chain.getRequest()).isNotNull();
	}

	@Test
	void refusesRequestsWithoutTheToken() throws Exception {
		for (String header : new String[] { null, "", "wrong", TOKEN + "x" }) {
			MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/companies");
			if (header != null) {
				request.addHeader(DesktopTokenFilter.HEADER, header);
			}
			MockHttpServletResponse response = new MockHttpServletResponse();
			MockFilterChain chain = new MockFilterChain();

			filter.doFilter(request, response, chain);

			assertThat(response.getStatus()).isEqualTo(401);
			assertThat(chain.getRequest()).isNull();
		}
	}

	@Test
	void letsCorsPreflightsThrough() throws Exception {
		MockFilterChain chain = new MockFilterChain();

		filter.doFilter(new MockHttpServletRequest("OPTIONS", "/api/v1/companies"), new MockHttpServletResponse(), chain);

		assertThat(chain.getRequest()).isNotNull();
	}

}
