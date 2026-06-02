import {
  permissionKeys,
  type MenuDefinition,
  type Permission,
  type UserRole,
} from "./types"

const allPermissions = [...permissionKeys]

export const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: allPermissions,
  ketua_pelaksana: [
    "dashboard.read",
    "users.read",
    "competitions.read",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "announcements.approve",
    "announcements.publish",
    "media.read",
    "committees.read",
    "committees.update",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.assign",
    "analytics.read",
    "reports.read",
    "event_operations.read",
    "event_operations.update",
    "audit.read",
    "notifications.read",
    "notifications.update",
    "notifications.send",
  ],
  wakil_ketua: [
    "dashboard.read",
    "users.read",
    "competitions.read",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "announcements.approve",
    "announcements.publish",
    "media.read",
    "committees.read",
    "committees.update",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.assign",
    "analytics.read",
    "reports.read",
    "event_operations.read",
    "event_operations.update",
    "audit.read",
    "notifications.read",
    "notifications.update",
    "notifications.send",
  ],
  pj_lomba: [
    "dashboard.read",
    "competitions.read",
    "competitions.update",
    "competitions.status.update",
    "scores.update",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "media.read",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "notifications.read",
    "notifications.update",
  ],
  humas: [
    "dashboard.read",
    "schedules.read",
    "announcements.read",
    "announcements.create",
    "announcements.update",
    "announcements.publish",
    "media.read",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "notifications.read",
    "notifications.update",
    "notifications.send",
  ],
  dokumentasi: [
    "dashboard.read",
    "schedules.read",
    "announcements.read",
    "media.read",
    "media.upload",
    "media.update",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "notifications.read",
    "notifications.update",
  ],
  panitia: [
    "dashboard.read",
    "schedules.read",
    "announcements.read",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "notifications.read",
    "notifications.update",
  ],
}

export const menuDefinitions: MenuDefinition[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", requiredPermission: "dashboard.read" },
  { key: "users", label: "Users", href: "/dashboard/users", requiredPermission: "users.read" },
  { key: "competitions", label: "Competitions", href: "/dashboard/tournament", requiredPermission: "competitions.read" },
  { key: "schedules", label: "Schedules", href: "/dashboard/schedules", requiredPermission: "schedules.read" },
  { key: "announcements", label: "Announcements", href: "/dashboard/announcements", requiredPermission: "announcements.read" },
  { key: "media", label: "Media Center", href: "/dashboard/media", requiredPermission: "media.read" },
  { key: "committees", label: "Committee", href: "/dashboard/panitia", requiredPermission: "committees.read" },
  { key: "tasks", label: "Tasks", href: "/dashboard/tasks", requiredPermission: "tasks.read" },
  { key: "analytics", label: "Analytics", href: "/dashboard/analytics", requiredPermission: "analytics.read" },
  { key: "audit", label: "Audit Log", href: "/dashboard/audit", requiredPermission: "audit.read" },
  { key: "settings", label: "Settings", href: "/dashboard/settings", requiredPermission: "permissions.manage" },
]

export function getRolePermissions(role: UserRole) {
  return rolePermissions[role] ?? []
}

export function can(role: UserRole, permission: Permission) {
  return getRolePermissions(role).includes(permission)
}

export function getAllowedMenus(role: UserRole) {
  return menuDefinitions.map((menu) => ({
    ...menu,
    allowed: can(role, menu.requiredPermission),
  }))
}
