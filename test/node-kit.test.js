'use strict';

var kit = require('../');
var chai = require('chai');
var should = chai.should();
var read = require('fs').readFileSync;

chai.config.includeStack = true;


describe('Kit', function () {

    it('should be a subset of HTML', function () {
        kit(__dirname + '/fixtures/subset.kit').should.equal(read(__dirname + '/fixtures/results/subset.html').toString());
    });

    it('should parse imports', function () {
        kit(__dirname + '/fixtures/imports.kit').should.equal(read(__dirname + '/fixtures/results/imports.html').toString());
    });

    it('should parse variables', function () {
        kit(__dirname + '/fixtures/variables.kit').should.equal(read(__dirname + '/fixtures/results/variables.html').toString());
    });

    it('should parse variables regardless of @ or $', function () {
        kit(__dirname + '/fixtures/mixed-vars.kit').should.equal(read(__dirname + '/fixtures/results/mixed-vars.html').toString());
    });

    it('should parse variables from parent in child files', function () {
        kit(__dirname + '/fixtures/variablesImport.kit').should.equal(read(__dirname + '/fixtures/results/variablesImport.html').toString());
    });

    it('should parse multiline variables', function () {
        kit(__dirname + '/fixtures/multilineVariables.kit').should.equal(read(__dirname + '/fixtures/results/multilineVariables.html').toString());
    });

    it('should parse a string', function () {
        kit('<!-- $myVar: winning --><!--$myVar-->').should.equal('winning');
    });

    it('should render variables correctly into meta tags', function() {
        kit(__dirname + '/fixtures/page.kit').should.equal(read(__dirname + '/fixtures/results/page.html').toString());
    });

    it('should throw an error for infinite loop', function () {
        var err;
        try {
            kit('test/fixtures/importsLoop.kit');
        }
        catch (e) { err = e; }
        should.exist(err);
    });

    it('should throw an error for undefined variables', function () {
        var err;
        try {
            kit('test/fixtures/variablesUndefined.kit');
        }
        catch (e) { err = e; }
        should.exist(err);
    });

    it('should throw an error for attempting to access variables set in child files', function () {
        var err;
        try {
            kit('test/fixtures/variablesScope.kit');
        }
        catch (e) { err = e; }
        should.exist(err);
    });

    it('should throw an error for missing import', function () {
        var err;
        try {
            kit('test/fixtures/importsMissing.kit');
        }
        catch (e) { err = e; }
        should.exist(err);
    });

});
