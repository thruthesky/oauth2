import axios from "axios";
import { User, KakaoUser } from "./user.interface";
import { kakaoApiUrl, kakaoProvider } from "./config";

/**
 * Get user profile from Kakao API
 * @param token token from client
 */
export async function getKakaoUser(token: string): Promise<User> {
  const kakaoUser: KakaoUser = await axios.get(kakaoApiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  /**
   * 카카오 회원 정보를 임의 가공해서 리턴. 파이어베이스에서 회원 정보 생성시 사용.
   *
   * uid 는 파이어베이스에서 생성될 사용자 UID
   * email 은 파이어베이스에서 생성될 사용자 이메일. 만약, 카카오톡 email 정보가 전달되지 않았다면, 임의로 생성.
   * 단, 사용자마다 고유한, 그리고 사용자를 특정 할 수 있는 이메일 주소이어야 하므로, 회원 번호로 작성.
   */
  const user: User = {
    uid: `kakao:${kakaoUser.data.id}`,
    email:
      kakaoUser.data.kakao_account.email || "${kakaoUser.data.id}@kakao.com",
    displayName: kakaoUser.data.properties.nickname || "",
    photoURL: kakaoUser.data.properties.profile_image || "",
    provider: kakaoProvider,
  };
  return user;
}
