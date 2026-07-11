import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { HttpSecurityContextMode } from '@newax/http-security';

export const HTTP_CONTEXT_MODE_KEY = 'newax:http-security:context-mode';
export const HTTP_REQUIRED_PERMISSIONS_KEY =
  'newax:http-security:required-permissions';
export const HTTP_AUTHENTICATION_SENSITIVE_KEY =
  'newax:http-security:authentication-sensitive';

export function PublicEndpoint(): MethodDecorator & ClassDecorator {
  return SetMetadata(HTTP_CONTEXT_MODE_KEY, 'public' satisfies HttpSecurityContextMode);
}

export function AccountContextEndpoint(): MethodDecorator & ClassDecorator {
  return SetMetadata(HTTP_CONTEXT_MODE_KEY, 'account' satisfies HttpSecurityContextMode);
}

export function OrganizationContextEndpoint(): MethodDecorator & ClassDecorator {
  return SetMetadata(
    HTTP_CONTEXT_MODE_KEY,
    'organization' satisfies HttpSecurityContextMode,
  );
}

export function RequirePermissions(
  ...permissionCodes: readonly string[]
): MethodDecorator & ClassDecorator {
  return SetMetadata(HTTP_REQUIRED_PERMISSIONS_KEY, [...permissionCodes]);
}

export function AuthenticationSensitiveEndpoint(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(HTTP_AUTHENTICATION_SENSITIVE_KEY, true),
  );
}
