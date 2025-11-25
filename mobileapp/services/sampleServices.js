import axios from "axios";

export const sampleGetRequest = () => {
  return axios.get(`https://api.adviceslip.com/advice`, {
    headers: {
      "Content-Type": "application/json",
    },
    // withCredentials: true,
  });
};
