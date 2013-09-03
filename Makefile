MOCHA_OPTS=
REPORTER=spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) $(MOCHA_OPTS)

watch:
	@$(MAKE) test MOCHA_OPTS="--watch $(MOCHA_OPTS)"

test-cov: lib-cov
	@TEST_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

clean:
	rm -fr lib-cov coverage.html

.PHONY: test test-cov clean
