import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require("cors")({origin: true});
import axios from "axios";
// import qs = require("qs");
import {User} from "./auth/user.interface";
import {getKakaoUser} from "./auth/kakao.user";
import {getNaverUser} from "./auth/naver.user";
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
import {TokenResponse} from "./auth/token.interface";

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
  updateParams.displayName = userModel.displayName ?
    userModel.displayName :
    "No display name";

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
              response
                  .status(403)
                  .send(
                      `Error: {$req.query.error}, Description: ${req.query.error_description}`
                  );
              return;
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
              response.status(403).send("Didn't get authorized code.");
              return;
            }

            if (debugLog) {
              console.log("[Success] got code ", req.query);
            }

            /**
           * ???????????? ????????? ?????? ????????????
           *
           * ????????? ???????????? ????????? ?????? ????????? ????????? ???????????? ?????????, ?????? ?????? ????????? ????????? ?????????.
           * ??? ???, ????????? ??? ????????? ???????????? ???????????? ??????.
           */
            let res;
            try {
            /**
             * ??????: ????????? ???????????? redirectUri ??? Encoding ?????? ?????? ?????? ???????????? ??????.
             * ?????? ???????????? ?????? ?????? ????????? ?????? ????????? ????????? ??????.
             * ????????? ?????? ??? ????????? ????????? ????????? ????????? ??? ?????? ????????????.
             *
             * ??????: redirect_uir ?????? ?????? ????????? ??? ?????? local url ??? ???????????? KOE006 ????????? ??? ??? ??? ??????.
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
              response
                  .status(500)
                  .send(
                      `Internal Server Error On Getting Auth Token ${error.message}`
                  );
              return;
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
              if (debugLog) {
                console.log("Firebase custom token; ", firebaseToken);
              }
              await admin.firestore().collection("temp").doc(state).set(
                  {
                    token: firebaseToken,
                  },
                  {merge: true}
              );

              if (debugLog) {
                console.log("[Success] Set custom token to temp doc; ");
              }

              response.status(200).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <script>
                  window.location.href = "https://withcentertest.page.link/Kz3a";
                </script>
              </head>
              <body>
              </body>
            </html>
              `);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
              if (debugLog) {
                console.log(`Error: ${provider} auth handler`, error);
              }
              response
                  .status(500)
                  .send(
                      `Internal Server Error On Get Kakao User Info, Firebase Auth Create or Update: ${error.code}, ${error.message}`
                  );
            }
          });
        })
  );
}

exports.kakaoLogin = authHandler(getKakaoUser, kakaoProvider);
exports.naverLogin = authHandler(getNaverUser, naverProvider);
