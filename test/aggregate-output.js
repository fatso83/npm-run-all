
/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("power-assert")
const parallel = require("mocha.parallel")
const nodeApi = require("../lib")
const BufferStream = require("./lib/buffer-stream")
const util = require("./lib/util")
const runAll = util.runAll
const runPar = util.runPar
const runSeq = util.runSeq

//------------------------------------------------------------------------------
// Test
//------------------------------------------------------------------------------

describe("[aggregated-output] npm-run-all", () => {
    before(() => process.chdir("test-workspace"))
    after(() => process.chdir(".."))

    /**
     * create expected text
     * @param {string} term  the term to use when creating a line
     * @returns {string} the complete line
     */
    function createExpectedOutput(term) {
        return `[${term}]__[${term}]`
    }


    parallel("should not intermingle output of various commands", () => {
        const EXPECTED_SERIALIZED_TEXT = [
            createExpectedOutput("first"),
            createExpectedOutput("second"),
            `${createExpectedOutput("third")}\n`,
        ].join("\n")

        const EXPECTED_PARALLELIZED_TEXT = [
            createExpectedOutput("second"),
            createExpectedOutput("third"),
            `${createExpectedOutput("first")}\n`,
        ].join("\n")

        it("Node API", () => {
            const stdout = new BufferStream()

            return nodeApi(
                    ["test-task:delayed first 300", "test-task:delayed second 100", "test-task:delayed third 200"],
                    {stdout, silent: true, aggregateOutput: true}
                )
                .then(() => {
                    assert.equal(stdout.value, EXPECTED_SERIALIZED_TEXT)
                })
        })

        it("npm-run-all command", () => {
            const stdout = new BufferStream()

            runAll(
                    ["test-task:delayed first 300", "test-task:delayed second 100", "test-task:delayed third 200", "--silent", "--aggregateOutput"],
                    stdout
                )
                .then(() => {
                    assert.equal(stdout.value, EXPECTED_SERIALIZED_TEXT)
                })
        })

        it("run-s command", () => {
            const stdout = new BufferStream()

            runSeq(
                    ["test-task:delayed first 300", "test-task:delayed second 100", "test-task:delayed third 200", "--silent", "--aggregateOutput"],
                    stdout
                )
                .then(() => {
                    assert.equal(stdout.value, EXPECTED_SERIALIZED_TEXT)
                })
        })

        it("run-p command", () => {
            const stdout = new BufferStream()

            return runPar([
                "test-task:delayed first 300",
                "test-task:delayed second 100",
                "test-task:delayed third 200",
                "--silent", "--aggregateOutput"],
                    stdout
                )
                .then(() => {
                    assert.equal(stdout.value, EXPECTED_PARALLELIZED_TEXT)
                })
        })
    })
})

