import * as functions from "firebase-functions";
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
import axios from "axios";
const qs = require("qs");
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
 * @param userModel
 */
async function upudateOrCreateUser(userModel: User) {
  const updateParams = {
    uid: userModel.uid,
    provider: userModel.provider,
    displayName: userModel.displayName,
    photoURL: userModel.photoURL,
    email: userModel.email,
  };
  try {
    await admin.auth().updateUser(userModel.uid, updateParams);
  } catch (error: any) {
    console.log("Error updating user:", error);
    if (error.code === "auth/user-not-found") {
      return admin.auth().createUser(updateParams);
    }
    throw error;
  }
}

function authHandler(fn: Function, provider: string) {
  return functions
    .region(region)
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

        let res;
        try {
          /**
           * 주의: 여기에 사용하는 redirectUri 는 Encoding 하지 않은 체로 지정해야 한다.
           * 주의: 만약, 인코딩을 해서 지정하면 이중 인코딩이 되는 것 같다. 400 Bad Request 에러가 발생하며,
           * 주의: 이 문제로 약 1시간 묶여 있었다.
           */
          const data = qs.stringify({
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
          await upudateOrCreateUser(user);

          // Generate custom firebase token and return to client
          const firebaseToken = await admin
            .auth()
            .createCustomToken(user.uid, { provider });
          response.send({ firebaseToken });
        } catch (error) {
          console.log(`Error: ${provider} auth handler`, error);
          response.status(500).send("Internal Server Error");
        }
      });
    });
}

exports.kakaoLogin = authHandler(getKakaoUser, kakaoProvider);
exports.naverLogin = authHandler(getNaverUser, naverProvider);
