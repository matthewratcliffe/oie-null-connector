import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ACK_CODE_PATTERN, defaults, validate,
    ackCodeDisabled, ackTextDisabled, responseTemplateDisabled,
    failurePercentageDisabled, shouldFail,
} from './logic.mjs';

test('ACK_CODE_PATTERN accepts the six valid MSA-1 codes only', () => {
    for (const ok of ['AA', 'AE', 'AR', 'CA', 'CE', 'CR', 'aa', 'cr']) {
        assert.equal(ACK_CODE_PATTERN.test(ok), true, ok);
    }
    for (const bad of ['AX', 'ZZ', 'AAR', 'A', '', 'CC']) {
        assert.equal(ACK_CODE_PATTERN.test(bad), false, bad);
    }
});

test('defaults mirror the Java constructor field for field', () => {
    const d = defaults('4.6.0', (v) => ({ '@version': v, dest: true }));
    assert.equal(d['@class'],
        'org.openintegrationengine.connectors.nullsender.NullDispatcherProperties');
    assert.equal(d['@version'], '4.6.0');
    assert.equal(d.ackMode, 'HL7_ACK');
    assert.equal(d.ackCode, 'AA');
    assert.equal(d.responseTemplate, '');
    assert.equal(d.ackTextMessage, '');
    assert.equal(d.logEachMessage, false);
    assert.equal(d.failMessages, false);
    assert.equal(d.failurePercentage, 0);
    assert.equal(d.pluginProperties, null);
    assert.deepEqual(d.destinationConnectorProperties, { '@version': '4.6.0', dest: true });
});

test('validate flags only a wrong HL7 ACK code', () => {
    assert.deepEqual(validate({ ackMode: 'HL7_ACK', ackCode: 'AA' }), []);
    assert.equal(validate({ ackMode: 'HL7_ACK', ackCode: 'ZZ' }).length, 1);
    // A ${} template code bypasses the check.
    assert.deepEqual(validate({ ackMode: 'HL7_ACK', ackCode: '${msg.code}' }), []);
    // Trimmed and case-insensitive.
    assert.deepEqual(validate({ ackMode: 'HL7_ACK', ackCode: '  ae ' }), []);
    // Null coerces to '' which is invalid.
    assert.equal(validate({ ackMode: 'HL7_ACK', ackCode: null }).length, 1);
    // Non-HL7 modes are never validated, blank template allowed.
    assert.deepEqual(validate({ ackMode: 'TEMPLATE', responseTemplate: '' }), []);
    assert.deepEqual(validate({ ackMode: 'NONE' }), []);
});

test('field disabled predicates track ackMode', () => {
    assert.equal(ackCodeDisabled({ ackMode: 'HL7_ACK' }), false);
    assert.equal(ackCodeDisabled({ ackMode: 'TEMPLATE' }), true);
    assert.equal(ackCodeDisabled({}), true);
    assert.equal(ackTextDisabled({ ackMode: 'HL7_ACK' }), false);
    assert.equal(responseTemplateDisabled({ ackMode: 'TEMPLATE' }), false);
    assert.equal(responseTemplateDisabled({ ackMode: 'HL7_ACK' }), true);
    assert.equal(failurePercentageDisabled({ failMessages: false }), true);
    assert.equal(failurePercentageDisabled({ failMessages: true }), false);
});

test('failure simulation validates percentages and respects probability boundaries', () => {
    assert.deepEqual(validate({ ackMode: 'NONE', failMessages: true, failurePercentage: 25 }), []);
    assert.equal(validate({ ackMode: 'NONE', failMessages: true, failurePercentage: -1 }).length, 1);
    assert.equal(validate({ ackMode: 'NONE', failMessages: true, failurePercentage: 101 }).length, 1);
    assert.equal(validate({ ackMode: 'NONE', failMessages: true, failurePercentage: 12.5 }).length, 1);
    assert.deepEqual(validate({ ackMode: 'NONE', failMessages: false, failurePercentage: 999 }), []);

    assert.equal(shouldFail(false, 100, 0), false);
    assert.equal(shouldFail(true, 0, 0), false);
    assert.equal(shouldFail(true, 25, 24), true);
    assert.equal(shouldFail(true, 25, 25), false);
    assert.equal(shouldFail(true, 50, 49), true);
    assert.equal(shouldFail(true, 50, 50), false);
    assert.equal(shouldFail(true, 100, 99), true);
});
