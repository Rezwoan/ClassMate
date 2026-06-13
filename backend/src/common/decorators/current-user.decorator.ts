import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Injects the authenticated user (set by JwtStrategy) into a handler param.
 * `@CurrentUser()` → full object, `@CurrentUser('userId')` → a single field.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
