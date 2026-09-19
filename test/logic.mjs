/*
 * The pure helpers out of webadmin/web/plugin.js, so they can be tested without
 * a browser or a React runtime, and without resolving the bare `@oie/web-ui`
 * import the panel depends on.
 *
 * Copied rather than imported, the same arrangement the Backup / Git Sync /
 * Volume Monitor extensions use. The sender object in plugin.js is built inside
 * register(); ACK_CODE_PATTERN, validate() and the field `disabled` predicates
 * are lifted verbatim. defaults() takes defaultDestinationProperties as an
 * injected argument here because in plugin.js it is imported from @oie/web-ui;
 * the field-for-field default set is otherwise identical to the Java
 * NullDispatcherProperties constructor.
 */

const DISPATCHER_CLASS =
    'org.openintegrationengine.connectors.nullsender.NullDispatcherProperties';

/** Matches NullSenderPanel.checkProperties in the desktop Administrator. */
export const ACK_CODE_PATTERN = /^(A[ARE]|C[ARE])$/i;

export function defaults(version, defaultDestinationProperties = () => ({})) {
    return {
        '@class': DISPATCHER_CLASS,
        '@version': version,
        pluginProperties: null,
        destinationConnectorProperties: defaultDestinationProperties(version),
        ackMode: 'HL7_ACK',
        responseTemplate: '',
        ackCode: 'AA',
        ackTextMessage: '',
        logEachMessage: false,
    };
}

/**
 * A blank response template is deliberately allowed. Only the ACK code can be
 * wrong, and only when it is HL7_ACK and not itself a ${} template.
 */
export function validate(properties) {
    const errors = [];
    if (properties.ackMode === 'HL7_ACK') {
        const code = String(properties.ackCode || '').trim();
        if (!code.includes('${') && !ACK_CODE_PATTERN.test(code)) {
            errors.push('ACK Code must be AA, AE, AR, CA, CE or CR.');
        }
    }
    return errors;
}

// The field `disabled` predicates, lifted from the field specs.
export const ackCodeDisabled = (p) => p.ackMode !== 'HL7_ACK';
export const ackTextDisabled = (p) => p.ackMode !== 'HL7_ACK';
export const responseTemplateDisabled = (p) => p.ackMode !== 'TEMPLATE';
