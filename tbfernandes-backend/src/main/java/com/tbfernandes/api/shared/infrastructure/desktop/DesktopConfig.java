package com.tbfernandes.api.shared.infrastructure.desktop;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;

/**
 * Profile desktop: the backend started by the Windows app (docs/desktop.md). It brings its own
 * PostgreSQL, accepts only requests carrying the launch token, and exits with the app.
 */
@Configuration(proxyBeanMethods = false)
@Profile("desktop")
class DesktopConfig {

	private static final Logger log = LoggerFactory.getLogger(DesktopConfig.class);

	@Bean(destroyMethod = "stop")
	EmbeddedPostgres embeddedPostgres(DesktopProperties properties) {
		properties.validate();
		return new EmbeddedPostgres(properties.postgresBin(), properties.dataDir()).start();
	}

	/** Replaces Spring Boot's DataSource: the URL is only known once PostgreSQL is up. */
	@Bean(destroyMethod = "close")
	HikariDataSource dataSource(EmbeddedPostgres postgres) {
		HikariConfig config = new HikariConfig();
		config.setJdbcUrl(postgres.jdbcUrl());
		config.setUsername(postgres.username());
		config.setPassword(postgres.password());
		config.setMaximumPoolSize(5);
		config.setPoolName("tbf-desktop");
		return new HikariDataSource(config);
	}

	/**
	 * After Spring Security (order -100), so CORS headers are already on a 401 and the
	 * frontend sees the status instead of a network error.
	 */
	@Bean
	FilterRegistrationBean<DesktopTokenFilter> desktopTokenFilter(DesktopProperties properties) {
		FilterRegistrationBean<DesktopTokenFilter> registration = new FilterRegistrationBean<>(
				new DesktopTokenFilter(properties.token()));
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1000);
		return registration;
	}

	/** Exits when the app's process is gone, even if it was killed without closing the backend. */
	@Bean(destroyMethod = "shutdownNow")
	ScheduledExecutorService parentWatcher(DesktopProperties properties, ConfigurableApplicationContext context) {
		ScheduledExecutorService watcher = Executors.newSingleThreadScheduledExecutor(Thread.ofPlatform()
			.name("tbf-parent-watcher")
			.daemon(true)
			.factory());
		if (properties.parentPid() == null) {
			return watcher;
		}
		watcher.scheduleWithFixedDelay(() -> {
			boolean alive = ProcessHandle.of(properties.parentPid()).map(ProcessHandle::isAlive).orElse(false);
			if (!alive) {
				log.info("The desktop app (pid {}) is gone; shutting down", properties.parentPid());
				exit(context);
			}
		}, 2, 2, TimeUnit.SECONDS);
		return watcher;
	}

	/** Closes the context (which stops PostgreSQL) off the calling thread, then ends the JVM. */
	static void exit(ConfigurableApplicationContext context) {
		Thread.ofPlatform().name("tbf-desktop-exit").start(() -> System.exit(SpringApplication.exit(context)));
	}

}
