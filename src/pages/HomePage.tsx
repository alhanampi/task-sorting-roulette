import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addUser,
  setUsers,
  setTasks,
  updateUser,
  updateTask,
  addTask,
  setPendingRequests,
  removePendingRequest,
} from "../store/slices/appSlice";
import {
  fetchPendingRequests,
  insertTask,
  loadUserData,
  respondToPartnerRequest,
  updateTaskInDb,
  upsertUser,
} from "../db/queries";
import AppHeader from "../components/AppHeader/AppHeader";
import StatsBar from "../components/StatsBar/StatsBar";
import SpinWheelSection from "../components/SpinWheelSection/SpinWheelSection";
import PartnerSection from "../components/PartnerSection/PartnerSection";
import ActiveTaskSection from "../components/ActiveTaskSection/ActiveTaskSection";
import CreateTaskForm from "../components/CreateTaskForm/CreateTaskForm";
import TaskListSection from "../components/TaskListSection/TaskListSection";
import { IPartnerRequest, ITask, IUser, IWheelTask } from "../utils/interfaces";
import { Language } from "../utils/types";

const LANG_KEY = "task-sorter-language";
const GUEST_TASKS_KEY = "task-sorter-guest-tasks";
const GUEST_OWNER = "guest";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_TASKS: ITask[] = [
  { id: "seed-1", title: "Limpiar el escritorio", difficulty: 1, ownerEmail: GUEST_OWNER, completed: false, createdAt: Date.now() - 5 * 60000 },
  { id: "seed-2", title: "Responder correos pendientes", difficulty: 2, ownerEmail: GUEST_OWNER, completed: false, createdAt: Date.now() - 4 * 60000 },
  { id: "seed-3", title: "Preparar presentación del proyecto", difficulty: 4, ownerEmail: GUEST_OWNER, completed: false, createdAt: Date.now() - 3 * 60000 },
  { id: "seed-4", title: "Hacer ejercicio 30 minutos", difficulty: 3, ownerEmail: GUEST_OWNER, completed: false, createdAt: Date.now() - 2 * 60000 },
  { id: "seed-5", title: "Revisar lista de compras", difficulty: 1, ownerEmail: GUEST_OWNER, completed: true, createdAt: Date.now() - 60000 },
];

function loadGuestTasks(): ITask[] {
  try {
    const raw = localStorage.getItem(GUEST_TASKS_KEY);
    if (raw) return JSON.parse(raw) as ITask[];
  } catch {}
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(SEED_TASKS));
  return SEED_TASKS;
}

function saveGuestTasks(tasks: ITask[]) {
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { users, tasks, pendingRequests } = useAppSelector((state) => state.app);

  const [language, setLanguage] = useState<Language>("es");
  const [taskTitle, setTaskTitle] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const [soloMode, setSoloMode] = useState(false);
  const [respondingRequest, setRespondingRequest] = useState<IPartnerRequest | null>(null);
  const [guestAssignedTaskId, setGuestAssignedTaskId] = useState<string | undefined>(undefined);

  const { t, i18n } = useTranslation();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, openSignIn, openSignUp } = useClerk();

  const authEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  // ── Language preference (localStorage is fine for this) ──────────────────

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "es" || saved === "pt") {
      setLanguage(saved);
      i18n.changeLanguage(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem(LANG_KEY, language);
  }, [language, i18n]);

  // ── Guest tasks: load before first paint so TaskWheel gets segments immediately
  useLayoutEffect(() => {
    if (isLoaded && !isSignedIn) {
      dispatch(setTasks(loadGuestTasks()));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  // ── Load from Neon on sign-in; reset Redux on sign-out ───────────────────

  useEffect(() => {
    if (!isSignedIn) {
      dispatch(setUsers([]));
      return;
    }
    if (!authEmail) return;

    loadUserData(authEmail)
      .then(({ user: dbUser, tasks: dbTasks, partner: dbPartner }) => {
        if (dbUser) {
          dispatch(setUsers([dbUser, ...(dbPartner ? [dbPartner] : [])]));
        } else {
          const newUser: IUser = {
            username:
              user?.fullName || user?.firstName || authEmail.split("@")[0],
            email: authEmail,
            password: "clerk-auth",
            points: 0,
          };
          const { password: _, ...forDb } = newUser;
          upsertUser(forDb).then(() => dispatch(addUser(newUser)));
        }
        if (dbTasks.length > 0) dispatch(setTasks(dbTasks));
      })
      .catch(() => setMessage(t("loadError")));
  }, [isSignedIn, authEmail, dispatch, user]);

  // ── Load pending partner requests ─────────────────────────────────────────

  useEffect(() => {
    if (!authEmail) return;
    fetchPendingRequests(authEmail)
      .then((reqs) => {
        dispatch(setPendingRequests(reqs));
        if (reqs.length > 0) setRespondingRequest(reqs[0]);
      })
      .catch(() => {});
  }, [authEmail, dispatch]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentUser = useMemo(
    () => (authEmail ? (users.find((u) => u.email === authEmail) ?? null) : null),
    [users, authEmail]
  );
  const partner = useMemo(
    () =>
      currentUser?.partnerEmail
        ? (users.find((u) => u.email === currentUser.partnerEmail) ?? null)
        : null,
    [currentUser, users]
  );
  const myTasks = useMemo(
    () => authEmail
      ? tasks.filter((t) => t.ownerEmail === authEmail)
      : tasks.filter((t) => t.ownerEmail === GUEST_OWNER),
    [tasks, authEmail]
  );
  const assignedTask = useMemo(() => {
    if (currentUser?.assignedTaskId)
      return tasks.find((t) => t.id === currentUser.assignedTaskId) ?? null;
    if (!currentUser && guestAssignedTaskId)
      return tasks.find((t) => t.id === guestAssignedTaskId) ?? null;
    return null;
  }, [currentUser, guestAssignedTaskId, tasks]);
  const incompleteTasks = useMemo(
    () => myTasks.filter((t) => !t.completed),
    [myTasks]
  );
  const completedTasks = useMemo(
    () => myTasks.filter((t) => t.completed),
    [myTasks]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  function dbUser(u: IUser) {
    const { password: _, ...rest } = u;
    return rest;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTaskCreate = async () => {
    if (!taskTitle.trim()) { setMessage(t("taskTitleRequired")); return; }

    const newTask: ITask = {
      id: generateId(),
      title: taskTitle.trim(),
      difficulty,
      ownerEmail: currentUser ? currentUser.email : GUEST_OWNER,
      completed: false,
      createdAt: Date.now(),
    };

    if (currentUser) {
      await insertTask(newTask);
      dispatch(addTask(newTask));

      if (!currentUser.assignedTaskId) {
        const updated = { ...currentUser, assignedTaskId: newTask.id };
        await upsertUser(dbUser(updated));
        dispatch(updateUser(updated));
      }
    } else {
      const updatedTasks = [...tasks, newTask];
      saveGuestTasks(updatedTasks);
      dispatch(addTask(newTask));
    }

    setTaskTitle("");
    setDifficulty(3);
    setMessage(t("taskCreated"));
  };

  const handleComplete = async () => {
    if (!currentUser || !assignedTask) return;

    const completedTask = { ...assignedTask, completed: true };
    const updatedUser = {
      ...currentUser,
      points: currentUser.points + assignedTask.difficulty,
      assignedTaskId: undefined,
    };

    await Promise.all([
      updateTaskInDb(completedTask),
      upsertUser(dbUser(updatedUser)),
    ]);
    dispatch(updateTask(completedTask));
    dispatch(updateUser(updatedUser));
    setMessage(t("taskCompletedPoints", { points: assignedTask.difficulty }));
  };

  const handlePartnerRequestRespond = async (response: "accepted" | "rejected") => {
    if (!respondingRequest) return;
    try {
      await respondToPartnerRequest(respondingRequest.id, response);
      dispatch(removePendingRequest(respondingRequest.id));
      if (response === "accepted") {
        const { user: refreshed, partner: refreshedPartner } = await loadUserData(authEmail!);
        if (refreshed) {
          dispatch(updateUser(refreshed));
          if (refreshedPartner) dispatch(addUser(refreshedPartner));
        }
        setMessage(t("partnerLinked", { username: respondingRequest.fromUsername }));
      }
      const next = pendingRequests.find(r => r.id !== respondingRequest.id);
      setRespondingRequest(next ?? null);
    } catch {
      setMessage(t("genericError", "Error al responder la solicitud"));
    }
  };

  const handleWheelSelect = async (task: IWheelTask) => {
    if (currentUser) {
      const updated = { ...currentUser, assignedTaskId: task.id };
      await upsertUser(dbUser(updated));
      dispatch(updateUser(updated));
    } else {
      setGuestAssignedTaskId(task.id);
    }
    setMessage(t("taskAssigned", { title: task.title }));
  };

  // ── Shared header ─────────────────────────────────────────────────────────

  const header = (
    <AppHeader
      isSignedIn={!!isSignedIn}
      currentUser={currentUser}
      partner={partner}
      language={language}
      onLanguageChange={setLanguage}
      onSignOut={() => signOut()}
      onSignIn={() => openSignIn()}
      onSignUp={() => openSignUp()}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isSignedIn) {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="sm">
          <Stack spacing={3}>
            {header}

            <Alert
              severity="info"
              action={
                <Button color="inherit" size="small" onClick={() => openSignUp()}>
                  {t("createAccount", "Crear cuenta")}
                </Button>
              }
            >
              {t("guestModeNotice", "Estás en modo invitado. Las tareas se guardan localmente en este dispositivo.")}
            </Alert>

            <CreateTaskForm
              taskTitle={taskTitle}
              onTaskTitleChange={setTaskTitle}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              onSubmit={handleTaskCreate}
            />

            <SpinWheelSection
              tasks={incompleteTasks.map((t) => ({
                id: t.id,
                title: t.title,
                difficulty: t.difficulty,
              }))}
              onSelect={handleWheelSelect}
            />

            <ActiveTaskSection
              assignedTask={assignedTask}
              onComplete={() => {
                if (guestAssignedTaskId) {
                  const updated = tasks.map((t) =>
                    t.id === guestAssignedTaskId ? { ...t, completed: true } : t
                  );
                  saveGuestTasks(updated);
                  dispatch(setTasks(updated));
                  setGuestAssignedTaskId(undefined);
                  setMessage(t("taskCompletedPoints", { points: assignedTask?.difficulty ?? 0 }));
                }
              }}
            />

            <TaskListSection
              incompleteTasks={incompleteTasks}
              completedTasks={completedTasks}
              assignedTaskId={guestAssignedTaskId}
            />

            {message && (
              <Alert severity="info" onClose={() => setMessage(null)}>
                {message}
              </Alert>
            )}
          </Stack>
        </Container>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="sm">
          <Stack spacing={3}>
            {header}
            <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          {header}

          <StatsBar
            points={currentUser.points}
            pendingCount={incompleteTasks.length}
          />

          <CreateTaskForm
            taskTitle={taskTitle}
            onTaskTitleChange={setTaskTitle}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onSubmit={handleTaskCreate}
          />

          <SpinWheelSection
            tasks={incompleteTasks.map((t) => ({
              id: t.id,
              title: t.title,
              difficulty: t.difficulty,
            }))}
            onSelect={handleWheelSelect}
          />

          <PartnerSection
            soloMode={soloMode}
            onSoloModeChange={setSoloMode}
            partner={partner}
            currentUserEmail={currentUser.email}
            onRequestSent={(toEmail) =>
              setMessage(t("requestSentConfirm", { email: toEmail }))
            }
          />

          <ActiveTaskSection
            assignedTask={assignedTask}
            onComplete={handleComplete}
          />

          <TaskListSection
            incompleteTasks={incompleteTasks}
            completedTasks={completedTasks}
            assignedTaskId={currentUser.assignedTaskId}
          />

          {message && (
            <Alert severity="info" onClose={() => setMessage(null)}>
              {message}
            </Alert>
          )}
        </Stack>
      </Container>

      <Dialog open={!!respondingRequest} maxWidth="xs" fullWidth>
        <DialogTitle>{t("partnerRequestTitle", "Solicitud de compañero")}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {t("partnerRequestDesc", {
              username: respondingRequest?.fromUsername,
              email: respondingRequest?.fromEmail,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => handlePartnerRequestRespond("rejected")}>
            {t("reject", "Rechazar")}
          </Button>
          <Button variant="contained" onClick={() => handlePartnerRequestRespond("accepted")}>
            {t("accept", "Aceptar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
