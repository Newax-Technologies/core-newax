import { SetMetadata } from '@nestjs/common';
import type { HttpSecurityContextMode } from '@newax/http-security';

export const HTTP_CONTEXT_MODE_KEY = 'newax:http-security:context-mode';
export const HTTP_REQUIRED_PERMISSIONS_KEY =
  'newax:http-security:required-permissions';
export const HTTP_AUTHENTICATION_SENSITIVE_KEY =
  'newax:http-security:authentication-sensitive';

const PERMISSION_CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

export function PublicEndpoint(): MethodDecorator & ClassDecorator {
  return SetMetadata(
    HTTP_CONTEXT_MODE_KEY,
    'public' satisfies HttpSecurityContextMode,
  );
}

export function AccountContextEndpoint(): MethodDecorator & ClassDecorator {
  return SetMetadata(
    HTTP_CONTEXT_MODE_KEY,
    'account' satisfies HttpSecurityContextMode,
  );
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
  if (permissionCodes.length === 0) {
    throw new Error('RequirePermissions requires at least one permission code.');
  }

  const normalized = permissionCodes.map((permissionCode) => {
    if (
      permissionCode.length === 0 ||
      permissionCode.length > 160 ||
      permissionCode.trim() !== permissionCode ||
      !PERMISSION_CODE_PATTERN.test(permissionCode)
    ) {
      throw new Error(`Invalid HTTP permission code: ${permissionCode}`);
    }
    return permissionCode;
  });

  return SetMetadata(HTTP_REQUIRED_PERMISSIONS_KEY, [...new Set(normalized)]);
}

export function AuthenticationSensitiveEndpoint(): MethodDecorator & ClassDecorator {
  return SetMetadata(HTTP_AUTHENTICATION_SENSITIVE_KEY, true);
}
