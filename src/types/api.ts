export type Role = 'ADMIN' | 'PLANNER' | 'VIEWER';

export type ActivityStatus = 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// Usuario autenticado (lo que devuelve /auth/me y /auth/login)
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

// Usuario completo (lo que devuelve /users con todos los campos)
export interface User extends AuthUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  description: string | null;
  reference: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  reference: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  activityDate: string;
  timeDefined: boolean;
  startTime: string | null;
  status: ActivityStatus;
  observations: string | null;
  placeId: string;
  organizationId: string;
  neighborhoodId: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  place: Pick<Place, 'id' | 'name' | 'address'>;
  organization: Pick<Organization, 'id' | 'name'>;
  neighborhood: Pick<Neighborhood, 'id' | 'name'>;
  creator: Pick<AuthUser, 'id' | 'email' | 'fullName'>;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Conflict {
  level: 'HIGH' | 'WARNING';
  reason: string;
  activityId: string;
  activityName: string;
}

export interface CalendarResponse {
  dateFrom: string;
  dateTo: string;
  total: number;
  scheduled: Activity[];
  unscheduled: Activity[];
}

export interface DashboardSummary {
  activities: {
    total: number;
    planned: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    withTime: number;
    withoutTime: number;
  };
  catalogs: {
    organizations: number;
    neighborhoods: number;
    places: number;
  };
}

export interface DashboardCharts {
  byMonth: number[];
  byStatus: { status: ActivityStatus; count: number }[];
  byTimeDefined: { label: string; count: number }[];
  byOrganization: { id: string; name: string; count: number }[];
  byNeighborhood: { id: string; name: string; count: number }[];
  byPlace: { id: string; name: string; count: number }[];
}