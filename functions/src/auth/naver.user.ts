import axios from "axios";
import {User, NaverUser} from "./user.interface";
import {naverApiUrl} from "./config";

/**
 * Get user profile from Naver API
 * @param {string} token token from client
 */
export async function getNaverUser(token: string): Promise<User> {
  const naverUser: NaverUser = await axios.get(naverApiUrl, {
    headers: {Authorization: `Bearer ${token}`},
  });
  const user: User = {
    uid: `naver:${naverUser.data.response.email}`,
    email: naverUser.data.response.email,
    displayName: naverUser.data.response.nickname || "",
    photoURL: naverUser.data.response.profile_image || "",
  };
  return user;
}
