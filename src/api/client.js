import { entities } from './local/entities';
import { integrations } from './local/integrations';
import { auth } from './local/auth';

// Local-only client. Same shape as the previous base44 SDK surface:
//   client.entities.<Name>.<method>
//   client.integrations.Core.<method>
//   client.auth.<method>
export const client = { entities, integrations, auth };
