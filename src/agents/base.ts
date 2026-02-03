/**
 * Base Agent Class
 */

import { AgentConfig, AgentRole, Memo, Permission } from './types.js';

export abstract class BaseAgent {
  readonly role: AgentRole;
  readonly name: string;
  readonly personality: string;
  readonly permissions: Set<Permission>;
  
  protected memoCount = 0;

  constructor(config: AgentConfig) {
    this.role = config.role;
    this.name = config.name;
    this.personality = config.personality;
    this.permissions = new Set(config.permissions);
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions.has(permission);
  }

  protected createMemo(
    type: Memo['type'],
    subject: string,
    body: string,
    data?: Record<string, unknown>,
    conviction?: Memo['conviction']
  ): Memo {
    this.memoCount++;
    return {
      id: `${this.role.toUpperCase()}-${Date.now()}-${this.memoCount}`,
      timestamp: new Date(),
      author: this.role,
      type,
      subject,
      body,
      conviction,
      data,
    };
  }

  abstract think(context: unknown): Promise<Memo>;
}
