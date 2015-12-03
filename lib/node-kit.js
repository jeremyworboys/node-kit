'use strict';

var format = require('util').format;
var path = require('path');
var fs = require('fs');


// Expose `kit`
exports = module.exports = kit;

// Expose `Kit` class
exports.Kit = Kit;


/**
 * Create a kit object from a string or a filename
 * @param  {String} str
 * @return {Kit}
 */
function kit(str) {
    return new Kit(str).toString();
}


/**
 * Create a new Kit object
 * @param {String} str
 * @param {Object} variables
 * @param {Array} forbiddenPaths
 */
function Kit(str, variables, forbiddenPaths) {
    this._variables = variables || {};
    this._forbiddenPaths = forbiddenPaths || [];

    // Import file
    if (fs.existsSync(str)) {
        this.fileContents = fs.readFileSync(str).toString();
        this.filename = path.basename(str);
        this._fileDir = path.dirname(str);

        if (this._forbiddenPaths.indexOf(str) !== -1) {
            throw new Error('Error: infinite import loop detected. (e.g. File A imports File B, which imports File A.) You must fix this before the file can be compiled.');
        }
        this._forbiddenPaths.push(str);
    }

    // Anonymous string
    else {
        this.fileContents = str.toString();
        this.filename = '<anonymous>';
        this._fileDir = '';
    }
}


/**
 * Break up the string to parse-able tokens
 * @return {Kit}
 */
Kit.prototype.tokenize = function() {
    if (this.tokens) {
        return this;
    }

    this.tokens = [];
    this._lineNumber = 1;
    this._currentToken = '';

    // Break on SPACE, TAB, NEWLINE or between ><
    this._source = this.fileContents.split(/([ \t\r\n]|>(?=[<]))/g);

    if (!this._source.length) {
        throw new Error(format('Failed to tokenize %s. (Is the file UTF-8 encoded? Ensure it is not malformed.)', this.filename));
    }

    for (this._pos = 0; this._pos < this._source.length; this._pos++) {
        this._parseToken(this._source, this._pos);
    }
    this._pushToken();

    // Clean up
    delete this._pos;
    delete this._source;
    delete this._lineNumber;
    delete this._currentToken;

    return this;
};


/**
 * Iterate tokens compiling them into an output string
 * @return {Kit}
 */
Kit.prototype.compile = function() {
    if (this.compiled) {
        return this;
    }

    this.compiled = '';
    this._discardNewline = false;

    for (var i = 0, token; i < this.tokens.length; i++) {
        token = this.tokens[i];

        if (!token.isSpecial) {
            if (this._discardNewline) {
                this._discardNewline = false;
                this.compiled += token.str.replace(/^\n/, '');
            } else {
                this.compiled += token.str;
            }
            continue;
        }

        this._compileToken(token);
    }

    return this;
};


/**
 * Tokenize, Compile and return result
 * @return {String}
 */
Kit.prototype.toString = function() {
    return this.tokenize().compile().compiled;
};


/**
 * Create a token from a string
 * @param  {String} token
 */
Kit.prototype._parseToken = function(tokens, index) {
    var token = tokens[index];
    // Discard empty tokens
    if (!token.length) {
        return;
    }

    // Test token to see if it starts a comment
    var commentStart = token.indexOf('<!--');
    if (commentStart === -1) {
        this._currentToken += token;

        if (token.slice(-1) === '\n') {
            this._lineNumber += 1;
        }

        return;
    }

    // This token contains the start of a comment, but doesn't qualify as special yet
    var isSpecial = false;
    var i, nextToken;

    // First, if the location is NOT zero, then the user did something like "texthere<!-- comment -->"
    // So we need to pull everything ahead of the comment start delimiter and throw it into the previous token
    if (commentStart) {
        this._currentToken += token.slice(0, commentStart);
        token = token.slice(commentStart);
    }

    // Test comments with no spaces: <!--@import someFile.html-->, <!--$someVar value-->, <!--$someVar=value-->
    // Special comments must have at least 6 characters: the comment start delimiter, the key symbol (@ or $) and an alphabetic character after that
    if (token.length > 6) {
        isSpecial = !!token.slice(4, 6).match(/^[$@][a-z]$/i);
    }

    // Test comments WITH spaces: <!-- @import someFile.html -->, <!-- $someVar = value-->, etc.
    // Look at the first character in the NEXT token that doesn't start with whitespace to overcome comments like this: <!--    $var=value -->
    else {
        for (i = this._pos + 1; i < this._source.length; i++) {
            nextToken = this._source[i];

            if (nextToken.length > 1) {
                if (nextToken[0].match(/[ \t]/)) continue;
                if (nextToken[0].match(/[$@]/)) {
                    isSpecial = !!nextToken[1].match(/[a-z]/i);
                }
                break;
            }
        }
    }

    if (!isSpecial) {
        this._currentToken += token;

        if (token.slice(-1) === '\n') {
            this._lineNumber += 1;
        }

        return;
    }

    // We've got a special comment. Push the last token onto the stack and start building this one
    this._pushToken();

    // String together all the tokens from the current one to the next token that contains the "-->" substring
    var commentEnd;
    for (i = this._pos; i < this._source.length; i++) {
        token = this._source[i];
        this._currentToken += token;

        commentEnd = this._currentToken.indexOf('-->');
        if (commentEnd === -1) {
            if (token.slice(-1) === '\n') {
                this._lineNumber += 1;
            }

            continue;
        }

        // By this point, we have the entirety of the special comment

        // Stash anything after the closing comment as we're about to wipe it
        nextToken = this._currentToken.slice(commentEnd + 3);
        this._currentToken = this._currentToken.slice(0, commentEnd + 3);

        // Strip everything surrounding the content of the special token, then push it
        this._currentToken = this._currentToken.replace(/^.*<!--\s*|\s*-->.*$/g, '');
        this._pushToken(true);
        this._pos = i;

        // If we stashed content from after the special token we need to push it onto the start of the next one
        if (nextToken.length) {
            tokens.splice(i + 1, 0, nextToken);
        }

        break;
    }

    if (!this.tokens.slice(-1)) {
        throw new Error(format('Line %d of %s: Found a Kit comment, but could not parse it into a full string. (Ensure that the file is UTF-8 encoded and not damaged.)', this._lineNumber, this.filename));
    }
};


/**
 * Pushes the current token onto the stack
 * @param  {Boolean} isSpecial
 */
Kit.prototype._pushToken = function(isSpecial) {
    this.tokens.push({
        str: this._currentToken,
        isSpecial: !!isSpecial,
        filename: this.filename,
        lineNumber: this._lineNumber
    });

    this._currentToken = '';
};


/**
 * Compile a token
 * @param  {Object} token
 */
Kit.prototype._compileToken = function(token) {
    var tokenString = token.str;
    var filename = token.filename;
    var lineNumber = token.lineNumber;

    // First, get the keyword. (Either @import or a variable name)
    // (And handle variables with multi-line content properly —
    // e.g., HTML content that has been formatted over multiple lines.)
    var parts = tokenString.match(/([$@][^\s=:]+)(?:\s*[=:]?\s*((.|[\r\n])+))?/);
    var keyword = parts[1];
    var predicate = parts[2];

    // No keyword, which is a massive error at this point
    if (!keyword) {
        throw new Error(format('Line %d of %s: Unable to find an appropriate keyword (either "@import" or a variable name) in this Kit comment: %s', lineNumber, filename, tokenString));
    }

    // Now that we've got a keyword and predicate (maybe), do something with them

    // Do we have an import statement?
    if (keyword.match(/(@import|@include)/i)) {
        if (!predicate) {
            throw new Error(format('Line %d of %s: Missing a filepath after the import/include keyword in this Kit comment: %s', lineNumber, filename, tokenString));
        }

        // We allow comma-separated import lists: <!-- @import someFile.kit, otherFile.html -->
        var imports = predicate.split(',');

        // Give access to the current token for displaying helpful errors
        this._currentToken = token;

        for (var i = 0; i < imports.length; i++) {
            this.compiled += this._handleImport(imports[i]);
            this._discardNewline = true;
        }

        // Cleanup
        delete this._currentToken;
    }

    // If we've got a predicate, we're assigning a value to this variable
    else if (predicate) {
        var varName = keyword.substring(0);
        this._variables[varName] = predicate;
        this._discardNewline = true;
    }

    // We are accessing a variable
    else {
        var varName = keyword.substring(0);
        var value = this._variables[varName];
        this._discardNewline = true;

        if (!value) {
            throw new Error(format('Line %d of %s: The variable %s is undefined.', lineNumber, filename, keyword));
        }

        this.compiled += (value !== 'nil' ? value : '');
    }
};


/**
 * Import and recursively compile files
 * @param  {String} filePath
 */
Kit.prototype._handleImport = function(filePath) {
    filePath = filePath.replace(/^\s|\s$/g, '');
    filePath = this._findFile(filePath);

    // If this is a non-Kit file, so just throw its text into place
    if (path.extname(filePath) !== '.kit') {
        return fs.readFileSync(filePath).toString();
    }

    // Clone properties
    var forbiddenPaths = this._forbiddenPaths.slice();

    // Recurse and compile
    return new Kit(filePath, this._variables, forbiddenPaths).toString();
};


/**
 * Locate the path to the file to import
 * @param  {String} filePath
 * @return {String}
 */
Kit.prototype._findFile = function(filePath) {
    var lookupPaths = [];

    // Normalize filename
    filePath = filePath.replace(/^\s*['"]\s*|\s*['"]\s*$/g, '');

    // The file extension is optional. Add it if missing.
    if (!path.extname(filePath)) {
        filePath += '.kit';
    }

    // Allow for an optional leading underscore. We'll test the actual filename specified in the @import statement first,
    // but if that isn't valid, then we add or remove the leading underscore and test THAT filename.
    var filename = path.basename(filePath);
    var altFilePath = (filename[0] === '_') ? filename.slice(1) : ('_' + filename);

    // Make sure we add back any relative addressing that may have originally existed.
    altFilePath = filePath.replace(filename, altFilePath);

    // Allow for relative paths.
    filePath = path.resolve(this._fileDir + '/' + filePath);
    altFilePath = path.resolve(this._fileDir + '/' + altFilePath);

    lookupPaths.push(filePath);
    lookupPaths.push(path.join(this._fileDir, filePath));
    lookupPaths.push(altFilePath);
    lookupPaths.push(path.join(this._fileDir, altFilePath));

    for (var i = 0; i < lookupPaths.length; i++) {
        if (fs.existsSync(lookupPaths[i])) {
            return lookupPaths[i];
        }
    }

    throw new Error(format('Line %d in %s: You\'re attempting to import a file that does not exist in the specified location: %s', this._currentToken.lineNumber, this._currentToken.filename, filePath));
};



/**
 * Quick shallow clone
 * @param  {Object} obj
 * @return {Object}
 */
function clone(obj) {
    var ret = {};
    Object.keys(obj).forEach(function (val) {
        ret[val] = obj[val];
    });
    return ret;
}
