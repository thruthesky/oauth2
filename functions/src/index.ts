import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require("cors")({ origin: true });
import axios from "axios";
// import qs = require("qs");
import { User } from "./auth/user.interface";
import { getKakaoUser } from "./auth/kakao.user";
import { getNaverUser } from "./auth/naver.user";
import {
  kakaoProvider,
  region,
  naverProvider,
  restApiKey,
  redirectUri,
} from "./auth/config";
import { TokenResponse } from "./auth/token.interface";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

/**
 * Update Firebase user with the given email, create if none exists
 * @param {User} userModel
 */
async function updateOrCreateUser(userModel: User) {
  const updateParams = {
    uid: userModel.uid,
    email: userModel.email,
  } as User;
  updateParams.displayName = userModel.displayName
    ? userModel.displayName
    : "No display name";

  if (userModel.photoURL) {
    updateParams.photoURL = userModel.photoURL;
  }
  console.log("updateParams", updateParams);
  try {
    await admin.auth().updateUser(userModel.uid, updateParams);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log("Error updating user:", error.code, error.message);
    await admin.auth().createUser(updateParams);
  }
}

// eslint-disable-next-line valid-jsdoc
/**
 * Auth handler
 *
 * @param {Function} fn callback function to get user profile from provider
 * @param {string} provider provider name
 * @returns
 */
function authHandler(fn: (token: string) => Promise<User>, provider: string) {
  return (
    functions
      .region(region)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .https.onRequest(async (req: any, response: any) => {
        return cors(req, response, async () => {
          if (req.query?.error) {
            return response
              .status(403)
              .send(
                `Error: {$req.query.error}, Description: ${req.query.error_description}`
              );
          }
          const code = req.query?.code;

          if (!code) {
            return response.status(403).send("Didn't get authorized code.");
          }

          console.log("[Success] got code ", req.query);

          /**
           * 카카오톡 로그인 토큰 가져오기
           *
           * 네이버 로그인은 아래와 같은 비슷한 코드로 가져오면 된다.
           */
          let res;
          try {
            /**
             * 주의: 여기에 사용하는 redirectUri 는 Encoding 하지 않은 체로 지정해야 한다.
             * 함수 로그에서 보면 자동 인코딩 자동 인코딩 되어져 있다.
             * 경우에 따라 이 인코딩 문제로 에러가 생기는 것 같은 느낌이다.
             */
            const data = new URLSearchParams({
              grant_type: "authorization_code",
              client_id: restApiKey,
              redirect_uri: redirectUri,
              code: code,
            });
            console.log("data", data);
            res = await axios({
              method: "POST",
              url: "https://kauth.kakao.com/oauth/token",
              data: data,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            console.log("Error on axios.post(/oauth/token) ", error);

            return response
              .status(500)
              .send(`Internal Server Error, ${error.message}`);
          }

          const token: TokenResponse = res.data;
          console.log("got token; ", token);
          try {
            const user: User = await fn(token.access_token);
            await updateOrCreateUser(user);

            // Generate custom firebase token and return to client
            const firebaseToken = await admin
              .auth()
              .createCustomToken(user.uid);
            response.send({ firebaseToken });
          } catch (error) {
            console.log(`Error: ${provider} auth handler`, error);
            response.status(500).send("Internal Server Error");
          }
        });
      })
  );
}

exports.kakaoLogin = authHandler(getKakaoUser, kakaoProvider);
exports.naverLogin = authHandler(getNaverUser, naverProvider);
