import axiosInstance from "./utils/axiosInstance";


export const eventInformation = async (eventId: string) => {
  try {
    const result = await axiosInstance.get(`/event/getEvent/${eventId}`);

    if (result.status !== 200) {
      throw new Error("Failed to fetch event information");
    }

    return result.data;
    
  } catch (err: any) {
    console.error("Error fetching event information:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const fetchEventBets = async (eventId: string) => {

  try {
    const bets = await axiosInstance.get(`/event/getEventBets/${eventId}`);

    if (bets.status !== 200) {
      throw new Error("Failed to fetch event bets");
    };

    return bets.data;
    
  } catch (err: any) {
    console.error("Error fetching event bets:", err);
    return { error: true, msg: err.response.data.error };
  }
}

export const placeBet = async (eventId: string, question: string, option: string, amount: number) => {
  try {
    const response = await axiosInstance.post(`/event/placeBet/${eventId}`, {
      question,
      option,
      amount
    });

    if (response.status !== 201 || !response.data.success) {
      throw new Error("Failed to place bet");
    };

    return response.data;
    
  } catch (err: any) {
    console.error("Error placing bet:", err);
    const msg = err?.response?.data?.error || err.message || 'Unknown error';
    return { error: true, msg };
  }
};


export const lockEvent = async (eventId: string) => {
  try {
    const result = await axiosInstance.patch(`/event/lockEvent/${eventId}`);

    if (result.status !== 200) {
      throw new Error("Failed to lock event");
    }

    return result.data;
    
  } catch (err: any) {
    console.error("Error locking event:", err);
    return { error: true, msg:  err.response.data.error };
  }
};


export const endEvent = async (eventId: string, winningOptions: Record<string, string>) => {
  try {
    const result = await axiosInstance.post(`/event/endEvent/${eventId}`, {winningOptions: winningOptions});

    if (result.status !== 200) {
      throw new Error("Failed to end event");
    }

    return result.data;
    
  } catch (err: any) {
    console.error("Error ending event:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const followRequest = async (followed: string) => {
  try {
    const result = await axiosInstance.post(`followers/request/${followed}`);

    return result.data

  } catch (err: any) {
    console.error("Error Following:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const unfollowRequest = async (unfollowed: string) => {
  try {
    const result = await axiosInstance.delete(`followers/unfollow/${unfollowed}`);

    return result.data

  } catch (err: any) {
    console.error("Error unfollowing:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const saveTemplate = async (template: string) => {
  try {
    const result = await axiosInstance.post(`users/save/template/${template}`);

    return result.data

  } catch (err: any) {
    console.error("Error saving template:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const postTemplate = async (template: string) => {
  try {
    const result = await axiosInstance.patch(`event/postTemplate/${template}`);

    return result.data

  } catch (err: any) {
    console.error("Error saving template:", err);
    return { error: true, msg:  err.response.data.error };
  }

}