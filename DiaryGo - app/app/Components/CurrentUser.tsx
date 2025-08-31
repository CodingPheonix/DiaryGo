import { useState, useEffect, useCallback } from "react";
import { fetchSession } from "../Utilities/actions/auth";

// Custom hook
export function CurrentUser() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const session = await fetchSession(); // your existing session fetch
    if (session) {
      const response = await fetch(`/api/auth?userId=${session.userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      return { response, result };
    }
  }, []);

  useEffect(() => {
    const receiveSession = async () => {
      const answer = await fetchCurrentUser();
      if (answer?.response?.status === 200) {
        setCurrentUser(answer.result.data._id);
      }
    };
    receiveSession();
  }, [fetchCurrentUser]);

  return currentUser;
}
