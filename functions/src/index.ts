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
  workOn,
  debugLog,
  localKakaoRedirectUri,
  remoteKakaoRedirectUri,
  restApiKeyKakao,
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
  if (debugLog) {
    console.log("updateParams", updateParams);
  }
  try {
    await admin.auth().updateUser(userModel.uid, updateParams);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (debugLog) {
      console.log(
        "Error updating user:",
        error.code,
        error.message,
        " Going to create this user."
      );
    }
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
          const state = req.query?.state;

          let callbackUrl: string;
          if (workOn == "local") {
            callbackUrl = localKakaoRedirectUri;
          } else {
            callbackUrl = remoteKakaoRedirectUri;
          }

          if (!code) {
            return response.status(403).send("Didn't get authorized code.");
          }

          if (debugLog) {
            console.log("[Success] got code ", req.query);
          }

          /**
           * 카카오톡 로그인 토큰 가져오기
           *
           * 네이버 로그인은 아래와 같은 비슷한 코드로 가져오면 되는데, 실제 개발 작업을 하지는 않았다.
           * 차 후, 필요할 때 적절히 수정해서 사용하면 된다.
           */
          let res;
          try {
            /**
             * 주의: 여기에 사용하는 redirectUri 는 Encoding 하지 않은 체로 지정해야 한다.
             * 함수 로그에서 보면 자동 인코딩 자동 인코딩 되어져 있다.
             * 경우에 따라 이 인코딩 문제로 에러가 생기는 것 같은 느낌이다.
             *
             * 주의: redirect_uir 에는 로컬 테스트 할 때는 local url 을 지정해야 KOE006 에러를 면 할 수 있다.
             */
            const data = new URLSearchParams({
              grant_type: "authorization_code",
              client_id: restApiKeyKakao,
              redirect_uri: callbackUrl,
              code: code,
            });
            if (debugLog) {
              console.log("data", data);
            }
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
            if (debugLog) {
              console.log("Error on axios.post(/oauth/token) ", error);
            }
            return response
              .status(500)
              .send(`Internal Server Error, ${error.message}`);
          }

          const token: TokenResponse = res.data;
          if (debugLog) {
            console.log("got token; ", token);
          }
          try {
            const user: User = await fn(token.access_token);
            await updateOrCreateUser(user);

            // Generate custom firebase token and return to client
            const firebaseToken = await admin
              .auth()
              .createCustomToken(user.uid);

            await admin.firestore().collection("temp").doc(state).set(
              {
                token: firebaseToken,
              },
              { merge: true }
            );

            // response.send({ firebaseToken });
            return response.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Redirecting...</title>
                <style>
                
                body {
                  margin:0 auto;
                  font-family: 'Apple SD Gothic Neo','Malgun Gothic',arial,sans-serif;
                  font-size: 14px;
                }
                div.content {
                    margin:0 auto; width:100%; text-align:center; padding-top:100px;
                  }
                .loader {
                  margin: 0 auto;
                  width: 32px;
                  height: 32px;
                  border: 4px solid #f3f3f3;
                }
                .mt-1 {
                  margin-top: 1rem;
                }
                .rotate {
                  width: 32px;
                  animation: rotation 2s infinite linear;
                }
                @keyframes rotation {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(359deg);
                  }
                }
                </style>
                <script>
                  window.location.href = "https://withcentertest.page.link/Kz3a";
                </script>
              </head>
              <body>
                
                <div class="content">
                <div class="loader rotate"></div>
                <div class="mt-1">
                ...
                  <div class="mt-1">카카오톡으로 로그인 중입니다.</div>
                  <div class="mt-1" style="color:grey;">잠시만 기다려주세요.</div>
                </div>
                </div>
              </body>
            </html>
              `);
          } catch (error) {
            if (debugLog) {
              console.log(`Error: ${provider} auth handler`, error);
            }
            response.status(500).send("Internal Server Error");
          }
        });
      })
  );
}

exports.kakaoLogin = authHandler(getKakaoUser, kakaoProvider);
exports.naverLogin = authHandler(getNaverUser, naverProvider);
