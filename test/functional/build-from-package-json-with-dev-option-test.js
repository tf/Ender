/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , functionalCommon = require('./common')

  testCase('Functional: build from package.json with --dev option', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'
      refute.match.message = '${2}'
    }

    /**
     *  ┬ .
     *  ├── bean
     *  └── sinon (dev)
     */
  , '`ender build . --dev with simple dev dependency`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build . --dev'
        , {
              fixtureFiles: {
                  'package.json': functionalCommon.fixturePackageJSON({
                      name: 'test-package'
                    , main: 'main.js'
                    , dependencies: [ 'bean@0.3.0' ]
                    , devDependencies: [ 'sinon@1.3.4' ]
                  })
                , 'main.js': '// Main file'
              }
            , expectedFiles: files
          }
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

          assert.stdoutRefersToNPMPackages(stdout, 'ender-js . sinon@1.3.4')
            assert.stdoutReportsBuildCommand(stdout, 'ender build . --dev')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')
            assert.hasVersionedPackage(stdout, 'sinon', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build . --dev$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceContainsProvideStatements(contents, 3, files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.hasVersionedPackage(contents, 'test-package', files[i])
              assert.hasVersionedPackage(contents, 'sinon', files[i])
              assert.sourceHasProvide(contents, 'bean', files[i])
              assert.sourceHasProvide(contents, 'test-package', files[i])
              assert.sourceHasProvide(contents, 'sinon', files[i])

              // Make sure dev dependencies are places at the very end
              assert.sourceHasProvidesInOrder(contents, 'bean', 'test-package', files[i])
              assert.sourceHasProvidesInOrder(contents, 'bean', 'sinon', files[i])
              assert.sourceHasProvidesInOrder(contents, 'test-package', 'sinon', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-js bean sinon'.split(' ')
              , callback.bind(null, done)
            )
        })
    }

    /**
     *  ┬ .
     *  ├── bean
     *  └─┬ sinon-chai (dev)
     *    └── sinon
     */
  , '`ender build . --dev with dev dependency that has further dependency`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build . --dev'
        , {
              fixtureFiles: {
                  'package.json': functionalCommon.fixturePackageJSON({
                      name: 'test-package'
                    , main: 'main.js'
                    , dependencies: [ 'bean@0.3.0' ]
                    , devDependencies: [ 'sinon-chai@1.3.1' ]
                  })
                , 'main.js': '// Main file'
              }
            , expectedFiles: files
          }
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-js . sinon-chai@1.3.1')
            assert.stdoutReportsBuildCommand(stdout, 'ender build . --dev')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')
            assert.hasVersionedPackage(stdout, 'sinon-chai', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build . --dev$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceContainsProvideStatements(contents, 4, files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.hasVersionedPackage(contents, 'test-package', files[i])
              assert.hasVersionedPackage(contents, 'sinon-chai', files[i])
              assert.hasVersionedPackage(contents, 'sinon', files[i])
              assert.sourceHasProvide(contents, 'bean', files[i])
              assert.sourceHasProvide(contents, 'test-package', files[i])
              assert.sourceHasProvide(contents, 'sinon-chai', files[i])
              assert.sourceHasProvide(contents, 'sinon', files[i])

              // Make sure dev dependencies are places at the very end
              assert.sourceHasProvidesInOrder(contents, 'bean', 'test-package', files[i])
              assert.sourceHasProvidesInOrder(contents, 'test-package', 'sinon', files[i])
              assert.sourceHasProvidesInOrder(contents, 'sinon', 'sinon-chai', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-js bean sinon-chai'.split(' ')
              , callback.bind(null, done)
            )
        })
    }

    /**
     *  ┬ .
     *  ├── sinon
     *  └─┬ sinon-chai (dev)
     *    └── sinon
     *
     * Sinon as a normal dependency might be a contrived example. But
     * imagine it was underscore etc.
     */
  , '`ender build . --dev with dev dependency whose dependencies overlap with normal dependencies of package`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build . --dev'
        , {
              fixtureFiles: {
                  'package.json': functionalCommon.fixturePackageJSON({
                      name: 'test-package'
                    , main: 'main.js'
                    , dependencies: [ 'sinon@1.3.4' ]
                    , devDependencies: [ 'sinon-chai@1.3.1' ]
                  })
                , 'main.js': '// Main file'
              }
            , expectedFiles: files
          }
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-js . sinon-chai@1.3.1')
            assert.stdoutReportsBuildCommand(stdout, 'ender build . --dev')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'sinon', 'stdout')
            assert.hasVersionedPackage(stdout, 'sinon-chai', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build . --dev$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceContainsProvideStatements(contents, 3, files[i])
              assert.hasVersionedPackage(contents, 'sinon', files[i])
              assert.hasVersionedPackage(contents, 'test-package', files[i])
              assert.hasVersionedPackage(contents, 'sinon-chai', files[i])
              assert.sourceHasProvide(contents, 'sinon', files[i])
              assert.sourceHasProvide(contents, 'test-package', files[i])
              assert.sourceHasProvide(contents, 'sinon-chai', files[i])

              // As sinon is now a normal dependecy it should appear before test-package
              assert.sourceHasProvidesInOrder(contents, 'sinon', 'test-package', files[i])
              assert.sourceHasProvidesInOrder(contents, 'test-package', 'sinon-chai', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-js sinon sinon-chai'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})