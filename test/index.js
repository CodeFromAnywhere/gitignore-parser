var LIB = require('../lib'),
  fs = require('fs');

var FIXTURE = fs.readFileSync(__dirname + '/../.gitignore', 'utf8');
var NO_NEGATIVES_FIXTURE = fs.readFileSync(__dirname + '/./.gitignore-no-negatives', 'utf8');

describe('gitignore parser', function() {
  describe('parse()', function() {
    it('should parse some content', function() {
      var parsed = LIB.parse(FIXTURE);
      parsed.length.should.equal(2);
    });
  });

  describe('compile()', function() {
    beforeEach(function() {
      this.gitignore = LIB.compile(FIXTURE);
      this.gitignoreNoNegatives = LIB.compile(NO_NEGATIVES_FIXTURE);
    });

    describe('accepts()', function() {
      it('should accept the given filenames', function() {
        this.gitignore.accepts('test/index.js').should.be.true();
        this.gitignore.accepts('wat/test/index.js').should.be.true();
        this.gitignoreNoNegatives.accepts('test/index.js').should.be.true();
        this.gitignoreNoNegatives.accepts('node_modules.json').should.be.true();
      });

      it('should not accept the given filenames', function () {
        this.gitignore.accepts('test.swp').should.be.false();
        this.gitignore.accepts('foo/test.swp').should.be.false();
        this.gitignore.accepts('node_modules/wat.js').should.be.false();
        this.gitignore.accepts('foo/bar.wat').should.be.false();
        this.gitignoreNoNegatives.accepts('node_modules/wat.js').should.be.false();
      });

      it('should not accept the given directory', function() {
        this.gitignore.accepts('nonexistent').should.be.false();
        this.gitignore.accepts('nonexistent/bar').should.be.false();
        this.gitignoreNoNegatives.accepts('node_modules').should.be.false();
      });

      it('should accept unignored files in ignored directories', function() {
        this.gitignore.accepts('nonexistent/foo').should.be.true();
      });

      it('should accept nested unignored files in ignored directories', function() {
        this.gitignore.accepts('nonexistent/foo/wat').should.be.true();
      });
    });

    describe('denies()', function () {
      it('should deny the given filenames', function () {
        this.gitignore.denies('test.swp').should.be.true();
        this.gitignore.denies('foo/test.swp').should.be.true();
        this.gitignore.denies('node_modules/wat.js').should.be.true();
        this.gitignore.denies('foo/bar.wat').should.be.true();
        this.gitignoreNoNegatives.denies('node_modules/wat.js').should.be.true();
      });

      it('should not deny the given filenames', function() {
        this.gitignore.denies('test/index.js').should.be.false();
        this.gitignore.denies('wat/test/index.js').should.be.false();
        this.gitignoreNoNegatives.denies('test/index.js').should.be.false();
        this.gitignoreNoNegatives.denies('wat/test/index.js').should.be.false();
        this.gitignoreNoNegatives.denies('node_modules.json').should.be.false();
      });

      it('should deny the given directory', function() {
        this.gitignore.denies('nonexistent').should.be.true();
        this.gitignore.denies('nonexistent/bar').should.be.true();
        this.gitignoreNoNegatives.denies('node_modules').should.be.true();
        this.gitignoreNoNegatives.denies('node_modules/foo').should.be.true();
      });

      it('should not deny unignored files in ignored directories', function() {
        this.gitignore.denies('nonexistent/foo').should.be.false();
      });

      it('should not deny nested unignored files in ignored directories', function() {
        this.gitignore.denies('nonexistent/foo/wat').should.be.false();
      });
    });

    describe('maybe()', function() {
      it('should return true for directories not mentioned by .gitignore', function() {
        this.gitignore.maybe('lib').should.be.true();
        this.gitignore.maybe('lib/foo/bar').should.be.true();
        this.gitignoreNoNegatives.maybe('lib').should.be.true();
        this.gitignoreNoNegatives.maybe('lib/foo/bar').should.be.true();
      });

      it('should return false for directories explicitly mentioned by .gitignore', function() {
        this.gitignore.maybe('baz').should.be.false();
        this.gitignore.maybe('baz/wat/foo').should.be.false();
        this.gitignoreNoNegatives.maybe('node_modules').should.be.false();
      });

      it('should return true for ignored directories that have exceptions', function() {
        this.gitignore.maybe('nonexistent').should.be.true();
        this.gitignore.maybe('nonexistent/foo').should.be.true();
        this.gitignore.maybe('nonexistent/foo/bar').should.be.true();
      });

      it('should return false for non exceptions of ignored subdirectories', function() {
        this.gitignore.maybe('nonexistent/wat').should.be.false();
        this.gitignore.maybe('nonexistent/wat/foo').should.be.false();
        this.gitignoreNoNegatives.maybe('node_modules/wat/foo').should.be.false();
      });
    });
  });

  describe('Test case: a', function() {
    it('should only accept a/2/a', function() {
      const gitignore = LIB.compile(fs.readFileSync(__dirname + '/a/.gitignore', 'utf8'));
      gitignore.accepts('a/2/a').should.be.true();
      gitignore.accepts('a/3/a').should.be.false();
    });
  })
});
