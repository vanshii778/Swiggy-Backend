import { createContext } from "react";

// This context will hold the logged-in user's name and a function to update it.
const UserContext = createContext({
  loggedInUser: null,
  setUserName: () => {}, // A placeholder function
});

export default UserContext;
