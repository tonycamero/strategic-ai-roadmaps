import { AuthorityCategory, RoleToAuthorityMap } from "@roadmap/shared";

/**
 * UI-only authority resolver.
 * Backend is the source of truth; this is used for disabling/enabling buttons.
 *
 * Tries to read a JWT token from common storage keys and derive:
 * role -> AuthorityCategory via RoleToAuthorityMap.
 *
 * If anything is missing/invalid, returns AGENT (least privilege).
 */
export function useSuperAdminAuthority(): {
    role: string | null;
    authorityCategory: AuthorityCategory;
    category: AuthorityCategory;
    isExecutive: boolean;
    isDelegateOrHigher: boolean;
    isOperator: boolean;
    isSystem: boolean;
    isDelegate: boolean;
} {
    const token = readTokenFromStorage();

    const payload = token ? safeDecodeJwtPayload(token) : null;
    const role = (payload?.role as string | undefined) ?? null;

    const authorityCategory =
        role && (RoleToAuthorityMap as any)[role]
            ? (RoleToAuthorityMap as any)[role]
            : AuthorityCategory.AGENT;

    const isExecutive = authorityCategory === AuthorityCategory.EXECUTIVE;

    // hierarchy helper
    const rank: Record<string, number> = {
        [AuthorityCategory.EXECUTIVE]: 3,
        [AuthorityCategory.DELEGATE]: 2,
        [AuthorityCategory.OPERATOR]: 1,
        [AuthorityCategory.AGENT]: 0,
    };

    const isDelegateOrHigher = (rank[authorityCategory] ?? 0) >= rank[AuthorityCategory.DELEGATE];
    const isOperator = authorityCategory === AuthorityCategory.OPERATOR;
    const isSystem = authorityCategory === AuthorityCategory.AGENT;
    const isDelegate = rank[authorityCategory] >= rank[AuthorityCategory.DELEGATE];

    return {
        role,
        authorityCategory,
        category: authorityCategory,
        isExecutive,
        isDelegateOrHigher,
        isOperator,
        isSystem,
        isDelegate
    };
}

function readTokenFromStorage(): string | null {
    const keys = ["token", "access_token", "authToken", "roadmap_token"];
    for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v && v.length > 10) return v;
    }
    return null;
}

function safeDecodeJwtPayload(token: string): any | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}
