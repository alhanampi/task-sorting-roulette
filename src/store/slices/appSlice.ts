import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IAppState, IPartnerRequest, ITask, IUser } from "../../utils/interfaces";

const initialState: IAppState = { users: [], tasks: [], pendingRequests: [] };

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<IUser[]>) {
      state.users = action.payload;
    },
    setTasks(state, action: PayloadAction<ITask[]>) {
      state.tasks = action.payload;
    },
    addUser(state, action: PayloadAction<IUser>) {
      state.users.push(action.payload);
    },
    addTask(state, action: PayloadAction<ITask>) {
      state.tasks.push(action.payload);
    },
    updateUser(state, action: PayloadAction<IUser>) {
      state.users = state.users.map(user =>
        user.email === action.payload.email ? action.payload : user
      );
    },
    updateTask(state, action: PayloadAction<ITask>) {
      state.tasks = state.tasks.map(task =>
        task.id === action.payload.id ? action.payload : task
      );
    },
    setPendingRequests(state, action: PayloadAction<IPartnerRequest[]>) {
      state.pendingRequests = action.payload;
    },
    removePendingRequest(state, action: PayloadAction<string>) {
      state.pendingRequests = state.pendingRequests.filter(r => r.id !== action.payload);
    },
  },
});

export const {
  setUsers, setTasks, addUser, addTask, updateUser, updateTask,
  setPendingRequests, removePendingRequest,
} = appSlice.actions;
export default appSlice.reducer;
