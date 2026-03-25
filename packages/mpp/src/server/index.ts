export type { AbstractChargeServerOptions } from './charge.js';
export { charge } from './charge.js';
export type { AbstractSessionServerOptions } from './session.js';
export { session } from './session.js';

import { charge } from './charge.js';
import { session } from './session.js';

/**
 * Convenience namespace — mirrors the `tempo` export pattern from mppx.
 *
 * @example
 * ```ts
 * import { Mppx } from 'mppx/server'
 * import { abstract } from '@abstract-foundation/mpp/server'
 *
 * const mppx = Mppx.create({
 *   methods: [abstract.charge({ ... }), abstract.session({ ... })],
 *   secretKey: process.env.MPP_SECRET_KEY!,
 * })
 * ```
 */
export const abstract = { charge, session };
