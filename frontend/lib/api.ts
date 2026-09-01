const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

interface ApiError {
  error: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as ApiError).error || "Something went wrong");
  }
  return data as T;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface Bid {
  id: string;
  amount: number;
  bidderId: string;
  createdAt: string;
  bidder?: { id: string; name: string };
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startingPrice: number;
  minIncrement: number;
  currentPrice: number | null;
  endsAt: string;
  originalEndsAt: string;
  status: "ACTIVE" | "CLOSED" | "CANCELLED";
  seller?: { id: string; name: string };
  bids?: Bid[];
}

export function createListing(
  data: {
    title: string;
    description: string;
    imageUrl?: string;
    startingPrice: number;
    minIncrement: number;
    durationMinutes: number;
  },
  token: string
) {
  return request<{ listing: Listing }>("/api/listings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function listListings() {
  return request<{ listings: Listing[] }>("/api/listings");
}

export function getListing(id: string) {
  return request<{ listing: Listing }>(`/api/listings/${id}`);
}

export function placeBid(listingId: string, amount: number, token: string) {
  return request<{ bid: Bid; currentPrice: number; endsAt: string; wasExtended: boolean }>(
    `/api/listings/${listingId}/bids`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    }
  );
}

// --- Token storage ---
const TOKEN_KEY = "auctionhouse_token";

export function saveToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}
export function getToken(): string | null {
  if (typeof window !== "undefined") return localStorage.getItem(TOKEN_KEY);
  return null;
}
export function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { userId?: string };
    return payload.userId ?? null;
  } catch {
    return null;
  }
}
export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}
