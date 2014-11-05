'use strict';

var kit = require('../');
var chai = require('chai');
var should = chai.should();
var read = require('fs').readFileSync;

chai.config.includeStack = true;

var fixtureTest = function(name, inFile, outFile) {
    var actual = kit(inFile || (__dirname + '/fixtures/' + name + '.kit'));
    var expect = read(outFile || (__dirname + '/fixtures/results/' + name + '.html')).toString();
    actual.should.equal(expect);
}

var errorTest = function(name, inFile) {
    var err;
    try {
        kit(inFile || (__dirname + '/fixtures/' + name + '.kit'));
    }
    catch (e) { err = e; }
    should.exist(err);
}

describe('Kit', function () {

    it('should be a subset of HTML', function () {
        fixtureTest('subset');
    });

    it('should parse imports', function () {
        fixtureTest('imports');
    });

    it('should parse relative imports properly', function () {
        fixtureTest('imports', __dirname + '/fixtures/relative/importsRelative.kit');
    });

    it('should parse variables', function () {
        fixtureTest('variables');
    });

    it('should parse variables regardless of @ or $', function () {
        fixtureTest('mixed-vars');
    });

    it('should parse variables from parent in child files', function () {
        fixtureTest('variablesImport');
    });

    it('should parse multiline variables', function () {
        fixtureTest('multilineVariables');
    });

    it('should parse a string', function () {
        kit('<!-- $myVar: winning --><!--$myVar-->').should.equal('winning');
    });

    it('should render variables correctly into meta tags', function() {
        fixtureTest('page');
    });

    it('should render whitespace correctly (#11)', function() {
        fixtureTest('issue-11');
    });

    it('should throw an error for infinite loop', function () {
        errorTest('importsLoop');
    });

    it('should throw an error for undefined variables', function () {
        errorTest('variablesUndefined');
    });

    it('should throw an error for attempting to access variables set in child files', function () {
        errorTest('variablesScope');
    });

    it('should be able to access variables set in child files', function () {
        kit('test/fixtures/undeclaredVariableUse.kit')
            .should.equal(read(__dirname + '/fixtures/results/undeclaredVariableUse.html').toString())
    });

    it('should throw an error for missing import', function () {
        errorTest('importsMissing');
    });

});
