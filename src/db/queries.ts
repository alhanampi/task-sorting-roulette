import { IPartnerRequest, ITask, IUser } from "../utils/interfaces";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export async function loadUserData(email: string): Promise<{
  user: IUser | null;
  tasks: ITask[];
  partner: IUser | null;
}> {
  return post("/load-user", { email });
}

export async function fetchUserByEmail(email: string): Promise<IUser | null> {
  const { user } = await post<{ user: IUser | null }>("/fetch-user", { email });
  return user;
}

export async function upsertUser(user: Omit<IUser, "password">): Promise<void> {
  await post("/upsert-user", { user });
}

export async function insertTask(task: ITask): Promise<void> {
  await post("/insert-task", { task });
}

export async function updateTaskInDb(
  task: Pick<ITask, "id" | "title" | "difficulty" | "completed">
): Promise<void> {
  await post("/update-task", { task });
}

export async function sendPartnerRequest(fromEmail: string, toEmail: string): Promise<void> {
  await post("/partner-request/send", { fromEmail, toEmail });
}

export async function fetchPendingRequests(email: string): Promise<IPartnerRequest[]> {
  const { requests } = await post<{ requests: IPartnerRequest[] }>("/partner-request/pending", { email });
  return requests;
}

export async function respondToPartnerRequest(
  id: string,
  response: "accepted" | "rejected"
): Promise<void> {
  await post("/partner-request/respond", { id, response });
}
